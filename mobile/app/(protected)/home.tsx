import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { hapticSelection, hapticSuccess, hapticError } from '../../lib/haptics';

export default function HomeScreen() {
  const { user, isGuest, guestUsageCount, canUseFeature, incrementGuestUsage } = useAuth();
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);

  const handleScanFace = useCallback(async () => {
    hapticSelection();

    if (!canUseFeature()) {
      Alert.alert(
        'Scan Limit Reached',
        'Create a free account to continue scanning, or upgrade to Premium for unlimited scans.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Up', onPress: () => router.push('/(auth)/register') },
        ]
      );
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed to scan your face.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsScanning(true);
        if (isGuest) {
          await incrementGuestUsage();
        }
        hapticSuccess();
        // In production: upload image, navigate to analysis
        setIsScanning(false);
        Alert.alert('Scan Complete', 'Your face analysis is ready!');
      }
    } catch (err) {
      hapticError();
      setIsScanning(false);
      Alert.alert('Error', 'Failed to scan. Please try again.');
    }
  }, [canUseFeature, isGuest, incrementGuestUsage]);

  const remainingScans = isGuest ? 3 - guestUsageCount : null;

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-4">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-white">
              {isGuest ? 'Welcome' : `Hey, ${user?.email?.split('@')[0]}`}
            </Text>
            <Text className="mt-1 text-base text-gray-400">
              Ready for your glow-up?
            </Text>
          </View>

          {/* Guest Banner */}
          {isGuest && (
            <Pressable
              className="mb-6 rounded-2xl bg-blue-900/30 border border-blue-800 p-4"
              onPress={() => {
                hapticSelection();
                router.push('/(auth)/register');
              }}
            >
              <View className="flex-row items-center">
                <Ionicons name="person-add" size={20} color="#60a5fa" />
                <Text className="ml-2 flex-1 font-semibold text-blue-300">
                  Create a free account
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#60a5fa" />
              </View>
              <Text className="mt-1 text-sm text-blue-400">
                {remainingScans} free scans remaining
              </Text>
            </Pressable>
          )}

          {/* Scan Button */}
          <Pressable
            className="mb-6 items-center rounded-3xl bg-blue-600 py-16"
            onPress={handleScanFace}
            disabled={isScanning}
            style={{ opacity: isScanning ? 0.7 : 1 }}
          >
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-white/20">
              <Ionicons
                name={isScanning ? 'hourglass' : 'camera'}
                size={36}
                color="#ffffff"
              />
            </View>
            <Text className="text-xl font-bold text-white">
              {isScanning ? 'Analyzing...' : 'Scan Your Face'}
            </Text>
            <Text className="mt-2 text-sm text-blue-200">
              Get your AI-powered glow score
            </Text>
          </Pressable>

          {/* Quick Stats */}
          <View className="mb-6 flex-row gap-3">
            <Pressable
              className="flex-1 rounded-2xl bg-gray-900 border border-gray-800 p-4"
              onPress={() => {
                hapticSelection();
                router.push('/(protected)/mewing');
              }}
            >
              <Ionicons name="fitness" size={24} color="#3b82f6" />
              <Text className="mt-2 text-lg font-bold text-white">Mewing</Text>
              <Text className="mt-1 text-xs text-gray-400">Track your progress</Text>
            </Pressable>

            <Pressable
              className="flex-1 rounded-2xl bg-gray-900 border border-gray-800 p-4"
              onPress={() => {
                hapticSelection();
                router.push('/(protected)/glow-plan');
              }}
            >
              <Ionicons name="sparkles" size={24} color="#a855f7" />
              <Text className="mt-2 text-lg font-bold text-white">Glow Plan</Text>
              <Text className="mt-1 text-xs text-gray-400">Your recommendations</Text>
            </Pressable>
          </View>

          {/* Features */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-white">What Mewify Can Do</Text>

            {[
              { icon: 'camera', color: '#3b82f6', title: 'AI Face Analysis', desc: 'Get a detailed breakdown of your facial features' },
              { icon: 'fitness', color: '#10b981', title: 'Mewing Tracker', desc: 'Build daily habits with streak tracking' },
              { icon: 'sparkles', color: '#a855f7', title: 'Glow Plan', desc: 'AI-personalized improvement recommendations' },
              { icon: 'images', color: '#f59e0b', title: 'Progress Photos', desc: 'Compare your results over time' },
            ].map((item) => (
              <View
                key={item.title}
                className="mb-3 flex-row items-center rounded-xl bg-gray-900 border border-gray-800 p-4"
              >
                <View
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: item.color + '20' }}
                >
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-semibold text-white">{item.title}</Text>
                  <Text className="mt-0.5 text-xs text-gray-400">{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
