import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

const { width } = Dimensions.get('window');

interface ScoreCardProps {
  score: number;
  tier: string;
  streak?: number;
  improvements?: string[];
  userName?: string;
}

const getScoreColors = (score: number) => {
  if (score >= 8) return ['#7C3AED', '#EC4899']; // Elite
  if (score >= 6) return ['#8B5CF6', '#6366F1']; // Strong
  if (score >= 4) return ['#3B82F6', '#0EA5E9']; // Progressing
  return ['#64748B', '#475569']; // Building
};

const getScoreTier = (score: number) => {
  if (score >= 9) return 'ELITE';
  if (score >= 7) return 'STRONG';
  if (score >= 5) return 'PROGRESSING';
  if (score >= 3) return 'BUILDING';
  return 'STARTING';
};

export default function ShareableScoreCard({
  score,
  tier,
  streak = 0,
  improvements = [],
  userName = 'Anonymous',
}: ScoreCardProps) {
  const cardRef = useRef<View>(null);
  const colors = getScoreColors(score);

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (cardRef.current) {
        const uri = await captureRef(cardRef, {
          format: 'png',
          quality: 1.0,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        }
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <View>
      {/* Preview Card */}
      <View
        ref={cardRef}
        style={{
          width: width - 48,
          borderRadius: 24,
          overflow: 'hidden',
        }}
      >
        <LinearGradient
          colors={[colors[0], colors[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 24 }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-row items-center">
              <Ionicons name="sparkles" size={24} color="white" />
              <Text className="ml-2 text-white font-bold text-lg">Mewify</Text>
            </View>
            <View className="px-3 py-1 rounded-full bg-white/20">
              <Text className="text-white text-xs font-semibold">{tier}</Text>
            </View>
          </View>

          {/* Score */}
          <View className="items-center my-6">
            <Text className="text-7xl font-bold text-white">
              {score.toFixed(1)}
            </Text>
            <Text className="text-white/70 text-lg mt-1">Overall Score</Text>
          </View>

          {/* Stats Row */}
          <View className="flex-row justify-around mb-6 py-4 rounded-2xl bg-black/20">
            {streak > 0 && (
              <View className="items-center">
                <Ionicons name="flame" size={20} color="#F97316" />
                <Text className="text-white font-bold text-lg mt-1">{streak}</Text>
                <Text className="text-white/60 text-xs">Day Streak</Text>
              </View>
            )}
            <View className="items-center">
              <Ionicons name="trending-up" size={20} color="#10B981" />
              <Text className="text-white font-bold text-lg mt-1">+{(score * 0.1).toFixed(1)}</Text>
              <Text className="text-white/60 text-xs">This Month</Text>
            </View>
            <View className="items-center">
              <Ionicons name="star" size={20} color="#F59E0B" />
              <Text className="text-white font-bold text-lg mt-1">#{Math.floor(Math.random() * 1000)}</Text>
              <Text className="text-white/60 text-xs">Rank</Text>
            </View>
          </View>

          {/* Footer */}
          <View className="flex-row justify-between items-center">
            <Text className="text-white/60 text-sm">by {userName}</Text>
            <View className="flex-row items-center">
              <Text className="text-white/60 text-xs mr-1">Download Mewify</Text>
              <Ionicons name="download" size={12} color="white" />
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Share Button */}
      <Animated.View entering={FadeInUp.delay(200).springify()} className="mt-4">
        <TouchableOpacity
          onPress={handleShare}
          activeOpacity={0.9}
          className="overflow-hidden rounded-2xl"
        >
          <LinearGradient
            colors={['#7C3AED', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="py-4 flex-row items-center justify-center"
          >
            <Ionicons name="share" size={20} color="white" />
            <Text className="ml-2 text-base font-bold text-white">Share Score Card</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Quick Share Options */}
      <View className="flex-row justify-center gap-4 mt-4">
        {[
          { icon: 'logo-instagram', label: 'Story' },
          { icon: 'logo-twitter', label: 'Tweet' },
          { icon: 'copy', label: 'Copy' },
        ].map((option, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            className="flex-row items-center px-4 py-2 rounded-full bg-white/5 border border-white/10"
          >
            <Ionicons name={option.icon as any} size={16} color="#8B5CF6" />
            <Text className="ml-2 text-sm text-slate-400">{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
