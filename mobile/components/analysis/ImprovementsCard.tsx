import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ImprovementsCardProps {
  text: string;
}

export default function ImprovementsCard({ text }: ImprovementsCardProps) {
  return (
    <View className="flex-row items-start rounded-xl bg-amber-50 p-4 border border-amber-100">
      <View className="mt-0.5 mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-amber-100">
        <Ionicons name="trending-up" size={14} color="#d97706" />
      </View>
      <Text className="flex-1 text-base font-medium text-amber-900 leading-snug">
        {text}
      </Text>
    </View>
  );
}