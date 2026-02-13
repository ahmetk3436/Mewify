import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, Text, Image, Modal, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInUp,
  FadeIn,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, Stop, LinearGradient as SvgGradient } from 'react-native-svg';
import { hapticSelection, hapticSuccess } from '../../lib/haptics';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { loadGuestAnalyses, normalizeGuestAnalysis, saveGuestAnalyses } from '../../lib/guestAnalysisHistory';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;
const CARD_SPACING = isSmallDevice ? 12 : 16;

interface Analysis {
  id: string;
  image_url: string;
  overall_score: number;
  analyzed_at: string;
}

interface CompareState {
  first: Analysis | null;
  second: Analysis | null;
}

// Time filter options
type TimeFilter = 'week' | 'month' | 'all';

// Journey Progress Ring
const JourneyProgressRing = ({ progress, totalScans }: { progress: number; totalScans: number }) => {
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (circumference * progress);

  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 40000, easing: Easing.linear }),
      -1,
      false
    );

    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View entering={ZoomIn.delay(200).springify()} className="items-center py-6">
      <View className="relative" style={{ width: size, height: size }}>
        {/* Orbiting dots */}
        <Animated.View style={[{ position: 'absolute', width: size, height: size }, orbitStyle]}>
          <View style={{ position: 'absolute', top: -6, left: size / 2 - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#8B5CF6' }} />
          <View style={{ position: 'absolute', bottom: -6, left: size / 2 - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EC4899' }} />
        </Animated.View>

        {/* Outer glow */}
        <Animated.View
          style={[{ position: 'absolute', width: size + 20, height: size + 20, left: -10, top: -10, borderRadius: (size + 20) / 2 }, pulseStyle]}
        >
          <LinearGradient
            colors={['rgba(124, 58, 237, 0.3)', 'rgba(124, 58, 237, 0)']}
            style={{ flex: 1, borderRadius: (size + 20) / 2 }}
          />
        </Animated.View>

        {/* SVG Ring */}
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Defs>
            <SvgGradient id="journeyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#8B5CF6" />
              <Stop offset="50%" stopColor="#EC4899" />
              <Stop offset="100%" stopColor="#F59E0B" />
            </SvgGradient>
          </Defs>
          {/* Background ring */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress ring */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#journeyGradient)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>

        {/* Center content */}
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-5xl font-bold text-white">{totalScans}</Text>
          <Text className="text-slate-500 text-sm mt-1">Total Scans</Text>
          <View className="flex-row items-center mt-2 px-3 py-1 rounded-full bg-violet-500/20">
            <Ionicons name="trending-up" size={12} color="#8B5CF6" />
            <Text className="text-violet-400 text-xs ml-1">{Math.round(progress * 100)}% Journey</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

// Animated Bar Chart Component
const AnimatedBarChart = ({ data, timeFilter }: { data: { score: number; date: string }[]; timeFilter: TimeFilter }) => {
  const chartWidth = width - 64;
  const chartHeight = 160;
  const maxScore = 10;

  // Filter data based on timeFilter
  const filteredData = useMemo(() => {
    if (timeFilter === 'all') return data;
    const now = new Date();
    const daysAgo = timeFilter === 'week' ? 7 : 30;
    const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return data.filter(d => new Date(d.date) >= cutoff);
  }, [data, timeFilter]);

  if (filteredData.length === 0) {
    return (
      <View className="h-44 items-center justify-center">
        <View className="w-16 h-16 rounded-full bg-slate-800/50 items-center justify-center mb-3">
          <Ionicons name="analytics-outline" size={32} color="#475569" />
        </View>
        <Text className="text-slate-500">No data for this period</Text>
        <Text className="text-slate-600 text-xs mt-1">Take a scan to see your progress</Text>
      </View>
    );
  }

  // Limit bars to prevent overcrowding
  const displayData = filteredData.length > 12
    ? filteredData.filter((_, i) => i % Math.ceil(filteredData.length / 12) === 0)
    : filteredData;

  return (
    <View className="h-48">
      {/* Y-axis labels */}
      <View className="absolute left-0 top-0 bottom-8 w-6 justify-between py-2">
        {[10, 7.5, 5, 2.5, 0].map((val) => (
          <Text key={val} className="text-[10px] text-slate-600">{val}</Text>
        ))}
      </View>

      {/* Chart area */}
      <View className="ml-8 flex-1">
        {/* Grid lines */}
        <View className="absolute inset-0 bottom-8">
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} className="flex-1 border-b border-slate-800/30" />
          ))}
        </View>

        {/* Data bars */}
        <View className="flex-1 flex-row items-end pb-8 px-1">
          {displayData.map((item, index) => {
            const barHeight = (item.score / maxScore) * (chartHeight - 32);
            const isHighScore = item.score >= 7;
            const isMediumScore = item.score >= 5 && item.score < 7;

            return (
              <Animated.View
                key={index}
                entering={FadeInUp.delay(index * 40).springify()}
                className="flex-1 items-center mx-0.5"
              >
                <View
                  className="w-full rounded-t-lg"
                  style={{
                    height: barHeight,
                    backgroundColor: isHighScore ? '#10B981' : isMediumScore ? '#8B5CF6' : '#F59E0B',
                    shadowColor: isHighScore ? '#10B981' : isMediumScore ? '#8B5CF6' : '#F59E0B',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    minHeight: 4,
                  }}
                />
              </Animated.View>
            );
          })}
        </View>

        {/* X-axis labels */}
        <View className="h-6 flex-row">
          {displayData.slice(0, Math.min(displayData.length, 6)).map((item, index) => (
            <Text key={index} className="flex-1 text-center text-[10px] text-slate-600">
              {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
};

// Enhanced Milestone Card with animation
const MilestoneCard = ({
  achieved,
  label,
  icon,
  delay,
}: {
  achieved: boolean;
  label: string;
  icon: string;
  delay: number;
}) => {
  const scale = useSharedValue(achieved ? 1 : 0.9);

  useEffect(() => {
    if (achieved) {
      scale.value = withSpring(1, { damping: 12 });
    }
  }, [achieved]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).springify()}
      style={animatedStyle}
      className={`flex-1 rounded-2xl p-3 items-center border ${
        achieved
          ? 'bg-gradient-to-br from-violet-500/20 to-pink-500/20 border-violet-500/40'
          : 'bg-slate-800/30 border-slate-700/30'
      }`}
    >
      <View
        className={`w-10 h-10 rounded-full items-center justify-center ${
          achieved ? 'bg-violet-500/30' : 'bg-slate-700/50'
        }`}
      >
        <Ionicons name={icon as any} size={20} color={achieved ? '#8B5CF6' : '#475569'} />
      </View>
      <Text className={`mt-2 text-xs text-center font-medium ${achieved ? 'text-violet-300' : 'text-slate-500'}`}>
        {label}
      </Text>
      {achieved && (
        <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 items-center justify-center">
          <Ionicons name="checkmark" size={12} color="white" />
        </View>
      )}
    </Animated.View>
  );
};

// Stats Summary Card
const StatsCard = ({
  label,
  value,
  icon,
  color,
  trend,
  delay,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: string;
  delay: number;
}) => (
  <Animated.View
    entering={FadeInUp.delay(delay).springify()}
    className="flex-1 rounded-2xl p-4 border"
    style={{ backgroundColor: `${color}08`, borderColor: `${color}30` }}
  >
    <View className="flex-row items-center justify-between">
      <Ionicons name={icon as any} size={18} color={color} />
      {trend && (
        <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}20` }}>
          <Text className="text-xs font-medium" style={{ color }}>{trend}</Text>
        </View>
      )}
    </View>
    <Text className="text-2xl font-bold text-white mt-2">{value}</Text>
    <Text className="text-slate-500 text-xs">{label}</Text>
  </Animated.View>
);

const getScoreColor = (score: number) => {
  if (score >= 8) return 'text-emerald-400';
  if (score >= 6) return 'text-violet-400';
  return 'text-amber-400';
};

const getScoreBgColor = (score: number) => {
  if (score >= 8) return 'rgba(16, 185, 129, 0.15)';
  if (score >= 6) return 'rgba(139, 92, 246, 0.15)';
  return 'rgba(245, 158, 11, 0.15)';
};

export default function ProgressScreen() {
  const router = useRouter();
  const { isGuest } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [scoreHistory, setScoreHistory] = useState<{ score: number; date: string }[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [compareMode, setCompareMode] = useState(false);
  const [compare, setCompare] = useState<CompareState>({ first: null, second: null });
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyses();
  }, [isGuest]);

  const loadAnalyses = async () => {
    try {
      setError(null);
      if (isGuest) {
        let source = await loadGuestAnalyses();
        if (source.length === 0) {
          try {
            const remoteRes = await api.get('/analyses?limit=50');
            const remoteRows = remoteRes.data.data?.analyses || [];
            if (Array.isArray(remoteRows) && remoteRows.length > 0) {
              const normalizedRows = remoteRows.map((row: any) => normalizeGuestAnalysis(row));
              await saveGuestAnalyses(normalizedRows);
              source = normalizedRows;
            }
          } catch { }
        }
        const analysesData = source.map((entry) => ({
          id: entry.id,
          image_url: entry.image_url,
          overall_score: entry.overall_score,
          analyzed_at: entry.analyzed_at,
        }));
        setAnalyses(analysesData);
        setScoreHistory(analysesData.map((a) => ({ score: a.overall_score, date: a.analyzed_at })).reverse());
        return;
      }

      const response = await api.get('/analyses?limit=50');
      if (response.data.data?.analyses) {
        const analysesData = response.data.data.analyses;
        setAnalyses(analysesData);
        setScoreHistory(analysesData.map((a: Analysis) => ({ score: a.overall_score, date: a.analyzed_at })).reverse());
      }
    } catch {
      setError('Failed to load your progress. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAnalyses();
    setIsRefreshing(false);
  };

  const toggleCompareMode = () => {
    hapticSelection();
    if (compareMode) setCompare({ first: null, second: null });
    setCompareMode(!compareMode);
  };

  const handleSelectForCompare = (analysis: Analysis) => {
    hapticSelection();
    if (!compare.first) {
      setCompare({ ...compare, first: analysis });
    } else if (!compare.second && compare.first.id !== analysis.id) {
      setCompare({ ...compare, second: analysis });
      setShowCompareModal(true);
    }
  };

  const handlePhotoPress = (analysis: Analysis) => {
    hapticSelection();
    if (compareMode) {
      handleSelectForCompare(analysis);
    } else {
      router.push(`/(protected)/analysis/${analysis.id}`);
    }
  };

  const isSelected = (analysis: Analysis) => compare.first?.id === analysis.id || compare.second?.id === analysis.id;

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const scoreDiff = compare.first && compare.second ? (compare.second.overall_score - compare.first.overall_score).toFixed(1) : '0';

  // Calculate stats
  const avgScore = analyses.length > 0 ? analyses.reduce((sum, a) => sum + a.overall_score, 0) / analyses.length : 0;
  const bestScore = analyses.length > 0 ? Math.max(...analyses.map(a => a.overall_score)) : 0;
  const totalImprovement = analyses.length >= 2 ? (analyses[0].overall_score - analyses[analyses.length - 1].overall_score).toFixed(1) : '0';

  // Calculate journey progress (based on milestones)
  const journeyProgress = useMemo(() => {
    let progress = 0;
    if (analyses.length >= 1) progress += 0.25;
    if (analyses.length >= 5) progress += 0.25;
    if (bestScore >= 7) progress += 0.25;
    if (analyses.length >= 10) progress += 0.25;
    return progress;
  }, [analyses.length, bestScore]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#000000]">
        <View className="px-5 pb-4 pt-6">
          <Text className="text-2xl font-bold text-white">Your Progress</Text>
        </View>
        <View className="flex-row flex-wrap justify-between px-5 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="w-[48%] aspect-square rounded-xl bg-slate-800/50 animate-pulse" />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#000000] px-8">
        <View className="w-20 h-20 rounded-full bg-red-500/10 items-center justify-center mb-4">
          <Ionicons name="cloud-offline-outline" size={40} color="#ef4444" />
        </View>
        <Text className="text-center text-red-400 text-lg font-medium">Connection Error</Text>
        <Text className="mt-2 text-center text-slate-500">{error}</Text>
        <TouchableOpacity
          onPress={() => { hapticSelection(); setIsLoading(true); loadAnalyses(); }}
          className="mt-6 rounded-xl bg-violet-600 px-8 py-3"
        >
          <Text className="font-semibold text-white">Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#000000]" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#8B5CF6" />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100).springify()} className="flex-row items-center justify-between px-5 pb-4 pt-3">
          <View>
            <Text className="text-2xl font-bold text-white">Your Progress</Text>
            <Text className="mt-1 text-sm text-slate-500">Track your glow-up journey</Text>
          </View>
          <TouchableOpacity
            onPress={toggleCompareMode}
            className={`rounded-full px-4 py-2 ${compareMode ? 'bg-violet-600' : 'bg-white/5 border border-slate-700'}`}
          >
            <Text className={`font-medium ${compareMode ? 'text-white' : 'text-slate-400'}`}>
              {compareMode ? 'Cancel' : 'Compare'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Journey Progress Ring */}
        <JourneyProgressRing progress={journeyProgress} totalScans={analyses.length} />

        {/* Stats Summary */}
        <View className="flex-row gap-3 px-5 mb-4">
          <StatsCard
            label="Average"
            value={avgScore.toFixed(1)}
            icon="analytics"
            color="#8B5CF6"
            delay={200}
          />
          <StatsCard
            label="Best"
            value={bestScore.toFixed(1)}
            icon="trophy"
            color="#10B981"
            trend={bestScore >= 7 ? '🔥' : undefined}
            delay={250}
          />
          <StatsCard
            label="Change"
            value={`${parseFloat(totalImprovement) >= 0 ? '+' : ''}${totalImprovement}`}
            icon="trending-up"
            color={parseFloat(totalImprovement) >= 0 ? '#10B981' : '#EF4444'}
            delay={300}
          />
        </View>

        {/* Milestones */}
        <View className="px-5 mb-4">
          <Text className="text-base font-semibold text-white mb-3">Milestones</Text>
          <View className="flex-row gap-3">
            <MilestoneCard achieved={analyses.length >= 1} label="First Scan" icon="camera" delay={350} />
            <MilestoneCard achieved={analyses.length >= 5} label="5 Scans" icon="layers" delay={400} />
            <MilestoneCard achieved={bestScore >= 7} label="7+ Score" icon="star" delay={450} />
            <MilestoneCard achieved={analyses.length >= 10} label="10 Scans" icon="trophy" delay={500} />
          </View>
        </View>

        {/* Chart Card */}
        <Animated.View entering={FadeInUp.delay(550).springify()} className="mx-5 mb-4 rounded-3xl bg-[#0F172A] p-5 border border-slate-800">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-lg font-semibold text-white">Score Trend</Text>
              <Text className="text-slate-500 text-xs">Your progress over time</Text>
            </View>
            {/* Time Filter */}
            <View className="flex-row bg-slate-800/50 rounded-full p-1">
              {(['week', 'month', 'all'] as TimeFilter[]).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => { hapticSelection(); setTimeFilter(filter); }}
                  className={`px-3 py-1.5 rounded-full ${timeFilter === filter ? 'bg-violet-600' : ''}`}
                >
                  <Text className={`text-xs font-medium ${timeFilter === filter ? 'text-white' : 'text-slate-400'}`}>
                    {filter === 'week' ? '7D' : filter === 'month' ? '30D' : 'All'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <AnimatedBarChart data={scoreHistory} timeFilter={timeFilter} />
        </Animated.View>

        {/* Compare Mode Banner */}
        {compareMode && (
          <Animated.View entering={FadeIn.springify()} className="mx-5 mb-4 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4">
            <View className="flex-row items-center">
              <Ionicons name="git-compare" size={20} color="#8B5CF6" />
              <Text className="text-sm text-violet-300 ml-2 flex-1">Select two scans to compare your before/after progress.</Text>
            </View>
            {compare.first && !compare.second && (
              <View className="mt-2 flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                <Text className="text-sm font-medium text-violet-400">First scan selected. Pick your second scan.</Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Gallery */}
        <View className="mb-4 px-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-white">All Scans</Text>
            <Text className="text-sm text-slate-500">{analyses.length} total</Text>
          </View>

          {analyses.length === 0 ? (
            <View className="items-center py-16 rounded-3xl bg-slate-800/20 border border-slate-700/30">
              <View className="w-20 h-20 rounded-full bg-violet-500/10 items-center justify-center mb-4">
                <Ionicons name="camera-outline" size={40} color="#8B5CF6" />
              </View>
              <Text className="text-white font-medium">No scans yet</Text>
              <Text className="text-slate-500 text-sm mt-1">Start tracking your progress today</Text>
              <TouchableOpacity
                onPress={() => { hapticSelection(); router.push('/(protected)/(tabs)'); }}
                className="mt-6 rounded-xl bg-violet-600 px-8 py-3"
              >
                <Text className="font-semibold text-white">Take First Scan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {analyses.map((analysis, index) => (
                <Animated.View key={analysis.id} entering={FadeInUp.delay(index * 30).springify()} className="w-[48%] mb-3">
                  <TouchableOpacity
                    onPress={() => handlePhotoPress(analysis)}
                    className={`overflow-hidden rounded-2xl border ${isSelected(analysis) ? 'border-violet-500' : 'border-slate-800'}`}
                    activeOpacity={0.85}
                  >
                    <View className="aspect-square bg-slate-800/50 relative">
                      {analysis.image_url ? (
                        <Image source={{ uri: analysis.image_url }} className="h-full w-full" resizeMode="cover" />
                      ) : (
                        <View className="h-full w-full items-center justify-center">
                          <Ionicons name="person" size={40} color="#475569" />
                        </View>
                      )}
                      {/* Score badge */}
                      <View
                        className="absolute left-2 top-2 px-2 py-1 rounded-lg"
                        style={{ backgroundColor: getScoreBgColor(analysis.overall_score) }}
                      >
                        <Text className={`text-sm font-bold ${getScoreColor(analysis.overall_score)}`}>
                          {analysis.overall_score.toFixed(1)}
                        </Text>
                      </View>
                      {isSelected(analysis) && (
                        <View className="absolute right-2 top-2 rounded-full bg-violet-600 p-1.5">
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        </View>
                      )}
                    </View>
                    <View className="bg-[#0A0A0F] px-3 py-2.5 flex-row items-center justify-between">
                      <Text className={`text-lg font-bold ${getScoreColor(analysis.overall_score)}`}>
                        {analysis.overall_score.toFixed(1)}
                      </Text>
                      <Text className="text-xs text-slate-500">{formatDate(analysis.analyzed_at)}</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
        </View>

        <View className="h-8" />
      </ScrollView>

      {/* Compare Modal */}
      <Modal visible={showCompareModal} animationType="slide" transparent onRequestClose={() => { setShowCompareModal(false); setCompare({ first: null, second: null }); }}>
        <View className="flex-1 justify-center bg-black/90">
          <View className="mx-4 overflow-hidden rounded-3xl bg-[#0F172A] border border-violet-500/20">
            <LinearGradient colors={['#1E1B4B', '#0F172A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View className="flex-row items-center justify-between border-b border-slate-800/50 p-4">
                <View className="flex-row items-center">
                  <Ionicons name="git-compare" size={20} color="#8B5CF6" />
                  <Text className="text-lg font-bold text-white ml-2">Compare Progress</Text>
                </View>
                <TouchableOpacity
                  onPress={() => { setShowCompareModal(false); setCompare({ first: null, second: null }); }}
                  className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center"
                >
                  <Ionicons name="close" size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <View className="flex-row p-6">
              <View className="flex-1 items-center">
                <View className="h-28 w-28 overflow-hidden rounded-2xl bg-slate-800 border border-slate-700">
                  {compare.first?.image_url ? (
                    <Image source={{ uri: compare.first.image_url }} className="h-full w-full" />
                  ) : (
                    <View className="h-full w-full items-center justify-center">
                      <Ionicons name="person" size={40} color="#475569" />
                    </View>
                  )}
                </View>
                <Text className="mt-2 text-xs text-slate-500 font-medium">BEFORE</Text>
                <Text className="text-3xl font-bold text-white mt-1">{compare.first?.overall_score.toFixed(1)}</Text>
                <Text className="text-slate-500 text-xs">{compare.first && formatDate(compare.first.analyzed_at)}</Text>
              </View>

              <View className="items-center justify-center px-3">
                <View className="w-10 h-10 rounded-full bg-violet-500/20 items-center justify-center">
                  <Ionicons name="arrow-forward" size={20} color="#8B5CF6" />
                </View>
              </View>

              <View className="flex-1 items-center">
                <View className="h-28 w-28 overflow-hidden rounded-2xl bg-slate-800 border border-slate-700">
                  {compare.second?.image_url ? (
                    <Image source={{ uri: compare.second.image_url }} className="h-full w-full" />
                  ) : (
                    <View className="h-full w-full items-center justify-center">
                      <Ionicons name="person" size={40} color="#475569" />
                    </View>
                  )}
                </View>
                <Text className="mt-2 text-xs text-slate-500 font-medium">AFTER</Text>
                <Text className="text-3xl font-bold text-white mt-1">{compare.second?.overall_score.toFixed(1)}</Text>
                <Text className="text-slate-500 text-xs">{compare.second && formatDate(compare.second.analyzed_at)}</Text>
              </View>
            </View>

            <View className="mx-4 mb-4">
              <LinearGradient
                colors={parseFloat(scoreDiff) >= 0 ? ['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.05)'] : ['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-2xl p-4 items-center"
              >
                <Text className="text-slate-400 text-sm">Score Change</Text>
                <View className="flex-row items-center mt-1">
                  {parseFloat(scoreDiff) > 0 && <Ionicons name="trending-up" size={20} color="#10B981" />}
                  {parseFloat(scoreDiff) < 0 && <Ionicons name="trending-down" size={20} color="#EF4444" />}
                  <Text className={`text-4xl font-bold ml-2 ${parseFloat(scoreDiff) > 0 ? 'text-emerald-400' : parseFloat(scoreDiff) < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                    {parseFloat(scoreDiff) > 0 ? '+' : ''}{scoreDiff}
                  </Text>
                </View>
                {parseFloat(scoreDiff) > 0 && (
                  <Text className="text-emerald-400/80 text-xs mt-2">🎉 Great progress! Keep it up!</Text>
                )}
              </LinearGradient>
            </View>

            <View className="px-4 pb-6">
              <TouchableOpacity
                onPress={() => { setShowCompareModal(false); setCompare({ first: null, second: null }); }}
                className="rounded-xl bg-violet-600 py-3.5 items-center"
              >
                <Text className="font-semibold text-white">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
