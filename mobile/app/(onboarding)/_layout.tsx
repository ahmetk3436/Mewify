import React from 'react';
import { View } from 'react-native';
import { Slot } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <View className="flex-1 bg-gray-950">
      <Slot />
    </View>
  );
}
