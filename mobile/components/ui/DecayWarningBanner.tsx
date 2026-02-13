import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated as RNAnimated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import { hapticSelection } from '../../lib/haptics';

interface DecayStatus {
  decay_level: number;
  days_since: number;
  message: string;
  last_active_at: string;
}

interface DecayWarningBannerProps {
  onSessionStart?: () => void;
}

export default function DecayWarningBanner({ onSessionStart }: DecayWarningBannerProps) {
  const router = useRouter();
  const [status, setStatus] = useState<DecayStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const pulse = useSharedValue(1);
  const shake = useSharedValue(0);

  useEffect(() => {
    checkDecay();
    // Warning animation
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      true
    );
  }, []);

  const checkDecay = async () => {
    try {
      const res = await api.get('/monetization/decay/status');
      if (res.data.data?.decay_level > 0) {
        setStatus(res.data);
      }
    } catch (err) {
      console.error('Failed to check decay:', err);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  const handleAction = () => {
    hapticSelection();
    if (onSessionStart) {
      onSessionStart();
    } else {
      router.push('/(protected)/mewing');
    }
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  if (!status || dismissed || status.decay_level === 0) return null;

  const getColors = (): readonly [string, string, ...string[]] => {
    switch (status.decay_level) {
      case 1:
        return ['#78350F', '#451A03']; // Amber warning
      case 2:
        return ['#7C2D12', '#431407']; // Orange danger
      case 3:
        return ['#7F1D1D', '#450A0A']; // Red critical
      default:
        return ['#1E1B4B', '#0F0A1F'];
    }
  };

  const getIcon = (): string => {
    switch (status.decay_level) {
      case 1:
        return 'time-outline';
      case 2:
        return 'warning-outline';
      case 3:
        return 'alert-circle';
      default:
        return 'information-circle';
    }
  };

  const getTitle = (): string => {
    switch (status.decay_level) {
      case 1:
        return "You haven't mewed today!";
      case 2:
        return 'Your muscles are relaxing!';
      case 3:
        return 'Progress fading!';
      default:
        return 'Stay consistent!';
    }
  };

  const getSubtitle = (): string => {
    switch (status.decay_level) {
      case 1:
        return 'Keep your streak alive!';
      case 2:
        return "Don't lose your hard-earned progress";
      case 3:
        return 'Your level may decrease if you skip!';
      default:
        return '';
    }
  };

  return (
    <Animated.View entering={FadeIn.springify()} className="mx-4 mb-4">
      <LinearGradient
        colors={getColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-2xl overflow-hidden"
      >
        <View className="p-4 flex-row items-center">
          {/* Animated icon */}
          <Animated.View style={pulseStyle} className="mr-3">
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{
                backgroundColor: status.decay_level === 3 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(251, 191, 36, 0.3)',
              }}
            >
              <Ionicons
                name={getIcon() as any}
                size={24}
                color={status.decay_level === 3 ? '#EF4444' : '#FBBF24'}
              />
            </View>
          </Animated.View>

          {/* Content */}
          <View className="flex-1">
            <Text className="text-white font-semibold">{getTitle()}</Text>
            <Text className="text-white/70 text-sm mt-0.5">{getSubtitle()}</Text>
          </View>

          {/* Dismiss button */}
          <TouchableOpacity
            onPress={handleDismiss}
            className="p-2"
          >
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>

        {/* Action button */}
        <TouchableOpacity
          onPress={handleAction}
          className="mx-4 mb-4 py-3 rounded-xl bg-white/10 flex-row items-center justify-center"
        >
          <Ionicons name="play-circle" size={18} color="white" />
          <Text className="text-white font-medium ml-2">Start Session Now</Text>
        </TouchableOpacity>

        {/* Days inactive indicator */}
        <View className="px-4 pb-3 flex-row items-center justify-center">
          <Text className="text-white/50 text-xs">
            {status.days_since} day{status.days_since > 1 ? 's' : ''} since last session
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}
