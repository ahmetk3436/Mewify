import React, { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recommendation } from '../../types/glow-plan';

// Enable layout animation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  onToggleComplete: (id: string, completed: boolean) => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onToggleComplete,
}) => {
  const [expanded, setExpanded] = useState(false);

  const handlePress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const handleCheckboxPress = () => {
    onToggleComplete(recommendation.id, !recommendation.completed);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500';
      case 'medium':
        return 'bg-orange-500';
      case 'hard':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Jawline':
        return '💪';
      case 'Skin':
        return '✨';
      case 'Style':
        return '👔';
      case 'Fitness':
        return '🏃';
      case 'Grooming':
        return '✂️';
      default:
        return '📋';
    }
  };

  return (
    <TouchableOpacity
      className={`bg-white rounded-xl p-4 mx-5 mb-3 shadow-sm border ${
        recommendation.priority ? 'border-blue-500' : 'border-gray-100'
      } ${recommendation.completed ? 'opacity-70' : 'opacity-100'}`}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row flex-1">
          <Text className="text-2xl mr-3">{getCategoryIcon(recommendation.category)}</Text>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              {recommendation.title}
            </Text>
            <View className="flex-row gap-2">
              <View className={`px-2 py-0.5 rounded-full ${getDifficultyColor(recommendation.difficulty)}`}>
                <Text className="text-[10px] font-bold text-white uppercase">
                  {recommendation.difficulty}
                </Text>
              </View>
              {recommendation.priority && (
                <View className="bg-red-500 px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-white">Priority</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        <TouchableOpacity onPress={handleCheckboxPress} hitSlop={10}>
          <Ionicons
            name={recommendation.completed ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={recommendation.completed ? "#2563eb" : "#9ca3af"}
          />
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center mb-2">
        <Text className="text-sm text-gray-500">
          See results in {recommendation.timeframeWeeks} week
          {recommendation.timeframeWeeks !== 1 ? 's' : ''}
        </Text>
      </View>

      {expanded && (
        <View className="mt-2 pt-3 border-t border-gray-100">
          <Text className="text-sm text-gray-700 leading-5">
            {recommendation.description}
          </Text>
        </View>
      )}

      <TouchableOpacity
        className="mt-2 self-start"
        onPress={handlePress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text className="text-sm font-medium text-blue-600">
          {expanded ? 'Show less' : 'Show more'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default RecommendationCard;