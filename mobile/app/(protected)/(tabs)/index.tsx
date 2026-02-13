import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeIn,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  Extrapolate,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, Stop, LinearGradient as SvgGradient } from 'react-native-svg';
import ScoreRing from '../../../components/home/ScoreRing';
import api from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { hapticSuccess, hapticSelection, hapticError } from '../../../lib/haptics';
import { evaluateImageQuality } from '../../../lib/imageQualityGate';
import { loadGuestAnalyses, normalizeGuestAnalysis, saveGuestAnalysis } from '../../../lib/guestAnalysisHistory';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// Responsive helpers
const isSmallDevice = SCREEN_WIDTH < 375;
const CARD_SPACING = isSmallDevice ? 12 : 16;
const AVATAR_SIZE = isSmallDevice ? 100 : 120;

// Rarity colors
const RARITY_COLORS: Record<number, { bg: string; text: string; border: string; glow: string }> = {
  1: { bg: 'rgba(148, 163, 184, 0.1)', text: '#94A3B8', border: 'rgba(148, 163, 184, 0.3)', glow: '#94A3B8' }, // Common
  2: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.3)', glow: '#3B82F6' }, // Rare
  3: { bg: 'rgba(168, 85, 247, 0.1)', text: '#A855F7', border: 'rgba(168, 85, 247, 0.3)', glow: '#A855F7' }, // Epic
  4: { bg: 'rgba(251, 191, 36, 0.1)', text: '#FBBF24', border: 'rgba(251, 191, 36, 0.3)', glow: '#FBBF24' }, // Legendary
};

// Mascot moods based on user stats
const getMascotMood = (streak: number, level: number) => {
  if (streak >= 14) return { emoji: '🔥', message: "You're on FIRE! Keep it up!", mood: 'fire' };
  if (streak >= 7) return { emoji: '💪', message: 'Week warrior! Unstoppable!', mood: 'strong' };
  if (streak >= 3) return { emoji: '😤', message: "Great momentum! Let's go!", mood: 'motivated' };
  if (level >= 10) return { emoji: '👑', message: 'Level master in the house!', mood: 'proud' };
  return { emoji: '✨', message: "Ready for today's session?", mood: 'ready' };
};

// Greeting based on time
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return { text: 'Night Owl', emoji: '🦉', subtext: 'Burning the midnight oil?' };
  if (hour < 12) return { text: 'Good Morning', emoji: '☀️', subtext: 'Ready to glow today?' };
  if (hour < 18) return { text: 'Good Afternoon', emoji: '🌤️', subtext: 'Keep up the momentum!' };
  return { text: 'Good Evening', emoji: '🌙', subtext: 'End the day strong!' };
};

// Daily tips with engagement hooks
const DAILY_TIPS = [
  { icon: 'flame', text: 'Your streak is on fire! Keep it going! 🔥', urgent: true },
  { icon: 'trophy', text: "You're #12 on the weekly leaderboard!", urgent: true },
  { icon: 'star', text: 'Just 50 XP until next level!', urgent: false },
  { icon: 'gift', text: 'Daily challenge awaits - 100 XP reward!', urgent: true },
  { icon: 'people', text: '3 friends are mewing right now!', urgent: false },
];

// 3D Mascot Avatar Component
const MascotAvatar = ({ streak, level, onPress }: { streak: number; level: number; onPress: () => void }) => {
  const mood = getMascotMood(streak, level);
  const scale = useSharedValue(1);
  const float = useSharedValue(0);
  const glow = useSharedValue(0.5);

  useEffect(() => {
    // Float animation
    float.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    );

    // Glow pulse
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.5, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: float.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 1 + glow.value * 0.2 }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      className="items-center mb-4"
    >
      <Animated.View entering={ZoomIn.delay(200).springify()} style={animatedStyle} className="relative items-center justify-center">
        {/* Glow effect */}
        <Animated.View
          style={glowStyle}
          className="absolute w-40 h-40 rounded-full"
        >
          <LinearGradient
            colors={['rgba(124, 58, 237, 0.4)', 'rgba(124, 58, 237, 0)']}
            style={{ flex: 1, borderRadius: 80 }}
          />
        </Animated.View>

        {/* Avatar circle */}
        <View
          className="rounded-full items-center justify-center border-2"
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            backgroundColor: '#131418',
            borderColor: 'rgba(124, 58, 237, 0.5)',
            shadowColor: '#7C3AED',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
            elevation: 12,
          }}
        >
          <Text className="text-5xl" style={{ marginTop: -4 }}>{mood.emoji}</Text>
        </View>

        {/* Level badge */}
        <View
          className="absolute -bottom-2 rounded-full px-3 py-1 border"
          style={{
            backgroundColor: '#7C3AED',
            borderColor: 'rgba(255,255,255,0.2)',
          }}
        >
          <Text className="text-white text-xs font-bold">Lv.{level}</Text>
        </View>
      </Animated.View>

      {/* Speech bubble */}
      <Animated.View entering={FadeInUp.delay(400).springify()} className="mt-4 px-4 py-2 rounded-2xl bg-[#1E1B4B]/80 border border-violet-500/20">
        <Text className="text-violet-300 text-sm text-center">{mood.message}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Enhanced Streak Card with Fire Particles
