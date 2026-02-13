import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { hapticSuccess, hapticSelection, hapticError } from '../../lib/haptics';

interface ShareableProgressCardProps {
  beforeImage: string | null;
  afterImage: string | null;
  dayCount: number;
  scoreBefore: number;
  scoreAfter: number;
  userName?: string;
}

export default function ShareableProgressCard({
  beforeImage,
  afterImage,
  dayCount,
  scoreBefore,
  scoreAfter,
  userName = 'User',
}: ShareableProgressCardProps) {
  const cardRef = useRef<View>(null);

  const scoreDiff = scoreAfter - scoreBefore;
  const isPositive = scoreDiff >= 0;

  const captureAndShare = useCallback(async () => {
    hapticSelection();

    try {
      // Capture the card
      if (cardRef.current) {
        const uri = await captureRef(cardRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });

        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share Your Progress',
          });
        } else {
          // Fallback to basic Share API
          await Share.share({
            message: `Check out my ${dayCount}-day Mewify glow up! ${isPositive ? '+' : ''}${scoreDiff.toFixed(1)} score improvement! 💪`,
          });
        }

        hapticSuccess();
      }
    } catch (err) {
      console.error('Share error:', err);
      hapticError();
      Alert.alert('Error', 'Failed to share the image. Please try again.');
    }
  }, [dayCount, scoreDiff, isPositive]);

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#10B981';
    if (score >= 6) return '#8B5CF6';
    return '#F59E0B';
  };

  return (
    <Animated.View entering={FadeInUp.springify()} className="mb-4">
      {/* The shareable card */}
      <View
        ref={cardRef}
        className="bg-[#0A0A0F] rounded-3xl overflow-hidden border border-violet-500/20"
        collapsable={false}
      >
        {/* Header with gradient */}
        <LinearGradient
          colors={['#7C3AED', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View className="px-5 py-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="fitness" size={20} color="white" />
              <Text className="text-white font-bold ml-2">MEWIFY</Text>
            </View>
            <View className="px-3 py-1 rounded-full bg-black/20">
              <Text className="text-white text-sm font-medium">Day {dayCount}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Before/After comparison */}
        <View className="flex-row">
          {/* Before */}
          <View className="flex-1 p-4 items-center border-r border-slate-800">
            <Text className="text-slate-500 text-xs uppercase tracking-wide mb-2">Before</Text>
            <View
              className="w-24 h-24 rounded-2xl bg-slate-800 items-center justify-center overflow-hidden mb-2"
            >
              {beforeImage ? (
                <View className="w-full h-full bg-slate-700" /> // Image would go here
              ) : (
                <Ionicons name="person" size={32} color="#475569" />
              )}
            </View>
            <Text
              className="text-2xl font-bold"
              style={{ color: getScoreColor(scoreBefore) }}
            >
              {scoreBefore.toFixed(1)}
            </Text>
          </View>

          {/* Arrow */}
          <View className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <View className="w-10 h-10 rounded-full bg-violet-600 items-center justify-center">
              <Ionicons name="arrow-forward" size={18} color="white" />
            </View>
          </View>

          {/* After */}
          <View className="flex-1 p-4 items-center">
            <Text className="text-slate-500 text-xs uppercase tracking-wide mb-2">After</Text>
            <View
              className="w-24 h-24 rounded-2xl bg-slate-800 items-center justify-center overflow-hidden mb-2"
            >
              {afterImage ? (
                <View className="w-full h-full bg-slate-700" /> // Image would go here
              ) : (
                <Ionicons name="person" size={32} color="#475569" />
              )}
            </View>
            <Text
              className="text-2xl font-bold"
              style={{ color: getScoreColor(scoreAfter) }}
            >
              {scoreAfter.toFixed(1)}
            </Text>
          </View>
        </View>

        {/* Score change */}
        <View className="px-5 py-4 border-t border-slate-800">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-slate-500 text-xs">Score Change</Text>
              <View className="flex-row items-center mt-1">
                <Ionicons
                  name={isPositive ? 'trending-up' : 'trending-down'}
                  size={20}
                  color={isPositive ? '#10B981' : '#EF4444'}
                />
                <Text
                  className={`text-2xl font-bold ml-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  {isPositive ? '+' : ''}{scoreDiff.toFixed(1)}
                </Text>
              </View>
            </View>
            <View className="px-4 py-2 rounded-xl bg-violet-500/20">
              <Text className="text-violet-400 text-sm font-medium">
                {userName}'s Glow Up ✨
              </Text>
            </View>
          </View>
        </View>

        {/* Watermark */}
        <View className="px-5 py-3 bg-slate-900/50 flex-row items-center justify-center">
          <Ionicons name="download" size={12} color="#6B7280" />
          <Text className="text-slate-600 text-xs ml-1">Tracked by Mewify</Text>
        </View>
      </View>

      {/* Share button */}
      <TouchableOpacity
        onPress={captureAndShare}
        className="mt-3 flex-row items-center justify-center py-3 rounded-2xl bg-violet-600"
      >
        <Ionicons name="share-social" size={18} color="white" />
        <Text className="text-white font-medium ml-2">Share My Progress</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
