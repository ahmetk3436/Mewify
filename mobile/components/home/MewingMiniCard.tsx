import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticSelection } from '../../lib/haptics';

interface MewingMiniCardProps {
  minutesToday: number;
  dailyGoal: number;
  streak: number;
}

const MewingMiniCard: React.FC<MewingMiniCardProps> = ({
  minutesToday = 0,
  dailyGoal = 60,
  streak = 0,
}) => {
  const progress = dailyGoal > 0 ? (minutesToday / dailyGoal) * 100 : 0;

  return (
    <View className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-semibold text-white">
          Today's Mewing
        </Text>
        <Ionicons name="time-outline" size={20} color="#6B7280" />
      </View>

      <View className="mb-4">
        <View className="flex-row justify-between mb-1">
          <Text className="text-sm text-gray-400">
            {minutesToday} / {dailyGoal} min
          </Text>
          <Text className="text-sm font-medium text-blue-400">
            {progress.toFixed(0)}%
          </Text>
        </View>
        <View className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <View
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </View>
      </View>

      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <Ionicons name="trending-up-outline" size={16} color="#10B981" />
          <Text className="ml-2 text-sm text-gray-400">
            {streak} day streak
          </Text>
        </View>
        <TouchableOpacity
          className="px-3 py-1 bg-blue-900/30 rounded-full"
          onPress={() => hapticSelection()}
        >
          <Text className="text-sm font-medium text-blue-400">
            Log Session
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MewingMiniCard;
