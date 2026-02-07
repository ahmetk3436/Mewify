import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hapticSelection } from '../../lib/haptics';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <View className="flex-1 items-center justify-center px-8">
        {/* Icon */}
        <View className="mb-6 h-24 w-24 items-center justify-center rounded-3xl bg-blue-600">
          <Ionicons name="sparkles" size={48} color="#ffffff" />
        </View>

        {/* Title */}
        <Text className="text-3xl font-bold text-white text-center">
          Welcome to Mewify
        </Text>
        <Text className="text-lg text-gray-400 text-center mt-3">
          Your AI-powered glow-up companion
        </Text>

        {/* Feature Pills */}
        <View className="flex-row flex-wrap justify-center mt-8 gap-3">
          <View className="rounded-full bg-blue-900/40 border border-blue-700 px-4 py-2">
            <Text className="text-sm font-medium text-blue-300">AI Face Analysis</Text>
          </View>
          <View className="rounded-full bg-purple-900/40 border border-purple-700 px-4 py-2">
            <Text className="text-sm font-medium text-purple-300">Mewing Tracker</Text>
          </View>
          <View className="rounded-full bg-green-900/40 border border-green-700 px-4 py-2">
            <Text className="text-sm font-medium text-green-300">Glow Plan</Text>
          </View>
        </View>
      </View>

      {/* Bottom Section */}
      <View className="px-8 pb-8">
        <Pressable
          className="items-center rounded-2xl bg-blue-600 py-4"
          onPress={() => {
            hapticSelection();
            router.push('/(onboarding)/features');
          }}
        >
          <Text className="text-lg font-semibold text-white">Get Started</Text>
        </Pressable>

        {/* Page Dots */}
        <View className="flex-row justify-center mt-6 gap-2">
          <View className="h-2 w-8 rounded-full bg-blue-600" />
          <View className="h-2 w-2 rounded-full bg-gray-700" />
          <View className="h-2 w-2 rounded-full bg-gray-700" />
        </View>
      </View>
    </SafeAreaView>
  );
}
