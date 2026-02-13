import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, RefreshControl, Dimensions, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInUp,
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { hapticSuccess, hapticSelection, hapticError, hapticMedium } from '../../lib/haptics';
import api from '../../lib/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive helpers
const isSmallDevice = SCREEN_WIDTH < 375;
const CARD_SPACING = isSmallDevice ? 12 : 16;

// Exercise types
type ExerciseType = 'quick' | 'focused' | 'deep' | 'marathon';
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

// Exercise duration mapping (in minutes)
const EXERCISE_DURATIONS: Record<ExerciseType, number> = {
  quick: 5,
  focused: 15,
  deep: 30,
  marathon: 60,
};

// Exercise colors
const EXERCISE_COLORS: Record<ExerciseType, string> = {
  quick: '#10B981',
  focused: '#3B82F6',
  deep: '#8B5CF6',
  marathon: '#EC4899',
};

// Motivational quotes
const SESSION_QUOTES = [
  "Every second counts 💪",
  "Your future self will thank you ✨",
  "Consistency is key 🔑",
  "You're building something amazing 🏗️",
  "Stay focused, stay strong 💪",
  "This is your transformation time 🦋",
];

// Daily tips
const DAILY_TIPS = [
  { icon: 'sunny', text: 'Morning routine tip: Start with 5 min of light stretching', time: 'morning' },
  { icon: 'restaurant', text: 'Avoid salty foods before mewing - reduces water retention', time: 'morning' },
  { icon: 'water', text: 'Stay hydrated! Drink a glass of water after each session', time: 'afternoon' },
  { icon: 'moon', text: 'Evening sessions are great for deep mewing practice', time: 'evening' },
  { icon: 'bed', text: 'Sleep on your back with good pillow height', time: 'night' },
];

interface Exercise {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: ExerciseType;
  duration_seconds: number;
  target_areas: string[];
  is_premium: boolean;
}

interface DailyRoutine {
  morning_exercises: string[];
  evening_exercises: string[];
  morning_minutes: number;
  evening_minutes: number;
  morning_completed: boolean;
  evening_completed: boolean;
}

interface WeeklyPlan {
  weekly_goal_minutes: number;
  monday_goal: number;
  focus_areas: string[];
  ai_insights: string;
}

