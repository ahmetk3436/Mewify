import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading, isGuest } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await SecureStore.getItemAsync('onboarding_complete');
        setOnboardingComplete(value === 'true');
      } catch {
        setOnboardingComplete(false);
      }
    };
    checkOnboarding();
  }, []);

  if (isLoading || onboardingComplete === null) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-950">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Show onboarding if not completed
  if (!onboardingComplete) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  // Authenticated or guest -> protected area
  if (isAuthenticated || isGuest) {
    return <Redirect href="/(protected)/(tabs)" />;
  }

  // Not authenticated -> login
  return <Redirect href="/(auth)/login" />;
}
