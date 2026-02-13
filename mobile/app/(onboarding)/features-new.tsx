import React from 'react';
import { View, Text, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const FEATURES = [
  {
    icon: 'scan',
    title: 'AI Face Analysis',
    description: 'Get detailed scores for symmetry, jawline, skin, and more',
    color: '#7C3AED',
  },
  {
    icon: 'timer',
    title: 'Mewing Tracker',
    description: 'Track your daily mewing sessions and build the habit',
    color: '#EC4899',
  },
  {
    icon: 'fitness',
    title: 'Glow Plan',
    description: 'Personalized recommendations based on your analysis',
    color: '#0EA5E9',
  },
  {
    icon: 'trending-up',
    title: 'Progress Tracking',
    description: 'See your improvement over time with visual charts',
    color: '#10B981',
  },
];

export default function FeaturesScreen() {
  const router = useRouter();

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/social-proof');
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(protected)/(tabs)');
  };

  return (
    <View className="flex-1 bg-[#000000]">
      <LinearGradient
        colors={['#0A0A0F', '#000000']}
        style={{ position: 'absolute', width, height: 400 }}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 px-6 pt-16">
          {/* Header */}
          <Animated.View entering={FadeInUp.delay(100).springify()}>
            <Text className="text-3xl font-bold text-white text-center mb-2">
              Everything You Need
            </Text>
            <Text className="text-base text-slate-400 text-center mb-8">
              Your complete glow-up toolkit
            </Text>
          </Animated.View>

          {/* Features Grid */}
          <View className="gap-4 mb-8">
            {FEATURES.map((feature, index) => (
              <Animated.View
                key={index}
                entering={FadeInUp.delay(200 + index * 100).springify()}
                className="rounded-2xl p-5 border"
                style={{
                  backgroundColor: feature.color + '10',
                  borderColor: feature.color + '30',
                }}
              >
                <View className="flex-row items-start">
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                    style={{ backgroundColor: feature.color + '20' }}
                  >
                    <Ionicons name={feature.icon as any} size={24} color={feature.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-white mb-1">
                      {feature.title}
                    </Text>
                    <Text className="text-sm text-slate-400 leading-5">
                      {feature.description}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Tip Card */}
          <Animated.View
            entering={FadeInUp.delay(700).springify()}
            className="rounded-2xl bg-violet-500/10 border border-violet-500/20 p-4 mb-8"
          >
            <View className="flex-row items-start">
              <Ionicons name="bulb" size={20} color="#A78BFA" />
              <Text className="ml-3 text-sm text-violet-300 flex-1 leading-5">
                <Text className="font-semibold">Pro tip: </Text>
                Scan your face once a week to track your progress accurately
              </Text>
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <Animated.View
        entering={FadeInDown.delay(800).springify()}
        className="px-6 pb-12 pt-4 bg-[#000000]"
      >
        <TouchableOpacity
          onPress={handleContinue}
          activeOpacity={0.9}
          className="overflow-hidden rounded-2xl mb-3"
        >
          <LinearGradient
            colors={['#7C3AED', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="py-5 flex-row items-center justify-center"
          >
            <Text className="text-lg font-bold text-white">Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} className="py-2">
          <Text className="text-center text-slate-500">Skip for now</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
