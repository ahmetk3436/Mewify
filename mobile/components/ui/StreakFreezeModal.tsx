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
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import api from '../../lib/api';
import { hapticSuccess, hapticSelection, hapticError } from '../../lib/haptics';

interface StreakFreezeModalProps {
  visible: boolean;
  onClose: () => void;
  onFreezeActivated: () => void;
  currentStreak: number;
  isPremium: boolean;
}

interface FreezeStatus {
  can_use: boolean;
  method: string;
  gem_cost: number;
  is_premium: boolean;
}

export default function StreakFreezeModal({
  visible,
  onClose,
  onFreezeActivated,
  currentStreak,
  isPremium,
}: StreakFreezeModalProps) {
  const [status, setStatus] = useState<FreezeStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [gems, setGems] = useState(0);

  const pulse = useSharedValue(1);
  const shake = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      loadStatus();
      // Pulse animation
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    }
  }, [visible]);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const [statusRes, currencyRes] = await Promise.all([
        api.get('/monetization/streak-freeze/check'),
        api.get('/monetization/currency'),
      ]);
      setStatus(statusRes.data);
      setGems(currencyRes.data.data?.gems || 0);
    } catch (err) {
      console.error('Failed to load freeze status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!status?.can_use) return;

    hapticSelection();
    setIsActivating(true);

    try {
      await api.post('/monetization/streak-freeze/use');
      hapticSuccess();
      onFreezeActivated();
      onClose();
    } catch (err: any) {
      hapticError();
      // Shake animation on error
      shake.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    } finally {
      setIsActivating(false);
    }
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const getMethodText = () => {
    if (!status) return '';
    switch (status.method) {
      case 'premium':
        return 'Unlimited with Premium';
      case 'free_monthly':
        return 'Free Monthly Freeze';
      case 'gems':
        return `${status.gem_cost} Gems`;
      default:
        return 'Not Available';
    }
  };

  const getMethodColor = () => {
    if (!status) return '#6B7280';
    switch (status.method) {
      case 'premium':
        return '#FBBF24';
      case 'free_monthly':
        return '#10B981';
      case 'gems':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-center bg-black/80">
        <Animated.View
          entering={ZoomIn.springify()}
          style={shakeStyle}
          className="mx-6 overflow-hidden rounded-3xl"
        >
          <LinearGradient colors={['#1E1B4B', '#0F172A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            {/* Header */}
            <View className="p-6 pb-4 items-center">
              <Animated.View style={pulseStyle} className="w-20 h-20 rounded-full bg-amber-500/20 items-center justify-center mb-4">
                <Ionicons name="snow" size={40} color="#FBBF24" />
              </Animated.View>
              <Text className="text-2xl font-bold text-white text-center">Save Your Streak!</Text>
              <Text className="text-slate-400 text-center mt-2">
                Don't lose your {currentStreak} day streak! Use a Streak Freeze to protect it.
              </Text>
            </View>

            {/* Content */}
            <View className="px-6 pb-6">
              {isLoading ? (
                <ActivityIndicator size="large" color="#8B5CF6" />
              ) : (
                <>
                  {/* Current gems */}
                  <View className="flex-row items-center justify-between mb-4 p-4 rounded-2xl bg-slate-800/50">
                    <View className="flex-row items-center">
                      <Ionicons name="diamond" size={20} color="#8B5CF6" />
                      <Text className="text-white ml-2">Your Gems</Text>
                    </View>
                    <Text className="text-violet-400 font-bold text-lg">{gems}</Text>
                  </View>

                  {/* Freeze method */}
                  <View
                    className="p-4 rounded-2xl mb-4 border"
                    style={{ backgroundColor: `${getMethodColor()}15`, borderColor: `${getMethodColor()}40` }}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        {status?.method === 'premium' && <Ionicons name="star" size={20} color={getMethodColor()} />}
                        {status?.method === 'free_monthly' && <Ionicons name="gift" size={20} color={getMethodColor()} />}
                        {status?.method === 'gems' && <Ionicons name="diamond" size={20} color={getMethodColor()} />}
                        <Text className="text-white ml-2 font-medium">Payment Method</Text>
                      </View>
                      <Text style={{ color: getMethodColor() }} className="font-bold">
                        {getMethodText()}
                      </Text>
                    </View>
                  </View>

                  {/* Info text */}
                  {status?.can_use ? (
                    <View className="flex-row items-start mb-4">
                      <Ionicons name="information-circle" size={18} color="#6B7280" />
                      <Text className="text-slate-500 text-sm ml-2 flex-1">
                        {status.method === 'premium'
                          ? 'Premium members get unlimited streak freezes!'
                          : status.method === 'free_monthly'
                          ? 'You have 1 free streak freeze this month.'
                          : 'Gems will be deducted from your balance.'}
                      </Text>
                    </View>
                  ) : (
                    <View className="flex-row items-start mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                      <Ionicons name="alert-circle" size={18} color="#EF4444" />
                      <Text className="text-red-400 text-sm ml-2 flex-1">
                        No streak freezes available. Complete sessions to earn more gems!
                      </Text>
                    </View>
                  )}

                  {/* Buttons */}
                  <View className="flex-row gap-3 mt-2">
                    <TouchableOpacity
                      onPress={() => { hapticSelection(); onClose(); }}
                      className="flex-1 py-4 rounded-2xl bg-slate-800 items-center"
                    >
                      <Text className="text-slate-400 font-medium">Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleActivate}
                      disabled={!status?.can_use || isActivating}
                      className={`flex-1 py-4 rounded-2xl items-center ${status?.can_use ? 'bg-amber-500' : 'bg-slate-700'}`}
                    >
                      {isActivating ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text className={`font-bold ${status?.can_use ? 'text-white' : 'text-slate-500'}`}>
                          {isPremium ? 'Activate Freeze' : status?.method === 'gems' ? `Pay ${status.gem_cost} Gems` : 'Activate'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Upgrade prompt for non-premium */}
                  {!isPremium && (
                    <TouchableOpacity
                      onPress={() => { hapticSelection(); /* Navigate to paywall */ }}
                      className="mt-4 py-3 rounded-xl bg-violet-500/20 border border-violet-500/30 items-center"
                    >
                      <Text className="text-violet-400 font-medium">Get Premium for Unlimited Freezes</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}
