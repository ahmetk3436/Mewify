import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface EmptyStateProps {
  type: 'dashboard' | 'progress' | 'glow_plan' | 'mewing' | 'error';
  onAction?: () => void;
  actionLabel?: string;
}

const EMPTY_STATES = {
  dashboard: {
    icon: 'sparkles',
    title: 'Your glow-up starts here',
    subtitle: 'Take your first scan to discover your potential',
    action: 'Start Scan',
    gradient: ['#7C3AED', '#EC4899'],
  },
  progress: {
    icon: 'trending-up',
    title: 'Every scan tells a story',
    subtitle: 'Your progress timeline will appear here',
    action: 'Take First Scan',
    gradient: ['#0EA5E9', '#06B6D4'],
  },
  glow_plan: {
    icon: 'leaf',
    title: 'Personalized recommendations',
    subtitle: 'Complete your first scan to unlock your glow plan',
    action: 'Scan Now',
    gradient: ['#10B981', '#34D399'],
  },
  mewing: {
    icon: 'timer',
    title: 'Ready to build your habit?',
    subtitle: 'Log your first mewing session to start tracking',
    action: 'Log Session',
    gradient: ['#F59E0B', '#FB923C'],
  },
  error: {
    icon: 'cloud-offline',
    title: 'Oops! Something went wrong',
    subtitle: 'Please check your connection and try again',
    action: 'Retry',
    gradient: ['#EF4444', '#F87171'],
  },
};

export default function EmptyState({ type, onAction, actionLabel }: EmptyStateProps) {
  const config = EMPTY_STATES[type];
  const floatY = useSharedValue(0);

  // Floating animation for icon
  floatY.value = withRepeat(
    withSequence(
      withTiming(-10, { duration: 1500 }),
      withTiming(0, { duration: 1500 })
    ),
    -1,
    true
  );

  const floatAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      {/* Animated Icon */}
      <Animated.View
        entering={FadeIn.delay(100).duration(500)}
        style={floatAnimatedStyle}
        className="mb-6"
      >
        <View
          className="w-24 h-24 rounded-full items-center justify-center"
          style={{
            backgroundColor: config.gradient[0] + '20',
            shadowColor: config.gradient[0],
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 30,
            shadowOpacity: 0.3,
          }}
        >
          <Ionicons name={config.icon as any} size={48} color={config.gradient[0]} />
        </View>
      </Animated.View>

      {/* Title */}
      <Animated.Text
        entering={FadeInUp.delay(200).springify()}
        className="text-2xl font-bold text-white text-center mb-2"
      >
        {config.title}
      </Animated.Text>

      {/* Subtitle */}
      <Animated.Text
        entering={FadeInUp.delay(300).springify()}
        className="text-base text-slate-400 text-center mb-8 leading-6"
      >
        {config.subtitle}
      </Animated.Text>

      {/* Action Button */}
      {onAction && (
        <Animated.View entering={FadeInUp.delay(400).springify()}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onAction();
            }}
            activeOpacity={0.9}
            className="overflow-hidden rounded-2xl"
          >
            <LinearGradient
              colors={config.gradient as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="py-4 px-8 flex-row items-center"
            >
              <Text className="text-base font-bold text-white">
                {actionLabel || config.action}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color="white"
                style={{ marginLeft: 8 }}
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Motivational Quote */}
      {type !== 'error' && (
        <Animated.Text
          entering={FadeInUp.delay(500).springify()}
          className="mt-8 text-sm text-slate-600 italic text-center"
        >
          "The journey of a thousand glows begins with a single scan"
        </Animated.Text>
      )}
    </View>
  );
}

// Inline Empty State for cards
export function InlineEmptyState({
  icon,
  message,
  compact = false,
}: {
  icon: string;
  message: string;
  compact?: boolean;
}) {
  return (
    <View className={`items-center ${compact ? 'py-4' : 'py-8'}`}>
      <View className="w-12 h-12 rounded-full bg-violet-500/10 items-center justify-center mb-2">
        <Ionicons name={icon as any} size={24} color="#8B5CF6" />
      </View>
      <Text className="text-sm text-slate-400 text-center">{message}</Text>
    </View>
  );
}
