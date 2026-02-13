import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  ZoomIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import api from '../../lib/api';
import { hapticSuccess, hapticSelection } from '../../lib/haptics';

interface Reward {
  reward_type: string;
  reward_value: number;
  item_name?: string;
}

interface DailyChestProps {
  onRewardClaimed?: (reward: Reward) => void;
}

export default function DailyChest({ onRewardClaimed }: DailyChestProps) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpening, setIsOpening] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [reward, setReward] = useState<Reward | null>(null);

  const scale = useSharedValue(1);
  const shake = useSharedValue(0);
  const glow = useSharedValue(0.5);
  const resultScale = useSharedValue(0);

  useEffect(() => {
    checkAvailability();
    // Glow animation
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const checkAvailability = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/monetization/chest/status');
      setIsAvailable(res.data.available);
    } catch (err) {
      console.error('Failed to check chest status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const openChest = async () => {
    if (!isAvailable || isOpening) return;

    hapticSelection();
    setIsOpening(true);

    // Shake animation
    shake.value = withSequence(
      withTiming(-5, { duration: 50 }),
      withTiming(5, { duration: 50 }),
      withTiming(-5, { duration: 50 }),
      withTiming(5, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );

    try {
      const res = await api.post('/monetization/chest/open');
      const rewards = res.data.data?.rewards || [];

      if (rewards.length > 0) {
        setReward(rewards[0]);
        setIsAvailable(false);

        // Delay for dramatic effect
        setTimeout(() => {
          setIsOpening(false);
          setShowResult(true);
          resultScale.value = withSpring(1, { damping: 12 });
          hapticSuccess();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          if (onRewardClaimed) {
            onRewardClaimed(rewards[0]);
          }
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to open chest:', err);
      setIsOpening(false);
    }
  };

  const closeResult = () => {
    hapticSelection();
    resultScale.value = withTiming(0, { duration: 200 });
    setTimeout(() => setShowResult(false), 200);
  };

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shake.value },
      { scale: scale.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 1 + glow.value * 0.3 }],
  }));

  const resultStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resultScale.value }],
  }));

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'gems': return 'diamond';
      case 'xp': return 'star';
      case 'avatar_item': return 'person-circle';
      case 'premium_pass': return 'rocket';
      default: return 'gift';
    }
  };

  const getRewardColor = (type: string) => {
    switch (type) {
      case 'gems': return '#8B5CF6';
      case 'xp': return '#10B981';
      case 'avatar_item': return '#EC4899';
      case 'premium_pass': return '#FBBF24';
      default: return '#6B7280';
    }
  };

  const getRewardLabel = (type: string, value: number) => {
    switch (type) {
      case 'gems': return `${value} Gems`;
      case 'xp': return `+${value} XP`;
      case 'avatar_item': return 'New Avatar Item!';
      case 'premium_pass': return `${value}hr Premium Pass!`;
      default: return 'Reward';
    }
  };

  if (isLoading) return null;

  // Mini chest button for home screen
  if (!showResult) {
    return (
      <TouchableOpacity
        onPress={openChest}
        disabled={!isAvailable || isOpening}
        className="items-center"
        activeOpacity={0.8}
      >
        <Animated.View style={shakeStyle} className="relative">
          {/* Glow */}
          <Animated.View
            style={glowStyle}
            className="absolute w-16 h-16 rounded-full bg-amber-500/30"
          />

          {/* Chest */}
          <View
            className={`w-14 h-14 rounded-2xl items-center justify-center ${
              isAvailable ? 'bg-amber-500/20 border border-amber-500/40' : 'bg-slate-800/50 border border-slate-700'
            }`}
          >
            {isOpening ? (
              <ActivityIndicator size="small" color="#FBBF24" />
            ) : (
              <Ionicons
                name={isAvailable ? 'gift' : 'gift-outline'}
                size={28}
                color={isAvailable ? '#FBBF24' : '#475569'}
              />
            )}
          </View>

          {/* Badge */}
          {isAvailable && (
            <View className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 items-center justify-center">
              <Text className="text-white text-[10px] font-bold">!</Text>
            </View>
          )}
        </Animated.View>
        <Text className={`text-xs mt-1 ${isAvailable ? 'text-amber-400' : 'text-slate-500'}`}>
          {isAvailable ? 'Daily Chest' : 'Claimed'}
        </Text>
      </TouchableOpacity>
    );
  }

  // Full result modal
  return (
    <Modal visible={showResult} animationType="fade" transparent onRequestClose={closeResult}>
      <View className="flex-1 justify-center bg-black/90 items-center">
        <Animated.View entering={FadeIn.springify()} style={resultStyle} className="items-center">
          {/* Celebration background */}
          <View className="absolute w-80 h-80 rounded-full bg-amber-500/10" />

          {/* Reward card */}
          <View className="bg-[#1E1B4B] rounded-3xl p-8 border border-amber-500/30 items-center">
            {/* Icon */}
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: `${getRewardColor(reward?.reward_type || '')}20` }}
            >
              <Ionicons
                name={getRewardIcon(reward?.reward_type || '') as any}
                size={48}
                color={getRewardColor(reward?.reward_type || '')}
              />
            </View>

            {/* Reward text */}
            <Text className="text-amber-400 text-sm font-medium uppercase tracking-wide mb-1">
              You Received
            </Text>
            <Text className="text-white text-3xl font-bold text-center mb-2">
              {getRewardLabel(reward?.reward_type || '', reward?.reward_value || 0)}
            </Text>

            {reward?.item_name && (
              <Text className="text-violet-400 text-lg">{reward.item_name}</Text>
            )}

            {/* Claim button */}
            <TouchableOpacity
              onPress={closeResult}
              className="mt-6 px-8 py-3 rounded-2xl bg-amber-500"
            >
              <Text className="text-white font-bold text-lg">Awesome!</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
