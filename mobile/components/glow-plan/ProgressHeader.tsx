import React from 'react';
import { View, Text } from 'react-native';
import { ProgressStats } from '../../types/glow-plan';

interface ProgressHeaderProps {
  progress: ProgressStats;
}

const ProgressHeader: React.FC<ProgressHeaderProps> = ({ progress }) => {
  return (
    <View className="px-5 pt-5 pb-4">
      <Text className="text-2xl font-bold text-gray-900">Your Glow Plan</Text>
      <Text className="text-base text-gray-500 mt-1">
        {progress.completed} of {progress.total} completed
      </Text>
    </View>
  );
};

export default ProgressHeader;
