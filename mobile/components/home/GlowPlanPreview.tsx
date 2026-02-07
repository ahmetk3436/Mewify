import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticSelection } from '../../lib/haptics';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: number;
}

interface GlowPlanPreviewProps {
  recommendations?: Recommendation[];
}

const GlowPlanPreview: React.FC<GlowPlanPreviewProps> = ({
  recommendations = [],
}) => {
  const topRecommendations = recommendations
    .filter(rec => !rec.completed)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 2);

  if (topRecommendations.length === 0) {
    return (
      <View className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        <Text className="text-lg font-semibold text-white mb-2">
          Your Glow Plan
        </Text>
        <View className="flex-row items-center p-3 bg-green-900/20 rounded-lg">
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text className="ml-2 text-green-300">
            All recommendations completed!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold text-white">
          Your Glow Plan
        </Text>
        <TouchableOpacity onPress={() => hapticSelection()}>
          <Text className="text-sm text-blue-400 font-medium">
            View All
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {topRecommendations.map((rec) => (
          <View
            key={rec.id}
            className="flex-row items-start p-3 bg-gray-800 rounded-lg mb-2"
          >
            <Ionicons name="alert-circle" size={20} color="#F59E0B" style={{ marginTop: 2 }} />
            <View className="ml-3 flex-1">
              <Text className="font-medium text-white">
                {rec.title}
              </Text>
              <Text className="text-sm text-gray-400 mt-1">
                {rec.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default GlowPlanPreview;