const StreakCard = ({ streak, longestStreak }: { streak: number; longestStreak: number }) => {
  const pulse = useSharedValue(1);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      true
    );

    shimmer.value = withRepeat(
      withTiming(1, { duration: 3000 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-200, 200]) }],
  }));

  const fireEmojis = streak >= 14 ? '🔥🔥🔥' : streak >= 7 ? '🔥🔥' : streak >= 3 ? '🔥' : '';

  return (
    <Animated.View entering={FadeInUp.delay(300).springify()} className="mb-4 overflow-hidden rounded-3xl">
      <LinearGradient
        colors={streak >= 7 ? ['#7C3AED', '#EC4899'] : streak >= 3 ? ['#F59E0B', '#EF4444'] : ['#1E1B4B', '#312E81']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View className="p-5 relative overflow-hidden">
          {/* Shimmer effect */}
          <Animated.View
            style={[{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 100 }, shimmerStyle]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.2)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ flex: 1 }}
            />
          </Animated.View>

          <View className="flex-row items-center justify-between">
            <Animated.View style={animatedStyle} className="flex-row items-center">
              <View
                className="items-center justify-center"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: streak >= 3 ? 'rgba(249, 115, 22, 0.3)' : 'rgba(249, 115, 22, 0.15)',
                }}
              >
                <Ionicons name="flame" size={36} color={streak >= 3 ? "#F97316" : "#FB923C"} />
              </View>
              <View className="ml-4">
                <View className="flex-row items-center">
                  <Text className="text-5xl font-bold text-white">{streak}</Text>
                  <Text className="text-2xl ml-2">{fireEmojis}</Text>
                </View>
                <Text className="text-white/80">Day Streak</Text>
              </View>
            </Animated.View>

            <View className="items-end">
              <View className="flex-row items-center bg-black/30 px-3 py-1.5 rounded-full">
                <Ionicons name="trophy" size={14} color="#FBBF24" />
                <Text className="text-white/90 text-sm ml-1.5 font-medium">Best: {longestStreak}</Text>
              </View>
              {streak >= 3 && (
                <View className="mt-2 px-3 py-1 rounded-full bg-black/40">
                  <Text className="text-orange-400 text-xs font-bold">
                    {streak >= 14 ? '⚡ LEGENDARY!' : streak >= 7 ? '🔥 On Fire!' : '✨ Heating up!'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Motivational message */}
          {streak >= 3 && streak < 7 && (
            <View className="mt-4 p-3 rounded-xl bg-black/30">
              <Text className="text-white/90 text-sm">🎯 {7 - streak} more days for Week Warrior badge!</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// Progress Ring Component
const ProgressRing = ({ progress, completedTasks, totalTasks }: { progress: number; completedTasks: number; totalTasks: number }) => {
  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (circumference * progress);

  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 30000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View entering={FadeInUp.delay(400).springify()} className="items-center py-4">
      <View className="relative" style={{ width: size, height: size }}>
        {/* Orbiting dots */}
        <Animated.View style={[{ position: 'absolute', width: size, height: size }, orbitStyle]}>
          <View style={{ position: 'absolute', top: -4, left: size / 2 - 3, width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
        </Animated.View>

        {/* SVG Ring */}
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Defs>
            <SvgGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#10B981" />
              <Stop offset="50%" stopColor="#6366F1" />
              <Stop offset="100%" stopColor="#EC4899" />
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
            stroke="url(#progressGradient)"
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
          <Text className="text-4xl font-bold text-white">{Math.round(progress * 100)}%</Text>
          <Text className="text-slate-500 text-xs mt-1">{completedTasks}/{totalTasks} Tasks</Text>
        </View>
      </View>
    </Animated.View>
  );
};

// 3D Quick Action Button
const QuickActionButton = ({
  icon,
  title,
  subtitle,
  colors,
  onPress,
  disabled,
  loading,
  badge,
}: {
  icon: string;
  title: string;
  subtitle: string;
  colors: readonly [string, string, ...string[]];
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  badge?: string;
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
      className="flex-1 overflow-hidden rounded-2xl"
      style={{ minHeight: isSmallDevice ? 70 : 80 }}
    >
      <Animated.View style={animatedStyle}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View className="flex-1 p-4">
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <View className="flex-row items-center">
                <View
                  className="items-center justify-center rounded-xl"
                  style={{ width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.15)' }}
                >
                  <Ionicons name={icon as any} size={24} color="white" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-base font-bold text-white">{title}</Text>
                  <Text className="text-white/70 text-xs">{subtitle}</Text>
                </View>
                {badge && (
                  <View className="px-2 py-1 rounded-full bg-black/30">
                    <Text className="text-white text-xs font-medium">{badge}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isGuest, guestUsageCount, canUseFeature, incrementGuestUsage } = useAuth();

  // State
  const [isScanning, setIsScanning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [remainingUses, setRemainingUses] = useState(3);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Gamification data
  const [userData, setUserData] = useState({
    latestScore: 0,
    totalScans: 0,
    streak: 0,
    longestStreak: 0,
    averageScoreTrend: 0,
    xpPoints: 0,
    level: 1,
    xpToNextLevel: 200,
    globalRank: 0,
    achievementsEarned: 0,
    totalAchievements: 40,
    todayTasks: 3,
    completedTasks: 2,
  });

  const [mewingData, setMewingData] = useState({
    minutesToday: 0,
    dailyGoal: 60,
  });

  const [dailyChallenge, setDailyChallenge] = useState<{
    id: string;
    title: string;
    description: string;
    icon: string;
    currentValue: number;
    targetValue: number;
    xpReward: number;
    completed: boolean;
  } | null>(null);

  const [recentAchievements, setRecentAchievements] = useState<Array<{
    id: string;
    name: string;
    icon: string;
    rarity: number;
    earnedAt: string;
  }>>([]);

  // Animations
  const progressWidth = useSharedValue(0);
  const greeting = getGreeting();

  useEffect(() => {
    // Tip rotation
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % DAILY_TIPS.length);
    }, 6000);

    return () => clearInterval(tipInterval);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      if (isGuest) {
        const localAnalyses = await loadGuestAnalyses();
        setRemainingUses(Math.max(0, 3 - guestUsageCount));
        if (localAnalyses.length > 0) {
          const latest = localAnalyses[0];
          const xp = localAnalyses.length * 50;
          const level = Math.floor(xp / 200) + 1;
          setUserData((prev) => ({
            ...prev,
            latestScore: latest.overall_score || 0,
            totalScans: localAnalyses.length,
            xpPoints: xp,
            level: level,
            xpToNextLevel: 200 - (xp % 200),
            streak: Math.min(localAnalyses.length, 3),
          }));
          progressWidth.value = withSpring((xp % 200) / 200);
        }
        setIsLoading(false);
        return;
      }

      // Load gamification stats
      const statsRes = await api.get('/gamification/stats');
      if (statsRes.data.data) {
        const stats = statsRes.data.data;
        setUserData((prev) => ({
          ...prev,
          xpPoints: stats.total_xp || 0,
          level: stats.current_level || 1,
          xpToNextLevel: stats.xp_to_next_level || 200,
          streak: stats.current_streak || 0,
          longestStreak: stats.longest_streak || 0,
          totalScans: stats.total_scans || 0,
          latestScore: stats.latest_score || 0,
          globalRank: stats.global_rank || 0,
          achievementsEarned: stats.achievements_earned || 0,
        }));
        progressWidth.value = withSpring(1 - (stats.xp_to_next_level / 200));
      }

      // Load daily challenge
      const challengeRes = await api.get('/gamification/challenge/daily');
      if (challengeRes.data.data) {
        setDailyChallenge({
          id: challengeRes.data.data.daily_challenge?.id || '1',
          title: challengeRes.data.data.daily_challenge?.title || 'Complete Session',
          description: challengeRes.data.data.daily_challenge?.description || '',
          icon: challengeRes.data.data.daily_challenge?.icon || 'flame',
          currentValue: challengeRes.data.data.current_value || 0,
          targetValue: challengeRes.data.data.daily_challenge?.target_value || 30,
          xpReward: challengeRes.data.data.daily_challenge?.xp_reward || 100,
          completed: challengeRes.data.data.completed || false,
        });
      }

      // Load recent achievements
      const achievementsRes = await api.get('/gamification/achievements?limit=3');
      if (achievementsRes.data.data) {
        const recent = achievementsRes.data.data
          .filter((a: any) => a.earned)
          .slice(0, 3)
          .map((a: any) => ({
            id: a.id,
            name: a.name,
            icon: a.icon,
            rarity: a.rarity || 1,
            earnedAt: a.earned_at,
          }));
        setRecentAchievements(recent);
      }

      // Load mewing today
      const mewingRes = await api.get('/mewing/today');
      if (mewingRes.data.data) {
        setMewingData({
          minutesToday: mewingRes.data.data.mewing_minutes || 0,
          dailyGoal: 60,
        });
      }

      // Load remaining scans
      const usageRes = await api.get('/usage/remaining');
      if (usageRes.data) {
        setRemainingUses(usageRes.data.remaining_uses ?? 3);
      }

    } catch (err) {
      console.log('Dashboard load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isGuest, guestUsageCount]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const handleScanFace = async () => {
    hapticSelection();

    if (isGuest && !canUseFeature()) {
      Alert.alert('Scan Limit Reached', 'Create a free account for more scans!', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Up', onPress: () => router.push('/(auth)/register') },
      ]);
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed for face scanning');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.front,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const capturedAsset = result.assets[0];
        const quality = await evaluateImageQuality(capturedAsset.uri, capturedAsset.width, capturedAsset.height);
        if (!quality.ok) {
          hapticError();
          Alert.alert('Photo Quality Check', quality.message);
          return;
        }

        setIsScanning(true);

        try {
          const base64 = capturedAsset.base64 || (await FileSystem.readAsStringAsync(capturedAsset.uri, { encoding: 'base64' as any }));
          if (isGuest) await incrementGuestUsage();

          const analysisResponse = await api.post('/analyses/ai', {
            image_base64: base64,
            quality_score: quality.score,
            quality_metrics: quality.metrics,
          });

          hapticSuccess();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          if (analysisResponse.data.data?.id) {
            if (isGuest) {
              const normalized = normalizeGuestAnalysis(analysisResponse.data.data);
              await saveGuestAnalysis(normalized);
            }

            // Check for new achievements
            if (analysisResponse.data.achievements?.length > 0) {
              Alert.alert(
                '🏆 Achievement Unlocked!',
                analysisResponse.data.achievements.map((a: any) => a.name).join('\n'),
                [{ text: 'Awesome!', onPress: () => router.push(`/(protected)/analysis/${analysisResponse.data.data.id}`) }]
              );
            } else {
              router.push(`/(protected)/analysis/${analysisResponse.data.data.id}`);
            }
          }

          if (analysisResponse.data.remaining_uses !== undefined) {
            setRemainingUses(analysisResponse.data.remaining_uses);
          }
        } catch (err: any) {
          hapticError();
          if (err.response?.status === 429) {
            Alert.alert('Daily Limit Reached', 'Upgrade to Premium for unlimited scans.', [
              { text: 'OK', style: 'cancel' },
              { text: 'Upgrade', onPress: () => router.push('/(protected)/paywall') },
            ]);
          } else {
            Alert.alert('Error', 'Failed to analyze image. Please try again.');
          }
        } finally {
          setIsScanning(false);
        }
      }
    } catch (error) {
      hapticError();
      setIsScanning(false);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    }
  };

  const handleMascotTap = () => {
    hapticSuccess();
    // Could show a fun animation or navigate somewhere
  };

  // Components
  const LevelBadge = () => {
    const currentLevelXP = userData.xpPoints % 200;
    const progress = currentLevelXP / 200;

    return (
      <Animated.View entering={FadeInUp.delay(100).springify()} className="mb-4 rounded-2xl bg-[#0F172A] p-4 border border-violet-500/20">
        <View className="flex-row items-center">
          {/* Level Circle */}
          <View className="relative">
            <Svg width={56} height={56}>
              <Circle cx={28} cy={28} r={24} stroke="#1E293B" strokeWidth={4} fill="transparent" />
              <Circle
                cx={28}
                cy={28}
                r={24}
                stroke="#7C3AED"
                strokeWidth={4}
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={150.8}
                strokeDashoffset={150.8 - (150.8 * progress)}
                rotation="-90"
                origin="28, 28"
              />
            </Svg>
            <View className="absolute inset-0 items-center justify-center">
              <Text className="text-base font-bold text-white">{userData.level}</Text>
            </View>
          </View>

          <View className="ml-3 flex-1">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white font-semibold">Level {userData.level}</Text>
              <Text className="text-slate-500 text-xs">{currentLevelXP}/200 XP</Text>
            </View>
            <View className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <LinearGradient
                colors={['#7C3AED', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: '100%', borderRadius: 999, width: `${progress * 100}%` }}
              />
            </View>
            <Text className="text-xs text-slate-600 mt-1">{200 - currentLevelXP} XP to Level {userData.level + 1}</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const QuickActions = () => (
    <Animated.View entering={FadeInUp.delay(350).springify()} className="mb-6">
      <View className="flex-row gap-3">
        <QuickActionButton
          icon="scan"
          title="Scan Face"
          subtitle={`${remainingUses === -1 ? '∞' : remainingUses} left today`}
          colors={['#7C3AED', '#EC4899']}
          onPress={handleScanFace}
          loading={isScanning}
        />
        <QuickActionButton
          icon="timer"
          title="Mewing"
          subtitle={`${mewingData.minutesToday}/${mewingData.dailyGoal}m`}
          colors={['#10B981', '#059669']}
          onPress={() => { hapticSelection(); router.push('/(protected)/mewing'); }}
          badge={mewingData.minutesToday >= mewingData.dailyGoal ? '✓' : undefined}
        />
      </View>
    </Animated.View>
  );

  const DailyChallengeCard = () => {
    if (!dailyChallenge) return null;

    const progress = dailyChallenge.currentValue / dailyChallenge.targetValue;

    return (
      <Animated.View entering={FadeInUp.delay(450).springify()} className="mb-4 rounded-3xl bg-[#0F172A] border border-amber-500/20 p-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View
              className="items-center justify-center rounded-xl"
              style={{ width: 44, height: 44, backgroundColor: 'rgba(251, 191, 36, 0.15)' }}
            >
              <Ionicons name={dailyChallenge.icon as any} size={22} color="#FBBF24" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-white font-semibold">{dailyChallenge.title}</Text>
              <Text className="text-slate-500 text-xs">{dailyChallenge.description}</Text>
            </View>
          </View>
          <View className="px-3 py-1.5 rounded-full bg-amber-500/20">
            <Text className="text-amber-400 text-xs font-bold">+{dailyChallenge.xpReward} XP</Text>
          </View>
        </View>

        <View className="h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
          <View
            className="h-full rounded-full"
            style={{ width: `${Math.min(100, progress * 100)}%`, backgroundColor: dailyChallenge.completed ? '#10B981' : '#FBBF24' }}
          />
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-slate-500 text-xs">
            {dailyChallenge.currentValue}/{dailyChallenge.targetValue} completed
          </Text>
          {dailyChallenge.completed ? (
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text className="text-emerald-400 text-xs ml-1 font-medium">Done!</Text>
            </View>
          ) : (
            <Text className="text-amber-400 text-xs font-medium">In Progress</Text>
          )}
        </View>
      </Animated.View>
    );
  };

  const StatsGrid = () => (
    <View className="mb-6">
      <View className="flex-row gap-3 mb-3">
        {/* Score */}
        <Animated.View entering={FadeInUp.delay(500).springify()} className="flex-1 rounded-2xl bg-[#0F172A] p-4 border border-violet-500/20">
          <Ionicons name="star" size={20} color="#8B5CF6" />
          <Text className="text-2xl font-bold text-white mt-2">{userData.latestScore.toFixed(1)}</Text>
          <Text className="text-slate-500 text-xs">Latest Score</Text>
        </Animated.View>

        {/* Rank */}
        <Animated.View entering={FadeInUp.delay(550).springify()} className="flex-1 rounded-2xl bg-[#0F172A] p-4 border border-cyan-500/20">
          <Ionicons name="ribbon" size={20} color="#06B6D4" />
          <Text className="text-2xl font-bold text-white mt-2">#{userData.globalRank || '--'}</Text>
          <Text className="text-slate-500 text-xs">Global Rank</Text>
        </Animated.View>

        {/* Achievements */}
        <Animated.View entering={FadeInUp.delay(600).springify()} className="flex-1 rounded-2xl bg-[#0F172A] p-4 border border-amber-500/20">
          <Ionicons name="trophy" size={20} color="#FBBF24" />
          <Text className="text-2xl font-bold text-white mt-2">{userData.achievementsEarned}</Text>
          <Text className="text-slate-500 text-xs">Badges</Text>
        </Animated.View>
      </View>
    </View>
  );

  const RecentAchievementsRow = () => {
    if (recentAchievements.length === 0) return null;

    return (
      <Animated.View entering={FadeInUp.delay(700).springify()} className="mb-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-white font-semibold">Recent Badges</Text>
          <TouchableOpacity onPress={() => router.push('/(protected)/achievements' as any)} className="flex-row items-center">
            <Text className="text-violet-400 text-sm">See All</Text>
            <Ionicons name="chevron-forward" size={16} color="#8B5CF6" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recentAchievements.map((achievement, index) => {
            const colors = RARITY_COLORS[achievement.rarity] || RARITY_COLORS[1];
            return (
              <TouchableOpacity
                key={achievement.id}
                className="mr-3 p-4 rounded-2xl border"
                style={{
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                  minWidth: 100,
                  alignItems: 'center',
                }}
              >
                <View
                  className="items-center justify-center rounded-full mb-2"
                  style={{ width: 48, height: 48, backgroundColor: colors.bg }}
                >
                  <Ionicons name={achievement.icon as any} size={24} color={colors.text} />
                </View>
                <Text className="text-white text-xs text-center font-medium" numberOfLines={2}>
                  {achievement.name}
                </Text>
                {achievement.rarity === 4 && (
                  <Text className="text-amber-400 text-[10px] mt-1 font-medium">✨ Legendary</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>
    );
  };

  const TipBanner = () => {
    const tip = DAILY_TIPS[currentTipIndex];
    return (
      <Animated.View
        entering={FadeIn.delay(200)}
        className={`mb-4 mx-1 rounded-2xl overflow-hidden ${tip.urgent ? 'border border-amber-500/30' : ''}`}
      >
        <LinearGradient
          colors={tip.urgent ? ['#78350F', '#451A03'] : ['#1E1B4B', '#0F0A1F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View className="flex-row items-center px-4 py-3">
            <Ionicons name={tip.icon as any} size={18} color={tip.urgent ? '#FBBF24' : '#A78BFA'} />
            <Text className={`ml-2 flex-1 text-sm ${tip.urgent ? 'text-amber-200' : 'text-violet-300'}`}>
              {tip.text}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 bg-[#000000] items-center justify-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="mt-4 text-slate-400">Loading your glow...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#000000]" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        style={{ paddingHorizontal: CARD_SPACING }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#8B5CF6" />
        }
        contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 100 }}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-slate-500 text-sm">{greeting.emoji} {greeting.text}</Text>
              <Text className="text-2xl font-bold text-white">Your Dashboard</Text>
              <Text className="text-slate-600 text-xs mt-1">{greeting.subtext}</Text>
            </View>
            <TouchableOpacity
              onPress={() => { hapticSelection(); router.push('/(protected)/settings'); }}
              className="items-center justify-center rounded-full"
              style={{ width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              <Ionicons name="settings-outline" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* 3D Mascot Avatar */}
        <MascotAvatar streak={userData.streak} level={userData.level} onPress={handleMascotTap} />

        {/* Tip Banner */}
        <TipBanner />

        {/* Streak Card */}
        <StreakCard streak={userData.streak} longestStreak={userData.longestStreak} />

        {/* Level Progress */}
        <LevelBadge />

        {/* Quick Actions */}
        <QuickActions />

        {/* Daily Challenge */}
        <DailyChallengeCard />

        {/* Stats Grid */}
        <StatsGrid />

        {/* Recent Achievements */}
        <RecentAchievementsRow />

        <View className="h-4" />
      </ScrollView>
    </View>
  );
}
