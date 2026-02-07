import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { hapticSelection } from '../../lib/haptics';

export default function StartScreen() {
  const router = useRouter();

  const completeOnboarding = async () => {
    await SecureStore.setItemAsync('onboarding_complete', 'true');
  };

  const handleTryFree = async () => {
    hapticSelection();
    await completeOnboarding();
    router.replace('/(auth)/login');
  };

  const handleSignIn = async () => {
    hapticSelection();
    await completeOnboarding();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <View className="flex-1 items-center justify-center px-8">
        {/* Big Icon */}
        <View className="mb-8 h-32 w-32 items-center justify-center rounded-full bg-blue-600/20 border-2 border-blue-600">
          <Ionicons name="rocket" size={56} color="#3b82f6" />
        </View>

        <Text className="text-3xl font-bold text-white text-center">
          Ready to glow up?
        </Text>
        <Text className="text-base text-gray-400 text-center mt-3">
          Start your transformation today with AI-powered face analysis and personalized plans
        </Text>

        {/* Benefits */}
        <View className="mt-8 w-full">
          {[
            'AI-powered face analysis',
            'Personalized glow-up plan',
            'Daily mewing tracker with streaks',
          ].map((benefit) => (
            <View key={benefit} className="flex-row items-center mb-3">
              <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
              <Text className="ml-3 text-base text-gray-300">{benefit}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom Section */}
      <View className="px-8 pb-8">
        <Pressable
          className="items-center rounded-2xl bg-blue-600 py-4 mb-4"
          onPress={handleTryFree}
        >
          <Text className="text-lg font-semibold text-white">
            Try Free - 3 Scans/Day
          </Text>
        </Pressable>

        <Pressable
          className="items-center py-3"
          onPress={handleSignIn}
        >
          <Text className="text-base font-medium text-blue-400">Sign In</Text>
        </Pressable>

        {/* Page Dots */}
        <View className="flex-row justify-center mt-4 gap-2">
          <View className="h-2 w-2 rounded-full bg-gray-700" />
          <View className="h-2 w-2 rounded-full bg-gray-700" />
          <View className="h-2 w-8 rounded-full bg-blue-600" />
        </View>
      </View>
    </SafeAreaView>
  );
}
