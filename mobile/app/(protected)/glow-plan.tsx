import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Text, Alert, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { hapticSuccess, hapticSelection } from '../../lib/haptics';
import api from '../../lib/api';
import {
  Recommendation,
  CategoryType,
  ProgressStats,
} from '../../types/glow-plan';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

// Responsive sizing
const SIZES = {
  iconSm: isSmallDevice ? 16 : 18,
  iconMd: isSmallDevice ? 18 : 20,
  iconLg: isSmallDevice ? 20 : 22,
  buttonHeight: isSmallDevice ? 48 : 52,
  fontSize: {
    xs: isSmallDevice ? 10 : 11,
    sm: isSmallDevice ? 12 : 13,
    base: isSmallDevice ? 14 : 15,
    lg: isSmallDevice ? 16 : 18,
    xl: isSmallDevice ? 20 : 24,
  },
  spacing: {
    xs: isSmallDevice ? 4 : 6,
    sm: isSmallDevice ? 8 : 12,
    md: isSmallDevice ? 12 : 16,
    lg: isSmallDevice ? 16 : 20,
    xl: isSmallDevice ? 20 : 24,
  },
};

// Category data with colors
const CATEGORIES: { id: CategoryType; icon: string; color: string; bg: string }[] = [
  { id: 'All', icon: 'grid-outline', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' },
  { id: 'Fitness', icon: 'barbell-outline', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
  { id: 'Skincare', icon: 'water-outline', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' },
  { id: 'Nutrition', icon: 'restaurant-outline', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
  { id: 'Lifestyle', icon: 'sunny-outline', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.15)' },
];

// Difficulty colors
const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  easy: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' },
  medium: { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' },
  hard: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' },
};

export default function GlowPlanScreen() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All');
  const [progress, setProgress] = useState<ProgressStats>({ completed: 0, total: 0 });
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecommendations = async () => {
    try {
      setError(null);
      const response = await api.get('/glow-plan');
      const data = response.data.data;

      if (Array.isArray(data) && data.length > 0) {
        const mapped: Recommendation[] = data.map((item: any) => ({
          id: item.id,
          category: item.category || 'Fitness',
          title: item.title || '',
          description: item.description || '',
          difficulty: item.difficulty || 'medium',
          timeframeWeeks: item.timeframe_weeks || item.timeframeWeeks || 4,
          priority: item.priority || false,
          completed: item.completed || false,
        }));
        setRecommendations(mapped);
      } else {
        setRecommendations([]);
      }
    } catch {
      setError('Failed to load your glow plan.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  useEffect(() => {
    const completed = recommendations.filter((r) => r.completed).length;
    const total = recommendations.length;
    setProgress({ completed, total });
  }, [recommendations]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRecommendations();
    setIsRefreshing(false);
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    const previousRecommendations = [...recommendations];
    setRecommendations((prev) => prev.map((rec) => (rec.id === id ? { ...rec, completed } : rec)));
    hapticSuccess();

    try {
      await api.put(`/glow-plan/${id}/complete`);
    } catch {
      setRecommendations(previousRecommendations);
      Alert.alert('Error', 'Failed to update. Please try again.');
    }

    const updatedCompleted = recommendations.filter((r) => (r.id === id ? completed : r.completed)).length;
    if (completed && updatedCompleted === recommendations.length) {
      Alert.alert('🔥 Nice streak!', 'You completed every action in this glow plan.');
    }
  };

  const handleRegeneratePlan = async () => {
    Alert.alert(
      '🔄 Regenerate Plan',
      'Create a fresh AI plan from your latest analysis?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          onPress: async () => {
            setIsRegenerating(true);
            try {
              const response = await api.post('/glow-plan/generate');
              if (response.data.data && Array.isArray(response.data.data)) {
                const mapped: Recommendation[] = response.data.data.map((item: any) => ({
                  id: item.id,
                  category: item.category || 'Fitness',
                  title: item.title || '',
                  description: item.description || '',
                  difficulty: item.difficulty || 'medium',
                  timeframeWeeks: item.timeframe_weeks || item.timeframeWeeks || 4,
                  priority: item.priority || false,
                  completed: item.completed || false,
                }));
                setRecommendations(mapped);
                setSelectedCategory('All');
              }
              hapticSuccess();
            } catch {
              Alert.alert('Error', 'Failed to regenerate plan. Please try again.');
            } finally {
              setIsRegenerating(false);
            }
          },
        },
      ]
    );
  };

  const handleCategorySelect = (category: CategoryType) => {
    hapticSelection();
    setSelectedCategory(category);
  };

  const filteredRecommendations =
    selectedCategory === 'All'
      ? recommendations
      : recommendations.filter((r) => r.category === selectedCategory);

  const progressPercent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#000000]">
        <View className="px-5 pt-5 pb-4">
          <Text className="text-2xl font-bold text-white">Glow Plan</Text>
        </View>
        <View className="gap-3 px-5">
          <View className="h-24 rounded-2xl bg-slate-800/50" />
          <View className="h-24 rounded-2xl bg-slate-800/50" />
          <View className="h-24 rounded-2xl bg-slate-800/50" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#000000]" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#8B5CF6" />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-2 pb-4">
          <TouchableOpacity
            onPress={() => {
              hapticSelection();
              router.back();
            }}
            className="h-11 w-11 items-center justify-center rounded-full bg-white/5"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <Ionicons name="chevron-back" size={22} color="#94a3b8" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Glow Plan</Text>
          <TouchableOpacity
            onPress={() => {
              hapticSelection();
              router.push('/(protected)/progress');
            }}
            className="h-11 w-11 items-center justify-center rounded-full bg-white/5"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <Ionicons name="analytics-outline" size={20} color="#8B5CF6" />
          </TouchableOpacity>
        </View>

        {/* Progress Card */}
        <Animated.View entering={FadeInUp.delay(100).springify()} className="mx-5 mb-5">
          <LinearGradient
            colors={['#1E1B4B', '#0F172A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-3xl p-5 border border-violet-500/20"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-sm text-slate-400 mb-1">Weekly Progress</Text>
                <Text className="text-3xl font-bold text-white">{progressPercent}%</Text>
                <Text className="text-sm text-slate-500 mt-1">
                  {progress.completed} of {progress.total} tasks done
                </Text>
              </View>
              {/* Progress Ring */}
              <View className="relative h-20 w-20 items-center justify-center">
                <View
                  className="absolute rounded-full border-4 border-slate-700"
                  style={{ width: 72, height: 72 }}
                />
                <View
                  className="absolute rounded-full border-4 border-violet-500"
                  style={{
                    width: 72,
                    height: 72,
                    borderTopColor: progressPercent > 25 ? '#8B5CF6' : 'transparent',
                    borderRightColor: progressPercent > 50 ? '#8B5CF6' : 'transparent',
                    borderBottomColor: progressPercent > 75 ? '#8B5CF6' : 'transparent',
                    transform: [{ rotate: `${(progressPercent / 100) * 360 - 90}deg` }],
                  }}
                />
                <Ionicons
                  name={progressPercent === 100 ? 'checkmark-circle' : 'flame'}
                  size={28}
                  color={progressPercent === 100 ? '#10B981' : '#8B5CF6'}
                />
              </View>
            </View>

            {/* Streak Indicator */}
            {progress.completed > 0 && (
              <View className="mt-4 flex-row items-center">
                <View className="flex-row items-center px-3 py-1.5 rounded-full bg-amber-500/20">
                  <Ionicons name="flame" size={14} color="#F59E0B" />
                  <Text className="ml-1.5 text-xs font-semibold text-amber-400">
                    {progress.completed} completed
                  </Text>
                </View>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Category Pills */}
        <View className="px-5 mb-5">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => handleCategorySelect(cat.id)}
                className={`flex-row items-center px-4 py-2.5 rounded-full border ${
                  selectedCategory === cat.id
                    ? 'border-violet-500/50'
                    : 'border-slate-700/50'
                }`}
                style={{
                  backgroundColor: selectedCategory === cat.id ? cat.bg : 'rgba(15, 23, 42, 0.5)',
                  minHeight: 40,
                }}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={16}
                  color={selectedCategory === cat.id ? cat.color : '#64748b'}
                />
                <Text
                  className={`ml-2 text-sm font-medium ${
                    selectedCategory === cat.id ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {cat.id}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Error State */}
        {error ? (
          <Animated.View entering={FadeIn.springify()} className="items-center py-16 px-8">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-red-500/20 mb-4">
              <Ionicons name="cloud-offline-outline" size={32} color="#EF4444" />
            </View>
            <Text className="text-center text-red-400 text-base mb-4">{error}</Text>
            <TouchableOpacity
              onPress={loadRecommendations}
              className="flex-row items-center px-6 py-3 rounded-xl bg-violet-600"
              style={{ minHeight: 48 }}
            >
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text className="ml-2 font-semibold text-white">Retry</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : recommendations.length === 0 ? (
          /* Empty State */
          <Animated.View entering={FadeIn.springify()} className="items-center py-16 px-8">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-violet-500/20 mb-4">
              <Ionicons name="sparkles-outline" size={40} color="#8B5CF6" />
            </View>
            <Text className="text-xl font-bold text-white mb-2">No Plan Yet</Text>
            <Text className="text-center text-slate-400 mb-6">
              Your personalized glow plan will appear after your first face scan.
            </Text>
            <TouchableOpacity
              onPress={() => {
                hapticSelection();
                router.push('/(protected)/(tabs)');
              }}
              className="flex-row items-center px-6 py-3.5 rounded-xl"
              style={{ minHeight: 52, backgroundColor: '#7C3AED' }}
            >
              <Ionicons name="camera" size={20} color="#fff" />
              <Text className="ml-2 font-semibold text-white">Take First Scan</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : filteredRecommendations.length === 0 ? (
          <Animated.View entering={FadeIn.springify()} className="items-center py-16">
            <Ionicons name="leaf-outline" size={48} color="#64748b" />
            <Text className="mt-4 text-slate-400">No recommendations in this category.</Text>
          </Animated.View>
        ) : (
          /* Recommendation Cards */
          <View className="px-5 pb-32">
            {filteredRecommendations.map((item, index) => {
              const categoryData = CATEGORIES.find((c) => c.id === item.category) || CATEGORIES[0];
              const difficultyData = DIFFICULTY_COLORS[item.difficulty || 'medium'];

              return (
                <Animated.View
                  key={item.id}
                  entering={FadeInUp.delay(index * 50).springify()}
                  className={`mb-3 rounded-2xl border ${
                    item.completed
                      ? 'bg-emerald-500/10 border-emerald-500/20'
                      : 'bg-[#0F172A] border-slate-800'
                  }`}
                >
                  <TouchableOpacity
                    onPress={() => handleToggleComplete(item.id, !item.completed)}
                    className="p-4"
                    style={{ minHeight: 44 }}
                    activeOpacity={0.8}
                  >
                    <View className="flex-row items-start">
                      {/* Checkbox */}
                      <View
                        className={`h-6 w-6 rounded-full items-center justify-center mr-3 mt-0.5 ${
                          item.completed ? 'bg-emerald-500' : 'bg-slate-800 border border-slate-600'
                        }`}
                      >
                        {item.completed && (
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        )}
                      </View>

                      <View className="flex-1">
                        {/* Category & Difficulty */}
                        <View className="flex-row items-center flex-wrap gap-2 mb-2">
                          <View
                            className="flex-row items-center px-2 py-1 rounded-full"
                            style={{ backgroundColor: categoryData.bg }}
                          >
                            <Ionicons name={categoryData.icon as any} size={10} color={categoryData.color} />
                            <Text className="ml-1 text-[10px] font-medium" style={{ color: categoryData.color }}>
                              {item.category}
                            </Text>
                          </View>
                          <View
                            className="px-2 py-1 rounded-full"
                            style={{ backgroundColor: difficultyData.bg }}
                          >
                            <Text className="text-[10px] font-medium" style={{ color: difficultyData.text }}>
                              {item.difficulty || 'medium'}
                            </Text>
                          </View>
                          {item.priority && (
                            <View className="px-2 py-1 rounded-full bg-amber-500/20">
                              <Text className="text-[10px] font-medium text-amber-400">priority</Text>
                            </View>
                          )}
                        </View>

                        {/* Title */}
                        <Text
                          className={`text-base font-semibold mb-1 ${
                            item.completed ? 'text-slate-500 line-through' : 'text-white'
                          }`}
                        >
                          {item.title}
                        </Text>

                        {/* Description */}
                        <Text
                          className={`text-sm ${
                            item.completed ? 'text-slate-600' : 'text-slate-400'
                          }`}
                          numberOfLines={2}
                        >
                          {item.description}
                        </Text>

                        {/* Timeframe */}
                        <View className="flex-row items-center mt-3">
                          <Ionicons name="time-outline" size={12} color="#64748b" />
                          <Text className="ml-1 text-xs text-slate-500">
                            {item.timeframeWeeks} week{item.timeframeWeeks > 1 ? 's' : ''}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {recommendations.length > 0 && (
        <Animated.View entering={FadeInUp.delay(300)} className="absolute bottom-6 left-5 right-5">
          <TouchableOpacity
            onPress={handleRegeneratePlan}
            disabled={isRegenerating}
            className="overflow-hidden rounded-2xl"
            style={{ minHeight: 56 }}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#7C3AED', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="flex-row items-center justify-center py-4"
            >
              {isRegenerating ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="refresh" size={20} color="#ffffff" />
                  <Text className="ml-2 text-base font-bold text-white">Regenerate Plan</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
