import React, { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recommendation } from '../../types/glow-plan';
import { hapticSelection, hapticSuccess } from '../../lib/haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  onToggleComplete: (id: string, completed: boolean) => void;
}

const difficultyTone: Record<string, { chip: string; text: string }> = {
  easy: { chip: 'bg-emerald-500/20', text: 'text-emerald-300' },
  medium: { chip: 'bg-amber-500/20', text: 'text-amber-300' },
  hard: { chip: 'bg-rose-500/20', text: 'text-rose-300' },
};

const iconByCategory: Record<string, string> = {
  Jawline: 'fitness-outline',
  Skin: 'sparkles-outline',
  Style: 'shirt-outline',
  Fitness: 'barbell-outline',
  Grooming: 'cut-outline',
};

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onToggleComplete,
}) => {
  const [expanded, setExpanded] = useState(false);

  const handlePress = () => {
    hapticSelection();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  const handleCheckboxPress = () => {
    hapticSuccess();
    onToggleComplete(recommendation.id, !recommendation.completed);
  };

  const difficulty = difficultyTone[recommendation.difficulty] || {
    chip: 'bg-gray-500/20',
    text: 'text-gray-300',
  };

  return (
    <TouchableOpacity
      className={`mx-5 mb-3 rounded-2xl border p-4 ${
        recommendation.priority ? 'border-blue-400/40 bg-blue-500/10' : 'border-white/10 bg-white/5'
      } ${recommendation.completed ? 'opacity-75' : 'opacity-100'}`}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View className="mb-3 flex-row items-start justify-between">
        <View className="mr-3 flex-1 flex-row">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <Ionicons
              name={(iconByCategory[recommendation.category] || 'sparkles-outline') as any}
              size={19}
              color="#c4b5fd"
            />
          </View>
          <View className="flex-1">
            <Text className="mb-2 text-base font-semibold text-white">{recommendation.title}</Text>
            <View className="flex-row flex-wrap gap-2">
              <View className={`rounded-full px-2 py-1 ${difficulty.chip}`}>
                <Text className={`text-[10px] font-bold uppercase ${difficulty.text}`}>
                  {recommendation.difficulty}
                </Text>
              </View>
              {recommendation.priority && (
                <View className="rounded-full bg-blue-500/20 px-2 py-1">
                  <Text className="text-[10px] font-bold uppercase text-blue-200">Priority</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={handleCheckboxPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons
            name={recommendation.completed ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={recommendation.completed ? '#60a5fa' : '#6b7280'}
          />
        </TouchableOpacity>
      </View>

      <Text className="text-sm text-gray-400">
        Result window: {recommendation.timeframeWeeks} week{recommendation.timeframeWeeks !== 1 ? 's' : ''}
      </Text>

      {expanded && (
        <View className="mt-3 border-t border-white/10 pt-3">
          <Text className="text-sm leading-6 text-gray-200">{recommendation.description}</Text>
        </View>
      )}

      <TouchableOpacity className="mt-2 self-start" onPress={handlePress}>
        <Text className="text-sm font-medium text-blue-300">{expanded ? 'Show less' : 'Show details'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default RecommendationCard;
