import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { useAuth } from '../../contexts/AuthContext';

const ONBOARDING_KEY = '@mewify_onboarding_complete_v3';

const { width, height } = Dimensions.get('window');

const TESTIMONIALS = [
  {
    name: 'Jake M.',
    text: 'Went from 5.2 to 7.8 in 3 months!',
    avatar: 'person',
  },
  {
    name: 'Alex T.',
    text: 'The mewing tracker changed my life',
    avatar: 'person',
  },
  {
    name: 'Chris P.',
    text: 'Finally seeing jawline definition',
    avatar: 'person',
  },
];

export default function SocialProofScreen() {
  const router = useRouter();
  const { continueAsGuest } = useAuth();
  const ctaScale = useSharedValue(1);

  // Pulsing CTA
  ctaScale.value = withRepeat(
    withSequence(
      withTiming(1.03, { duration: 800 }),
      withTiming(1, { duration: 800 })
    ),
    -1,
    true
  );

  const ctaAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  const handleStart = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Mark onboarding as complete
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    await continueAsGuest();
    router.replace('/(protected)/(tabs)');
  };

  return (
    <View className="flex-1 bg-[#000000]">
      <LinearGradient
        colors={['#1E1B4B', '#0A0A0F', '#000000']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', width, height }}
      />

      {/* Background decoration */}
      <Animated.View
        entering={FadeIn.delay(300).duration(1000)}
        style={{
          position: 'absolute',
          top: height * 0.1,
          left: -100,
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: '#7C3AED',
          opacity: 0.15,
        }}
      />

      <View className="flex-1 px-6 pt-16">
        {/* Stats Banner */}
        <Animated.View
          entering={FadeInUp.delay(100).springify()}
          className="flex-row justify-around mb-8 py-4 rounded-2xl bg-white/5 border border-white/10"
        >
          {[
            { value: '50K+', label: 'Active Users' },
            { value: '2M+', label: 'Scans Done' },
            { value: '4.9★', label: 'App Rating' },
          ].map((stat, i) => (
            <View key={i} className="items-center">
              <Text className="text-xl font-bold text-white">{stat.value}</Text>
              <Text className="text-xs text-slate-500 mt-1">{stat.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Main Heading */}
        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <Text className="text-3xl font-bold text-white text-center mb-2">
            Join the Community
          </Text>
          <Text className="text-base text-slate-400 text-center mb-6">
            See what others are achieving
          </Text>
        </Animated.View>

        {/* Testimonials */}
        <Animated.View entering={FadeInUp.delay(400).springify()} className="gap-4 mb-8">
          {TESTIMONIALS.map((testimonial, index) => (
            <View
              key={index}
              className="rounded-2xl bg-white/5 border border-white/10 p-4"
            >
              <View className="flex-row items-start">
                <View className="w-10 h-10 rounded-full bg-violet-500/20 items-center justify-center mr-3">
                  <Ionicons name={testimonial.avatar as any} size={18} color="#8B5CF6" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-white font-medium mb-1">
                    {testimonial.name}
                  </Text>
                  <Text className="text-sm text-slate-400">
                    "{testimonial.text}"
                  </Text>
                </View>
                <View className="flex-row">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons key={star} name="star" size={12} color="#F59E0B" />
                  ))}
                </View>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Trust Indicators */}
        <Animated.View
          entering={FadeInUp.delay(600).springify()}
          className="flex-row justify-center gap-6 mb-4"
        >
          {[
            { icon: 'shield-checkmark', text: 'Privacy First' },
            { icon: 'lock-closed', text: 'Secure' },
            { icon: 'cloud-offline', text: 'Local Data' },
          ].map((item, i) => (
            <View key={i} className="items-center">
              <View className="w-10 h-10 rounded-full bg-emerald-500/20 items-center justify-center mb-1">
                <Ionicons name={item.icon as any} size={18} color="#10B981" />
              </View>
              <Text className="text-xs text-slate-500">{item.text}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Bottom CTA */}
      <Animated.View
        entering={FadeInDown.delay(700).springify()}
        className="px-6 pb-12"
      >
        <Animated.View style={ctaAnimatedStyle}>
          <TouchableOpacity
            onPress={handleStart}
            activeOpacity={0.9}
            className="overflow-hidden rounded-2xl"
          >
            <LinearGradient
              colors={['#7C3AED', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="py-5 flex-row items-center justify-center"
            >
              <Ionicons name="rocket" size={22} color="white" />
              <Text className="text-lg font-bold text-white ml-2">
                Start Your Journey
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Text className="text-center text-slate-600 text-xs mt-4">
          Free to start • No credit card required
        </Text>
      </Animated.View>
    </View>
  );
}
