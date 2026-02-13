import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const glowScale = useSharedValue(1);

  // Pulsing glow animation
  glowScale.value = withRepeat(
    withSequence(
      withTiming(1.1, { duration: 1500 }),
      withTiming(1, { duration: 1500 })
    ),
    -1,
    true
  );

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/features-new');
  };

  return (
    <View className="flex-1 bg-[#000000]">
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1E1B4B', '#0A0A0F', '#000000']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', width, height }}
      />

      {/* Decorative orbs */}
      <Animated.View
        entering={FadeIn.delay(300).duration(1000)}
        style={{
          position: 'absolute',
          top: height * 0.15,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: '#7C3AED',
          opacity: 0.3,
          transform: [{ scale: glowScale }],
        }}
      />
      <Animated.View
        entering={FadeIn.delay(500).duration(1000)}
        style={{
          position: 'absolute',
          bottom: height * 0.25,
          left: -80,
          width: 250,
          height: 250,
          borderRadius: 125,
          backgroundColor: '#EC4899',
          opacity: 0.2,
        }}
      />

      {/* Content */}
      <View className="flex-1 px-6 pt-20">
        {/* Hero Icon */}
        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          className="items-center mb-8"
        >
          <View
            className="w-28 h-28 rounded-full items-center justify-center"
            style={{
              backgroundColor: '#7C3AED20',
              shadowColor: '#7C3AED',
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 30,
              shadowOpacity: 0.5,
            }}
          >
            <Ionicons name="sparkles" size={56} color="#A78BFA" />
          </View>
        </Animated.View>

        {/* Main Heading */}
        <Animated.View entering={FadeInUp.delay(400).springify()}>
          <Text className="text-4xl font-bold text-white text-center mb-4">
            Discover Your{'\n'}
            <Text className="text-transparent bg-transparent"
              style={{
                backgroundColor: 'transparent',
              }}>
              <Text style={{ color: '#A78BFA' }}>Potential</Text>
            </Text>
          </Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.Text
          entering={FadeInUp.delay(500).springify()}
          className="text-lg text-slate-400 text-center mb-12 leading-7"
        >
          AI-powered facial analysis that reveals your unique glow-up journey
        </Animated.Text>

        {/* Feature Pills */}
        <Animated.View
          entering={FadeInUp.delay(600).springify()}
          className="flex-row flex-wrap justify-center gap-3 mb-12"
        >
          {[
            { icon: 'camera', text: 'Face Scanning' },
            { icon: 'analytics', text: 'Score Tracking' },
            { icon: 'leaf', text: 'Glow Plan' },
          ].map((feature, i) => (
            <View
              key={i}
              className="flex-row items-center px-4 py-2 rounded-full bg-white/5 border border-white/10"
            >
              <Ionicons name={feature.icon as any} size={16} color="#8B5CF6" />
              <Text className="ml-2 text-sm text-slate-300">{feature.text}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Stats */}
        <Animated.View
          entering={FadeInUp.delay(700).springify()}
          className="flex-row justify-around mb-12"
        >
          {[
            { value: '50K+', label: 'Users' },
            { value: '2M+', label: 'Scans' },
            { value: '4.9', label: 'Rating' },
          ].map((stat, i) => (
            <View key={i} className="items-center">
              <Text className="text-2xl font-bold text-white">{stat.value}</Text>
              <Text className="text-xs text-slate-500 mt-1">{stat.label}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Bottom CTA */}
      <Animated.View
        entering={FadeInDown.delay(800).springify()}
        className="px-6 pb-12"
      >
        <TouchableOpacity
          onPress={handleContinue}
          activeOpacity={0.9}
          className="overflow-hidden rounded-2xl"
        >
          <LinearGradient
            colors={['#7C3AED', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="py-5 flex-row items-center justify-center"
          >
            <Text className="text-lg font-bold text-white">Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(auth)/login');
          }}
          className="mt-4 py-4"
        >
          <Text className="text-center text-slate-400">
            Already have an account? <Text className="text-violet-400">Sign In</Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
