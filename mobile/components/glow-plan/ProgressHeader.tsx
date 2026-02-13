import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProgressStats } from '../../types/glow-plan';

interface ProgressHeaderProps {
  progress: ProgressStats;
}

const ProgressHeader: React.FC<ProgressHeaderProps> = ({ progress }) => {
  const completionRate = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <View className="px-5 pt-5 pb-4">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-white">Glow Plan</Text>
          <Text className="mt-1 text-sm text-gray-400">
            {progress.completed} of {progress.total} habits completed
          </Text>
        </View>
        <LinearGradient
          colors={['#2563eb', '#4f46e5']}
          className="rounded-full px-3 py-2"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text className="text-xs font-semibold text-white">{completionRate}%</Text>
        </LinearGradient>
      </View>

      <View className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
        <LinearGradient
          colors={['#3b82f6', '#6366f1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: `${completionRate}%`, height: '100%' }}
        />
      </View>
    </View>
  );
};

export default ProgressHeader;
