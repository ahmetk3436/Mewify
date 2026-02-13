import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';

const ONBOARDING_KEY = '@mewify_onboarding_complete_v3';

export default function Index() {
  const { isAuthenticated, isLoading, isGuest, continueAsGuest } = useAuth();
  const [startingGuest, setStartingGuest] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  // Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        console.log('Onboarding value:', value);
        setHasSeenOnboarding(value === 'true');
      } catch (e) {
        console.log('Onboarding check error:', e);
        setHasSeenOnboarding(false);
      } finally {
        setCheckingOnboarding(false);
      }
    };
    checkOnboarding();
  }, []);

  // Auto-start as guest after onboarding
  useEffect(() => {
    const startAsGuest = async () => {
      if (!checkingOnboarding && hasSeenOnboarding === true && !isLoading && !isAuthenticated && !isGuest) {
        setStartingGuest(true);
        try {
          await continueAsGuest();
        } catch (e) {
          console.error('Failed to start as guest:', e);
        }
        setStartingGuest(false);
      }
    };
    startAsGuest();
  }, [checkingOnboarding, hasSeenOnboarding, isLoading, isAuthenticated, isGuest, continueAsGuest]);

  // Loading states
  if (isLoading || checkingOnboarding || startingGuest) {
    return (
      <View className="flex-1 items-center justify-center bg-[#000000]">
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  // First-time users → Onboarding
  if (hasSeenOnboarding === false) {
    return <Redirect href="/(onboarding)/welcome-new" />;
  }

  // Returning users → Home
  if (hasSeenOnboarding === true && (isAuthenticated || isGuest)) {
    return <Redirect href="/(protected)/(tabs)" />;
  }

  // Default: show onboarding
  return <Redirect href="/(onboarding)/welcome-new" />;
}