export default function MewingScreen() {
  const router = useRouter();

  // Session state
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionType, setSessionType] = useState<ExerciseType>('focused');
  const [ambientMode, setAmbientMode] = useState(false);
  const [showBreathingGuide, setShowBreathingGuide] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [sessionXp, setSessionXp] = useState(0);

  // Data state
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [dailyRoutine, setDailyRoutine] = useState<DailyRoutine | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [manualMinutes, setManualMinutes] = useState('30');
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  // Animation values
  const timerScale = useSharedValue(1);
  const breatheScale = useSharedValue(1);
  const celebrationScale = useSharedValue(0);
  const pulseGlow = useSharedValue(0.3);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breathingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentQuoteIndex = useRef(0);

  // Effects
  useEffect(() => {
    loadData();
  }, []);

  // Session timer
  useEffect(() => {
    if (isSessionActive) {
      timerRef.current = setInterval(() => {
        setSessionTime((prev) => {
          const newTime = prev + 1;
          // Award XP every minute
          if (newTime % 60 === 0) {
            setSessionXp((xp) => xp + 10);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          return newTime;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [isSessionActive]);

  // Breathing guide timer
  useEffect(() => {
    if (showBreathingGuide && isSessionActive) {
      let phase: 'inhale' | 'hold' | 'exhale' = 'inhale';
      let counter = 0;

      breathingRef.current = setInterval(() => {
        counter++;
        if (counter < 4) {
          phase = 'inhale';
          breatheScale.value = withTiming(1.2, { duration: 300 });
        } else if (counter < 8) {
          phase = 'hold';
        } else if (counter < 12) {
          phase = 'exhale';
          breatheScale.value = withTiming(0.8, { duration: 300 });
        } else {
          counter = 0;
        }
        setBreathingPhase(phase);
      }, 1000);

      return () => {
        if (breathingRef.current) clearInterval(breathingRef.current);
      };
    }
  }, [showBreathingGuide, isSessionActive]);

  // Back button handler during session
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isSessionActive) {
        Alert.alert(
          'End Session?',
          'Are you sure you want to end your mewing session?',
          [
            { text: 'Continue', style: 'cancel' },
            { text: 'End Session', onPress: handleEndSession },
          ]
        );
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isSessionActive, sessionTime]);

  const loadData = async () => {
    try {
      // Load mewing stats
      const todayRes = await api.get('/mewing/today');
      if (todayRes.data.data) {
        setTodayMinutes(todayRes.data.data.mewing_minutes || 0);
      }

      const streakRes = await api.get('/mewing/streaks');
      if (streakRes.data.data) {
        setStreak(streakRes.data.data.current_streak || 0);
      }

      // Load exercises
      const exercisesRes = await api.get('/premium/exercises');
      if (exercisesRes.data.data) {
        setExercises(exercisesRes.data.data);
      }

      // Load daily routine
      const routineRes = await api.get('/premium/routine/today');
      if (routineRes.data.data) {
        setDailyRoutine(routineRes.data.data);
      }

      // Load weekly plan
      const planRes = await api.get('/premium/plan/week');
      if (planRes.data.data) {
        setWeeklyPlan(planRes.data.data);
      }

      // Check premium status
      const premiumRes = await api.get('/subscription/status');
      if (premiumRes.data.data) {
        setIsPremium(premiumRes.data.data.is_premium || false);
      }

    } catch (err) {
      console.log('Load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSession = (type: ExerciseType, exercise?: Exercise) => {
    hapticSuccess();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setSessionType(type);
    setSelectedExercise(exercise || null);
    setIsSessionActive(true);
    setSessionTime(0);
    setSessionXp(0);
    timerScale.value = withRepeat(withSequence(withTiming(1.02, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1, true);
  };

  const handleEndSession = async () => {
    hapticSelection();
    setIsSessionActive(false);

    const minutes = Math.floor(sessionTime / 60);
    if (minutes > 0) {
      try {
        await api.post('/mewing/log', { mewing_minutes: minutes });
        setTodayMinutes((prev) => prev + minutes);
        setSessionXp((prev) => prev + minutes * 2);

        if (minutes >= 10) {
          Alert.alert('Session Complete! 🎉', `Great job! You mewed for ${minutes} minutes and earned ${sessionXp + minutes * 2} XP!`);
        } else {
          Alert.alert('Nice!', `${minutes} minutes logged.`);
        }
      } catch {
        Alert.alert('Session Saved', `${minutes} minutes logged locally.`);
      }
    }
  };

  const handleManualLog = async () => {
    const mins = parseInt(manualMinutes, 10);
    if (isNaN(mins) || mins <= 0) {
      Alert.alert('Invalid', 'Please enter a valid number.');
      return;
    }

    try {
      await api.post('/mewing/log', { mewing_minutes: mins });
      hapticSuccess();
      setShowLogModal(false);
      setManualMinutes('30');
      setTodayMinutes((prev) => prev + mins);
      Alert.alert('Logged!', `${mins} minutes added.`);
    } catch {
      hapticError();
      Alert.alert('Error', 'Failed to log.');
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTipForTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return DAILY_TIPS.find(t => t.time === 'morning') || DAILY_TIPS[0];
    if (hour < 17) return DAILY_TIPS.find(t => t.time === 'afternoon') || DAILY_TIPS[2];
    if (hour < 21) return DAILY_TIPS.find(t => t.time === 'evening') || DAILY_TIPS[3];
    return DAILY_TIPS.find(t => t.time === 'night') || DAILY_TIPS[4];
  };

  const breatheAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheScale.value }],
  }));

  const tip = getTipForTime();

  // Session View
  if (isSessionActive) {
    return (
      <View className="flex-1 bg-[#000000]">
        <View className="flex-1 items-center justify-center px-6">
          {/* Timer Circle */}
          <Animated.View style={[{ transform: [{ scale: timerScale }] }]}>
            <View className="relative items-center justify-center">
              <Svg width={200} height={200}>
                <Circle cx={100} cy={100} r={90} stroke="#1E293B" strokeWidth={8} fill="transparent" />
                <Circle
                  cx={100}
                  cy={100}
                  r={90}
                  stroke={EXERCISE_COLORS[sessionType]}
                  strokeWidth={8}
                  fill="transparent"
                  strokeLinecap="round"
                  strokeDasharray={90 * 2 * Math.PI}
                  strokeDashoffset={90 * 2 * Math.PI * (1 - (sessionTime % 60) / 60)}
                  transform="rotate(-90 100 100)"
                />
              </Svg>

              <View className="absolute items-center">
                <Text className="text-5xl font-bold text-white">{formatTime(sessionTime)}</Text>
                <Text className="text-violet-400 mt-1">{sessionXp} XP</Text>
              </View>
            </View>
          </Animated.View>

          {/* Session Type Label */}
          <View className="mt-6 px-4 py-2 rounded-full" style={{ backgroundColor: `${EXERCISE_COLORS[sessionType]}20` }}>
            <Text style={{ color: EXERCISE_COLORS[sessionType] }} className="font-semibold">
              {sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} Session
            </Text>
          </View>

          {/* Selected Exercise */}
          {selectedExercise && (
            <View className="mt-4 items-center">
              <Text className="text-white font-semibold text-lg">{selectedExercise.name}</Text>
              <Text className="text-slate-400 text-sm mt-1">{selectedExercise.description}</Text>
            </View>
          )}

          {/* Breathing Guide */}
          {showBreathingGuide && (
            <Animated.View style={[breatheAnimatedStyle]} className="mt-8 items-center">
              <View className="w-24 h-24 rounded-full bg-violet-500/20 items-center justify-center">
                <Text className="text-2xl font-bold text-violet-400 uppercase">
                  {breathingPhase === 'inhale' ? 'IN' : breathingPhase === 'hold' ? 'HOLD' : 'OUT'}
                </Text>
              </View>
              <Text className="text-slate-400 mt-2">Breathing Guide (4-4-4)</Text>
            </Animated.View>
          )}

          {/* Motivational Quote */}
          {!ambientMode && (
            <Text className="text-lg text-center text-violet-300 mt-8 px-4">
              {SESSION_QUOTES[currentQuoteIndex.current]}
            </Text>
          )}

          {/* Session Stats */}
          {!ambientMode && (
            <View className="flex-row gap-8 mt-8">
              <View className="items-center">
                <Ionicons name="flame" size={24} color="#F97316" />
                <Text className="text-white font-bold mt-1">{streak}</Text>
                <Text className="text-xs text-slate-500">Day Streak</Text>
              </View>
              <View className="items-center">
                <Ionicons name="timer" size={24} color="#10B981" />
                <Text className="text-white font-bold mt-1">{todayMinutes + Math.floor(sessionTime / 60)}</Text>
                <Text className="text-xs text-slate-500">Today</Text>
              </View>
            </View>
          )}

          {/* Controls */}
          <View className="flex-row gap-4 mt-10">
            <TouchableOpacity
              onPress={() => { hapticSelection(); setShowBreathingGuide(!showBreathingGuide); }}
              className={`px-5 py-3 rounded-full ${showBreathingGuide ? 'bg-violet-600' : 'bg-white/10'}`}
            >
              <Ionicons name="leaf" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { hapticSelection(); setAmbientMode(!ambientMode); }}
              className={`px-5 py-3 rounded-full ${ambientMode ? 'bg-violet-600' : 'bg-white/10'}`}
            >
              <Ionicons name="moon" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleEndSession}
              className="px-6 py-3 rounded-full bg-red-500/20 border border-red-500/30"
            >
              <Text className="text-red-400 font-semibold">End Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Normal View
  return (
    <SafeAreaView className="flex-1 bg-[#000000]" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={loadData} tintColor="#8B5CF6" />}
      >
        {/* Header */}
        <View className="px-5 pb-4 pt-2">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={() => { hapticSelection(); router.back(); }}
              className="items-center justify-center rounded-full"
              style={{ width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              <Ionicons name="chevron-back" size={22} color="#cbd5e1" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-white">Mewing</Text>
            <TouchableOpacity
              onPress={() => { hapticSelection(); router.push('/(protected)/progress'); }}
              className="items-center justify-center rounded-full"
              style={{ width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              <Ionicons name="stats-chart" size={20} color="#8B5CF6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Tip Banner */}
        <View className="mx-5 mb-4 px-4 py-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex-row items-center">
          <Ionicons name={tip.icon as any} size={20} color="#8B5CF6" />
          <Text className="ml-3 flex-1 text-violet-300 text-sm">{tip.text}</Text>
        </View>

        {/* Quick Start Buttons */}
        <View className="px-5 mb-6">
          <Text className="text-white font-semibold mb-3">Quick Start</Text>
          <View className="flex-row flex-wrap gap-3">
            {(Object.keys(EXERCISE_DURATIONS) as ExerciseType[]).map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => handleStartSession(type)}
                className="flex-1 min-w-[45%] rounded-2xl p-4"
                style={{ backgroundColor: `${EXERCISE_COLORS[type]}15`, borderColor: `${EXERCISE_COLORS[type]}30`, borderWidth: 1 }}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-white font-semibold capitalize">{type}</Text>
                    <Text className="text-slate-400 text-sm">{EXERCISE_DURATIONS[type]} min</Text>
                  </View>
                  <Ionicons name="play-circle" size={28} color={EXERCISE_COLORS[type]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Progress */}
        <View className="mx-5 mb-4 rounded-3xl bg-[#0F172A] p-5 border border-violet-500/20">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-white">Today's Progress</Text>
            <View className="flex-row items-center">
              <Ionicons name="flame" size={16} color="#F97316" />
              <Text className="text-orange-400 ml-1 font-semibold">{streak} day streak</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-4xl font-bold text-white">{todayMinutes}</Text>
              <Text className="text-slate-400">/ 60 min goal</Text>
            </View>
            <View className="w-20 h-20 rounded-full items-center justify-center" style={{ backgroundColor: todayMinutes >= 60 ? '#10B98120' : '#8B5CF620' }}>
              <Text className="text-xl font-bold" style={{ color: todayMinutes >= 60 ? '#10B981' : '#8B5CF6' }}>
                {Math.min(100, Math.round((todayMinutes / 60) * 100))}%
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (todayMinutes / 60) * 100)}%`,
                backgroundColor: todayMinutes >= 60 ? '#10B981' : '#8B5CF6'
              }}
            />
          </View>

          {/* Manual Log Button */}
          <TouchableOpacity
            onPress={() => { hapticSelection(); setShowLogModal(true); }}
            className="mt-4 py-3 rounded-xl bg-white/5 border border-white/10 flex-row items-center justify-center"
          >
            <Ionicons name="add-circle-outline" size={18} color="#8B5CF6" />
            <Text className="ml-2 text-violet-400 font-medium">Log Session Manually</Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Plan (Premium) */}
        {weeklyPlan && (
          <View className="mx-5 mb-4 rounded-3xl bg-gradient-to-br from-violet-900/30 to-indigo-900/30 p-5 border border-violet-500/30">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white font-semibold">Weekly Plan</Text>
              {!isPremium && (
                <View className="px-2 py-1 rounded-full bg-amber-500/20">
                  <Text className="text-amber-400 text-xs">Premium</Text>
                </View>
              )}
            </View>
            <Text className="text-slate-300 text-sm mb-3">{weeklyPlan.ai_insights}</Text>
            <View className="flex-row items-center">
              <Ionicons name="fitness" size={16} color="#8B5CF6" />
              <Text className="text-violet-400 text-sm ml-2">
                Weekly goal: {weeklyPlan.weekly_goal_minutes} min
              </Text>
            </View>
          </View>
        )}

        {/* Exercises List */}
        <View className="px-5 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white font-semibold">Guided Exercises</Text>
            <TouchableOpacity onPress={() => router.push('/(protected)/exercises')} className="flex-row items-center">
              <Text className="text-violet-400 text-sm">See All</Text>
              <Ionicons name="chevron-forward" size={16} color="#8B5CF6" />
            </TouchableOpacity>
          </View>

          {exercises.slice(0, 4).map((exercise, index) => (
            <TouchableOpacity
              key={exercise.id}
              onPress={() => !exercise.is_premium || isPremium ? handleStartSession(exercise.type, exercise) : router.push('/(protected)/paywall')}
              className={`mb-3 rounded-2xl p-4 border ${exercise.is_premium && !isPremium ? 'bg-amber-500/10 border-amber-500/20' : 'bg-[#0F172A] border-slate-800'}`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: `${EXERCISE_COLORS[exercise.type]}20` }}>
                    <Ionicons name={exercise.icon as any} size={20} color={EXERCISE_COLORS[exercise.type]} />
                  </View>
                  <View className="ml-3 flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-white font-medium">{exercise.name}</Text>
                      {exercise.is_premium && !isPremium && (
                        <Ionicons name="lock-closed" size={12} color="#FBBF24" style={{ marginLeft: 6 }} />
                      )}
                    </View>
                    <Text className="text-slate-500 text-sm">{exercise.duration_seconds / 60} min • {exercise.type}</Text>
                  </View>
                </View>
                <Ionicons name="play-circle" size={24} color={EXERCISE_COLORS[exercise.type]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Premium Banner */}
        {!isPremium && (
          <View className="mx-5 mb-6 overflow-hidden rounded-3xl">
            <LinearGradient colors={['#7C3AED', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View className="p-5">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="diamond" size={24} color="white" />
                  <Text className="ml-2 text-lg font-bold text-white">Go Premium</Text>
                </View>
                <Text className="text-white/90 text-sm mb-4">
                  Unlock AI coaching, personalized plans, video guides, and unlimited everything!
                </Text>
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-white/70 text-xs">Starting at</Text>
                    <Text className="text-white font-bold text-xl">$9.99/mo</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push('/(protected)/paywall')}
                    className="px-6 py-3 rounded-xl bg-white"
                  >
                    <Text className="text-violet-600 font-semibold">Upgrade</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>

      {/* Manual Log Modal */}
      <Modal visible={showLogModal} animationType="slide" transparent onRequestClose={() => setShowLogModal(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-3xl bg-[#0F172A] p-5 border-t border-violet-500/20">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-white">Log Session</Text>
              <TouchableOpacity onPress={() => setShowLogModal(false)} className="p-2">
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text className="text-slate-400 mb-2">Minutes mewed</Text>
            <TextInput
              value={manualMinutes}
              onChangeText={setManualMinutes}
              keyboardType="numeric"
              className="mb-4 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-lg text-white"
              placeholder="30"
            />

            <TouchableOpacity onPress={handleManualLog} className="overflow-hidden rounded-xl">
              <LinearGradient colors={['#7C3AED', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="py-4 items-center">
                <Text className="text-base font-semibold text-white">Save Session</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
