import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MewingMiniCardProps {
  minutesToday: number;
  dailyGoal: number;
  streak: number;
}

const MewingMiniCard: React.FC<MewingMiniCardProps> = ({
  minutesToday = 45,
  dailyGoal = 60,
  streak = 7,
}) => {
  const progress = (minutesToday / dailyGoal) * 100;
  
  return (
    <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-semibold text-gray-900 dark:text-white">
          Today's Mewing
        </Text>
        <Ionicons name="time-outline" size={20} color="#6B7280" />
      </View>
      
      <View className="mb-4">
        <View className="flex-row justify-between mb-1">
          <Text className="text-sm text-gray-600 dark:text-gray-300">
            {minutesToday} / {dailyGoal} min
          </Text>
          <Text className="text-sm font-medium text-purple-600 dark:text-purple-400">
            {progress.toFixed(0)}%
          </Text>
        </View>
        <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <View 
            className="h-full bg-purple-500 rounded-full"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </View>
      </View>
      
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <Ionicons name="trending-up-outline" size={16} color="#10B981" />
          <Text className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            {streak} day streak
          </Text>
        </View>
        <TouchableOpacity className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
          <Text className="text-sm font-medium text-purple-700 dark:text-purple-300">
            Log Session
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MewingMiniCard;