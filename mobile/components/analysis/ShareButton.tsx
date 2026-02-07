import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { hapticSuccess, hapticSelection } from '../../lib/haptics';
import { cn } from '../../lib/cn';

interface ShareButtonProps {
  analysisData: {
    overallScore: number;
    strengths: string[];
  };
  imageUri?: string;
}

export default function ShareButton({ analysisData, imageUri }: ShareButtonProps) {
  const [isShared, setIsShared] = useState(false);

  const handleShare = async () => {
    hapticSelection();

    const shareText = `I just scanned my face on Mewify!\n\nMy Glow Score: ${analysisData.overallScore}/10\n\nTop Strengths:\n${analysisData.strengths.map((s) => `- ${s}`).join('\n')}\n\nGet your analysis at mewify.app`;

    try {
      const result = await Share.share({
        message: shareText,
        title: 'My Mewify Score',
      });

      if (result.action !== Share.dismissedAction) {
        hapticSuccess();
        setIsShared(true);
        setTimeout(() => {
          setIsShared(false);
        }, 2000);
      }
    } catch (error) {
      // Fallback to clipboard if Share fails
      try {
        await Clipboard.setStringAsync(shareText);
        hapticSuccess();
        setIsShared(true);
        setTimeout(() => {
          setIsShared(false);
        }, 2000);
      } catch (clipboardError) {
        // Silently fail
      }
    }
  };

  return (
    <TouchableOpacity
      onPress={handleShare}
      className={cn(
        'flex-row items-center justify-center rounded-xl border-2 border-gray-200 bg-white px-6 py-4',
        isShared && 'border-green-500 bg-green-50'
      )}
    >
      {isShared ? (
        <>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text className="ml-2 font-semibold text-green-600">Shared!</Text>
        </>
      ) : (
        <>
          <Ionicons name="share-outline" size={20} color="#4b5563" />
          <Text className="ml-2 font-semibold text-gray-700">Share My Score</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
