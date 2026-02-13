import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { hapticSelection } from '../../lib/haptics';

const FEATURES = [
  {
    icon: 'camera' as const,
    color: '#3b82f6',
    bgColor: '#1e3a5f',
    title: 'AI Face Scanning',
    description: 'Get detailed analysis of your facial features with advanced AI technology',
  },
  {
    icon: 'fitness' as const,
    color: '#10b981',
    bgColor: '#064e3b',
    title: 'Mewing Tracker',
    description: 'Track daily practice, build streaks, and monitor your jaw improvement',
  },
  {
    icon: 'sparkles' as const,
    color: '#a855f7',
    bgColor: '#4c1d95',
    title: 'Glow Plan',
    description: 'Personalized recommendations powered by AI for your glow-up journey',
  },
];

export default function FeaturesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#040916]">
      <LinearGradient colors={['#040916', '#0a1630', '#121a3f']} style={{ flex: 1 }}>
        <View className="flex-1 px-8 pt-12">
          <Text className="mb-2 text-center text-2xl font-bold text-white">
            Everything You Need
          </Text>
          <Text className="mb-8 text-center text-base text-gray-300">
            Powerful tools for your glow-up journey
          </Text>

          {FEATURES.map((feature) => (
            <View
              key={feature.title}
              className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <View className="flex-row items-center">
                <View
                  className="h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: feature.bgColor }}
                >
                  <Ionicons name={feature.icon} size={24} color={feature.color} />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-lg font-semibold text-white">
                    {feature.title}
                  </Text>
                  <Text className="mt-1 text-sm text-gray-300">
                    {feature.description}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View className="px-8 pb-8">
          <Pressable
            onPress={() => {
              hapticSelection();
              router.push('/(onboarding)/start');
            }}
          >
            <LinearGradient
              colors={['#2563eb', '#4f46e5']}
              className="items-center rounded-2xl py-4"
            >
              <Text className="text-lg font-semibold text-white">Continue</Text>
            </LinearGradient>
          </Pressable>

          <View className="mt-6 flex-row justify-center gap-2">
            <View className="h-2 w-2 rounded-full bg-gray-700" />
            <View className="h-2 w-8 rounded-full bg-blue-500" />
            <View className="h-2 w-2 rounded-full bg-gray-700" />
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
