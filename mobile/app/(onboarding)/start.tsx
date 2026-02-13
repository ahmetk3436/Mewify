import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { hapticSelection } from '../../lib/haptics';
import { useAuth } from '../../contexts/AuthContext';

export default function StartScreen() {
  const router = useRouter();
  const { continueAsGuest } = useAuth();

  const completeOnboarding = async () => {
    await SecureStore.setItemAsync('onboarding_complete', 'true');
  };

  const handleTryFree = async () => {
    hapticSelection();
    await completeOnboarding();
    await continueAsGuest();
    router.replace('/(protected)/(tabs)');
  };

  const handleSignIn = async () => {
    hapticSelection();
    await completeOnboarding();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#040916]">
      <LinearGradient colors={['#040916', '#0a1630', '#121a3f']} style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-8 h-32 w-32 items-center justify-center rounded-full border-2 border-blue-500 bg-blue-500/15">
            <Ionicons name="rocket" size={56} color="#60a5fa" />
          </View>

          <Text className="text-center text-3xl font-bold text-white">
            Ready to glow up?
          </Text>
          <Text className="mt-3 text-center text-base text-gray-300">
            Start your transformation today with AI-powered face analysis and personalized plans
          </Text>

          <View className="mt-8 w-full">
            {[
              'AI-powered face analysis',
              'Personalized glow-up plan',
              'Daily mewing tracker with streaks',
            ].map((benefit) => (
              <View key={benefit} className="mb-3 flex-row items-center">
                <Ionicons name="checkmark-circle" size={20} color="#60a5fa" />
                <Text className="ml-3 text-base text-gray-200">{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="px-8 pb-8">
          <Pressable onPress={handleTryFree}>
            <LinearGradient
              colors={['#2563eb', '#4f46e5']}
              className="items-center rounded-2xl py-4 mb-4"
            >
              <Text className="text-lg font-semibold text-white">
                Try Free - 3 Guest Scans
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            className="items-center py-3"
            onPress={handleSignIn}
          >
            <Text className="text-base font-medium text-blue-300">Sign In</Text>
          </Pressable>

          <View className="mt-4 flex-row justify-center gap-2">
            <View className="h-2 w-2 rounded-full bg-gray-700" />
            <View className="h-2 w-2 rounded-full bg-gray-700" />
            <View className="h-2 w-8 rounded-full bg-blue-500" />
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
