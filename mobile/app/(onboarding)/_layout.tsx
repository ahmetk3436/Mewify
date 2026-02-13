import React from 'react';
import { View } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function OnboardingLayout() {
  return (
    <View className="flex-1 bg-[#000000]">
      <StatusBar style="light" />
      <Slot />
    </View>
  );
}
