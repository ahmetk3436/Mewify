import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
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
      <Animated.View
        entering={FadeInUp.springify()}
        className="rounded-3xl bg-[#0F172A] p-5 border border-emerald-500/20"
      >
        <View className="flex-row items-center mb-3">
          <View className="w-10 h-10 rounded-full bg-emerald-500/20 items-center justify-center">
            <Ionicons name="checkmark-circle" size={22} color="#10B981" />
          </View>
          <Text className="ml-3 text-lg font-semibold text-white">
            Glow Plan
          </Text>
        </View>
        <View className="flex-row items-center p-3 rounded-xl bg-emerald-500/10">
          <Ionicons name="sparkles" size={18} color="#10B981" />
          <Text className="ml-2 text-emerald-400 font-medium">
            All recommendations completed!
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInUp.springify()}
      className="rounded-3xl bg-[#0F172A] p-5 border border-violet-500/20"
    >
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-violet-500/20 items-center justify-center">
            <Ionicons name="bulb" size={20} color="#8B5CF6" />
          </View>
          <Text className="ml-3 text-lg font-semibold text-white">
            Glow Plan
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => hapticSelection()}
          className="px-3 py-1.5 rounded-full bg-violet-500/20"
        >
          <Text className="text-sm text-violet-400 font-medium">
            View All
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {topRecommendations.map((rec, index) => (
          <Animated.View
            key={rec.id}
            entering={FadeInUp.delay(index * 100).springify()}
            className="flex-row items-start p-4 rounded-2xl bg-slate-900/50 mb-3 border border-slate-800"
          >
            <View className="w-8 h-8 rounded-full bg-amber-500/20 items-center justify-center mr-3">
              <Ionicons
                name={rec.priority >= 8 ? "alert-circle" : "information-circle"}
                size={18}
                color={rec.priority >= 8 ? "#F59E0B" : "#8B5CF6"}
              />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-white mb-1">
                {rec.title}
              </Text>
              <Text className="text-sm text-slate-400 leading-5">
                {rec.description}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#475569" />
          </Animated.View>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

export default GlowPlanPreview;
