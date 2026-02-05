import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StrengthsCardProps {
  text: string;
}

export default function StrengthsCard({ text }: StrengthsCardProps) {
  return (
    <View className="flex-row items-start rounded-xl bg-green-50 p-4 border border-green-100">
      <View className="mt-0.5 mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
        <Ionicons name="checkmark" size={14} color="#059669" />
      </View>
      <Text className="flex-1 text-base font-medium text-green-900 leading-snug">
        {text}
      </Text>
    </View>
  );
}