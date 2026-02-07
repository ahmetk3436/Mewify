import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Text, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ProgressHeader from '../../components/glow-plan/ProgressHeader';
import CategoryFilter from '../../components/glow-plan/CategoryFilter';
import RecommendationCard from '../../components/glow-plan/RecommendationCard';
import { hapticSuccess, hapticSelection } from '../../lib/haptics';
import api from '../../lib/api';
import {
  Recommendation,
  CategoryType,
  ProgressStats,
} from '../../types/glow-plan';

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
    } catch (err) {
      setError('Failed to load your glow plan.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  // Calculate progress whenever recommendations change
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
    // Optimistic update
    const previousRecommendations = [...recommendations];
    setRecommendations((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, completed } : rec))
    );
    hapticSuccess();

    try {
      await api.put(`/glow-plan/${id}/complete`);
    } catch (err) {
      // Revert on error
      setRecommendations(previousRecommendations);
      Alert.alert('Error', 'Failed to update. Please try again.');
    }

    // Check if all completed
    const updatedCompleted = recommendations.filter((r) =>
      r.id === id ? completed : r.completed
    ).length;
    if (completed && updatedCompleted === recommendations.length) {
      Alert.alert('Congratulations!', 'You completed your entire glow plan!');
    }
  };

  const handleRegeneratePlan = async () => {
    Alert.alert(
      'Regenerate Plan',
      'This will create a new personalized glow plan based on your latest analysis. Continue?',
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
              Alert.alert('Success', 'Your new glow plan is ready!');
            } catch (err) {
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

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="px-5 pt-5 pb-4">
          <Text className="text-2xl font-bold text-gray-900">Your Glow Plan</Text>
        </View>
        <View className="px-5 gap-3">
          <View className="bg-gray-200 rounded-xl h-24" />
          <View className="bg-gray-200 rounded-xl h-24" />
          <View className="bg-gray-200 rounded-xl h-24" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <ProgressHeader progress={progress} />
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 96 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#2563eb"
            />
          }
        >
          {error ? (
            <View className="items-center py-16">
              <Ionicons name="cloud-offline-outline" size={48} color="#ef4444" />
              <Text className="text-red-500 mt-4 text-center">{error}</Text>
              <TouchableOpacity
                onPress={loadRecommendations}
                className="mt-4 bg-blue-600 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : recommendations.length === 0 ? (
            <View className="items-center py-16">
              <Ionicons name="sparkles-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-500 mt-4 text-center px-8">
                Your glow plan will appear after your first face scan
              </Text>
              <TouchableOpacity
                onPress={() => {
                  hapticSelection();
                  router.push('/(protected)/(tabs)');
                }}
                className="mt-4 bg-blue-600 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold">Scan Your Face</Text>
              </TouchableOpacity>
            </View>
          ) : filteredRecommendations.length === 0 ? (
            <View className="flex-1 items-center justify-center pt-20">
              <Ionicons name="leaf-outline" size={48} color="#d1d5db" />
              <Text className="mt-4 text-gray-500">No recommendations in this category.</Text>
            </View>
          ) : (
            filteredRecommendations.map((item) => (
              <RecommendationCard
                key={item.id}
                recommendation={item}
                onToggleComplete={handleToggleComplete}
              />
            ))
          )}
        </ScrollView>

        {/* Floating Action Button for Regenerate */}
        {recommendations.length > 0 && (
          <View className="absolute bottom-6 left-0 right-0 px-5">
            <TouchableOpacity
              onPress={handleRegeneratePlan}
              disabled={isRegenerating}
              className={`flex-row items-center justify-center bg-blue-600 py-4 rounded-xl shadow-lg ${
                isRegenerating ? 'opacity-70' : ''
              }`}
              activeOpacity={0.8}
            >
              {isRegenerating ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={20} color="#ffffff" />
                  <Text className="ml-2 text-base font-semibold text-white">
                    Regenerate Plan
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
