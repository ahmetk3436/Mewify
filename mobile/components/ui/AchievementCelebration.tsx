import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface CelebrationProps {
  visible: boolean;
  achievement: Achievement | null;
  onClose: () => void;
}

// Confetti particle component
const ConfettiParticle = ({ delay, color, startX }: { delay: number; color: string; startX: number }) => {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(startX);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    setTimeout(() => {
      translateY.value = withTiming(height + 50, { duration: 3000 });
      translateX.value = withSequence(
        withTiming(startX + (Math.random() - 0.5) * 100, { duration: 1500 }),
        withTiming(startX + (Math.random() - 0.5) * 200, { duration: 1500 })
      );
      rotation.value = withTiming(720, { duration: 3000 });
      opacity.value = withTiming(0, { duration: 2500 });
    }, delay);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: height * 0.3,
          width: 10,
          height: 10,
          backgroundColor: color,
          borderRadius: 2,
        },
        animatedStyle,
      ]}
    />
  );
};

const CONFETTI_COLORS = ['#7C3AED', '#EC4899', '#0EA5E9', '#10B981', '#F59E0B'];

export default function AchievementCelebration({ visible, achievement, onClose }: CelebrationProps) {
  const scale = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (visible && achievement) {
      // Haptic celebration
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Scale animation
      scale.value = withSpring(1, { damping: 12, stiffness: 100 });

      // Glow pulse
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800 }),
          withTiming(0.3, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      scale.value = 0;
    }
  }, [visible, achievement]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (!achievement) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/80">
        {/* Confetti */}
        {visible && Array.from({ length: 30 }).map((_, i) => (
          <ConfettiParticle
            key={i}
            delay={i * 50}
            color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
            startX={(Math.random() - 0.5) * width}
          />
        ))}

        {/* Achievement Card */}
        <Animated.View
          entering={FadeIn.delay(200).springify()}
          style={animatedStyle}
          className="mx-6 items-center"
        >
          {/* Glow */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: 250,
                height: 250,
                borderRadius: 125,
                backgroundColor: achievement.color,
              },
              glowStyle,
            ]}
          />

          {/* Content Card */}
          <View className="rounded-3xl bg-[#0F172A] p-8 border border-violet-500/30 items-center w-full">
            {/* Achievement Icon */}
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-4"
              style={{
                backgroundColor: achievement.color + '20',
                shadowColor: achievement.color,
                shadowOffset: { width: 0, height: 0 },
                shadowRadius: 30,
                shadowOpacity: 0.6,
              }}
            >
              <Ionicons name={achievement.icon as any} size={48} color={achievement.color} />
            </View>

            {/* Achievement Badge Label */}
            <View
              className="px-4 py-1.5 rounded-full mb-3"
              style={{ backgroundColor: achievement.color + '20' }}
            >
              <Text className="text-sm font-bold uppercase tracking-wider" style={{ color: achievement.color }}>
                Achievement Unlocked
              </Text>
            </View>

            {/* Achievement Name */}
            <Text className="text-2xl font-bold text-white text-center mb-2">
              {achievement.name}
            </Text>

            {/* Description */}
            <Text className="text-base text-slate-400 text-center mb-6">
              {achievement.description}
            </Text>

            {/* XP Reward */}
            <View className="flex-row items-center mb-6 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <Ionicons name="star" size={20} color="#F59E0B" />
              <Text className="ml-2 text-amber-400 font-semibold">+100 XP</Text>
            </View>

            {/* Share Button */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // Share logic
              }}
              className="flex-row items-center px-6 py-3 rounded-xl bg-white/5 border border-white/10 mb-3 w-full justify-center"
            >
              <Ionicons name="share-social" size={18} color="#8B5CF6" />
              <Text className="ml-2 text-violet-400 font-semibold">Share Achievement</Text>
            </TouchableOpacity>

            {/* Continue Button */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onClose();
              }}
              className="overflow-hidden rounded-xl w-full"
            >
              <LinearGradient
                colors={['#7C3AED', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="py-4 flex-row items-center justify-center"
              >
                <Text className="text-base font-bold text-white">Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
