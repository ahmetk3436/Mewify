import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { hapticSuccess } from '../../lib/haptics';
import { cn } from '../../lib/cn';

interface ShareButtonProps {
  analysisData: {
    overallScore: number;
    strengths: string[];
  };
}

export default function ShareButton({ analysisData }: ShareButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleShare = async () => {
    const shareText = `I just scanned my face on Mewify! 🧚‍♀️\n\nMy Glow Score: ${analysisData.overallScore}/10\n\nTop Strengths:\n${analysisData.strengths.map((s) => `✨ ${s}`).join('\n')}\n\nGet your analysis now!`;

    try {
      await Clipboard.setStringAsync(shareText);
      hapticSuccess();
      setIsCopied(true);
      
      // Reset after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard', error);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleShare}
      className={cn(
        'flex-row items-center justify-center rounded-xl border-2 border-gray-200 bg-white px-6 py-4 transition-all active:scale-95',
        isCopied && 'border-green-500 bg-green-50'
      )}
    >
      {isCopied ? (
        <>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text className="ml-2 font-semibold text-green-600">Copied!</Text>
        </>
      ) : (
        <>
          <Ionicons name="share-social-outline" size={20} color="#4b5563" />
          <Text className="ml-2 font-semibold text-gray-700">Share Results</Text>
        </>
      )}
    </TouchableOpacity>
  );
}