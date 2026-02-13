import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { hapticSelection } from '../../lib/haptics';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#040916]">
      <LinearGradient colors={['#040916', '#0a1630', '#121a3f']} style={{ flex: 1 }}>
        <View className="absolute left-[-70] top-[-40] h-60 w-60 rounded-full bg-blue-500/20" />
        <View className="absolute right-[-90] top-40 h-72 w-72 rounded-full bg-indigo-500/15" />

        <View className="flex-1 items-center justify-center px-8">
          <LinearGradient
            colors={['#2563eb', '#4f46e5']}
            className="mb-6 h-24 w-24 items-center justify-center rounded-3xl"
          >
            <Ionicons name="sparkles" size={48} color="#ffffff" />
          </LinearGradient>

          <Text className="text-center text-3xl font-bold text-white">
            Welcome to Mewify
          </Text>
          <Text className="mt-3 text-center text-lg text-gray-300">
            Your AI-powered glow-up companion
          </Text>

          <View className="mt-8 flex-row flex-wrap justify-center gap-3">
            <View className="rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2">
              <Text className="text-sm font-medium text-blue-200">AI Face Analysis</Text>
            </View>
            <View className="rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2">
              <Text className="text-sm font-medium text-purple-200">Mewing Tracker</Text>
            </View>
            <View className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2">
              <Text className="text-sm font-medium text-emerald-200">Glow Plan</Text>
            </View>
          </View>
        </View>

        <View className="px-8 pb-8">
          <Pressable
            onPress={() => {
              hapticSelection();
              router.push('/(onboarding)/features');
            }}
          >
            <LinearGradient
              colors={['#2563eb', '#4f46e5']}
              className="items-center rounded-2xl py-4"
            >
              <Text className="text-lg font-semibold text-white">Get Started</Text>
            </LinearGradient>
          </Pressable>

          <View className="mt-6 flex-row justify-center gap-2">
            <View className="h-2 w-8 rounded-full bg-blue-500" />
            <View className="h-2 w-2 rounded-full bg-gray-700" />
            <View className="h-2 w-2 rounded-full bg-gray-700" />
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
