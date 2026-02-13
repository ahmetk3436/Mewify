import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';

interface ReferralCardProps {
  referralCode: string;
  reward?: string;
}

export default function ReferralCard({ referralCode, reward = '1 Week Premium' }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const shareMessage = `Check out Mewify - AI face analysis app! Use my code ${referralCode} for ${reward}. Download: https://mewify.app`;

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(shareMessage);
    }
  };

  return (
    <Animated.View
      entering={FadeInUp.springify()}
      className="rounded-3xl overflow-hidden"
    >
      <LinearGradient
        colors={['#1E1B4B', '#312E81']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-5"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-pink-500/20 items-center justify-center">
              <Ionicons name="people" size={20} color="#EC4899" />
            </View>
            <View className="ml-3">
              <Text className="text-base font-semibold text-white">Invite Friends</Text>
              <Text className="text-xs text-violet-300">Both get {reward}</Text>
            </View>
          </View>
        </View>

        {/* Referral Code */}
        <View className="flex-row items-center mb-4">
          <View className="flex-1 flex-row items-center justify-center py-3 rounded-xl bg-black/30 border border-violet-500/30">
            <Text className="text-lg font-bold text-white tracking-widest">
              {referralCode}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleCopy}
            className="ml-3 px-4 py-3 rounded-xl bg-violet-500/30"
          >
            <Ionicons
              name={copied ? 'checkmark' : 'copy'}
              size={20}
              color={copied ? '#10B981' : '#A78BFA'}
            />
          </TouchableOpacity>
        </View>

        {/* Share Button */}
        <TouchableOpacity
          onPress={handleShare}
          activeOpacity={0.9}
          className="overflow-hidden rounded-xl"
        >
          <LinearGradient
            colors={['#7C3AED', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="py-3 flex-row items-center justify-center"
          >
            <Ionicons name="share-social" size={18} color="white" />
            <Text className="ml-2 text-sm font-semibold text-white">
              Share Invite Link
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Stats */}
        <View className="flex-row justify-around mt-4 pt-4 border-t border-violet-500/20">
          <View className="items-center">
            <Text className="text-xl font-bold text-white">0</Text>
            <Text className="text-xs text-slate-400">Invited</Text>
          </View>
          <View className="items-center">
            <Text className="text-xl font-bold text-white">0</Text>
            <Text className="text-xs text-slate-400">Claimed</Text>
          </View>
          <View className="items-center">
            <Text className="text-xl font-bold text-emerald-400">0 wks</Text>
            <Text className="text-xs text-slate-400">Earned</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}
