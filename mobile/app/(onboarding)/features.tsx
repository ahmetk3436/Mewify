import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <SafeAreaView className="flex-1 bg-gray-950">
      <View className="flex-1 px-8 pt-12">
        <Text className="text-2xl font-bold text-white text-center mb-2">
          Everything You Need
        </Text>
        <Text className="text-base text-gray-400 text-center mb-8">
          Powerful tools for your glow-up journey
        </Text>

        {/* Feature Cards */}
        {FEATURES.map((feature) => (
          <View
            key={feature.title}
            className="rounded-2xl p-5 mb-4 border border-gray-800"
            style={{ backgroundColor: feature.bgColor + '30' }}
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
                <Text className="text-sm text-gray-400 mt-1">
                  {feature.description}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Bottom Section */}
      <View className="px-8 pb-8">
        <Pressable
          className="items-center rounded-2xl bg-blue-600 py-4"
          onPress={() => {
            hapticSelection();
            router.push('/(onboarding)/start');
          }}
        >
          <Text className="text-lg font-semibold text-white">Continue</Text>
        </Pressable>

        {/* Page Dots */}
        <View className="flex-row justify-center mt-6 gap-2">
          <View className="h-2 w-2 rounded-full bg-gray-700" />
          <View className="h-2 w-8 rounded-full bg-blue-600" />
          <View className="h-2 w-2 rounded-full bg-gray-700" />
        </View>
      </View>
    </SafeAreaView>
  );
}
