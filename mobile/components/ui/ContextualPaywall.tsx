import React, { useState } from 'react';
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
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface PaywallProps {
  visible: boolean;
  onClose: () => void;
  trigger: 'scan_complete' | 'streak_achievement' | 'feature_locked' | 'comparison';
}

const PACKAGES = [
  {
    id: 'weekly',
    name: 'Weekly',
    price: '$2.99',
    period: '/week',
    savings: null,
    popular: false,
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$7.99',
    period: '/month',
    savings: 'Save 33%',
    popular: true,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$49.99',
    period: '/year',
    savings: 'Save 68%',
    popular: false,
  },
];

const TRIGGER_MESSAGES = {
  scan_complete: {
    title: 'Unlock Full Analysis',
    subtitle: 'Get detailed insights for every facial feature',
    icon: 'scan',
  },
  streak_achievement: {
    title: 'Keep Your Streak Going!',
    subtitle: 'Streak freeze & unlimited tracking with Premium',
    icon: 'flame',
  },
  feature_locked: {
    title: 'Premium Feature',
    subtitle: 'This feature requires a Premium subscription',
    icon: 'lock-closed',
  },
  comparison: {
    title: 'Compare Your Progress',
    subtitle: 'Unlock unlimited before/after comparisons',
    icon: 'git-compare',
  },
};

export default function ContextualPaywall({ visible, onClose, trigger }: PaywallProps) {
  const [selectedPackage, setSelectedPackage] = useState('monthly');
  const buttonScale = useSharedValue(1);

  const config = TRIGGER_MESSAGES[trigger];

  // Pulsing button
  buttonScale.value = withRepeat(
    withSequence(
      withTiming(1.02, { duration: 600 }),
      withTiming(1, { duration: 600 })
    ),
    -1,
    true
  );

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePurchase = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Purchase logic here
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/70">
        <View className="rounded-t-3xl bg-[#0A0A0F] border-t border-violet-500/20">
          {/* Header */}
          <View className="items-center py-4">
            <View className="w-12 h-1 rounded-full bg-slate-700" />
          </View>

          {/* Content */}
          <View className="px-6 pb-6">
            {/* Icon & Title */}
            <Animated.View
              entering={FadeInUp.delay(100).springify()}
              className="items-center mb-6"
            >
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-4"
                style={{
                  backgroundColor: '#7C3AED20',
                  shadowColor: '#7C3AED',
                  shadowOffset: { width: 0, height: 0 },
                  shadowRadius: 20,
                  shadowOpacity: 0.4,
                }}
              >
                <Ionicons name={config.icon as any} size={32} color="#8B5CF6" />
              </View>
              <Text className="text-2xl font-bold text-white text-center">
                {config.title}
              </Text>
              <Text className="text-base text-slate-400 text-center mt-1">
                {config.subtitle}
              </Text>
            </Animated.View>

            {/* Benefits */}
            <Animated.View
              entering={FadeInUp.delay(200).springify()}
              className="flex-row flex-wrap justify-center gap-3 mb-6"
            >
              {[
                'Unlimited Scans',
                'Streak Freeze',
                'Full Analysis',
                'No Ads',
              ].map((benefit, i) => (
                <View
                  key={i}
                  className="flex-row items-center px-3 py-1.5 rounded-full bg-violet-500/10"
                >
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text className="ml-1.5 text-sm text-slate-300">{benefit}</Text>
                </View>
              ))}
            </Animated.View>

            {/* Package Selection */}
            <Animated.View entering={FadeInUp.delay(300).springify()} className="gap-3 mb-6">
              {PACKAGES.map((pkg) => (
                <TouchableOpacity
                  key={pkg.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPackage(pkg.id);
                  }}
                  className={`rounded-2xl p-4 border ${
                    selectedPackage === pkg.id
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-slate-800 bg-slate-900/50'
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View
                        className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                          selectedPackage === pkg.id ? 'border-violet-500' : 'border-slate-600'
                        }`}
                      >
                        {selectedPackage === pkg.id && (
                          <View className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                        )}
                      </View>
                      <Text className="ml-3 text-base font-semibold text-white">
                        {pkg.name}
                      </Text>
                      {pkg.popular && (
                        <View className="ml-2 px-2 py-0.5 rounded-full bg-pink-500/20">
                          <Text className="text-xs text-pink-400 font-medium">Popular</Text>
                        </View>
                      )}
                    </View>
                    <View className="items-end">
                      <Text className="text-lg font-bold text-white">{pkg.price}</Text>
                      <Text className="text-xs text-slate-500">{pkg.period}</Text>
                    </View>
                  </View>
                  {pkg.savings && (
                    <Text className="text-xs text-emerald-400 mt-2 ml-8">
                      {pkg.savings}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </Animated.View>

            {/* CTA Button */}
            <Animated.View style={buttonAnimatedStyle}>
              <TouchableOpacity
                onPress={handlePurchase}
                activeOpacity={0.9}
                className="overflow-hidden rounded-2xl"
              >
                <LinearGradient
                  colors={['#7C3AED', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="py-4 flex-row items-center justify-center"
                >
                  <Text className="text-lg font-bold text-white">
                    Subscribe Now
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Restore & Terms */}
            <View className="mt-4 items-center">
              <TouchableOpacity onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                <Text className="text-sm text-slate-500">Restore Purchases</Text>
              </TouchableOpacity>
              <Text className="text-xs text-slate-600 mt-2 text-center">
                Cancel anytime. Terms & Privacy apply.
              </Text>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              onPress={onClose}
              className="absolute right-4 top-2"
            >
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
