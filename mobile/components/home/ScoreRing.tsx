import React from 'react';
import { View, Text } from 'react-native';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

const ScoreRing: React.FC<ScoreRingProps> = ({ 
  score, 
  size = 180, 
  strokeWidth = 12 
}) => {
  // Normalize score to 0-10 range
  const normalizedScore = Math.max(0, Math.min(score, 10));
  
  // Determine which segments of the ring to color based on score
  // This creates a stepped progress effect using only CSS borders
  const showTop = normalizedScore > 0;
  const showRight = normalizedScore > 2.5;
  const showBottom = normalizedScore > 5.0;
  const showLeft = normalizedScore > 7.5;

  return (
    <View 
      className="relative items-center justify-center bg-gray-800 rounded-full"
      style={{ 
        width: size, 
        height: size,
        borderWidth: strokeWidth,
        borderColor: '#374151', // gray-700
      }}
    >
      {/* Progress Ring Overlay */}
      <View 
        className="absolute rounded-full border-transparent"
        style={{
          width: size,
          height: size,
          borderWidth: strokeWidth,
          borderTopColor: showTop ? '#8B5CF6' : 'transparent',
          borderRightColor: showRight ? '#8B5CF6' : 'transparent',
          borderBottomColor: showBottom ? '#8B5CF6' : 'transparent',
          borderLeftColor: showLeft ? '#8B5CF6' : 'transparent',
          transform: [{ rotate: '-45deg' }], // Start from top
        }}
      />
      
      {/* Score Text */}
      <View className="items-center justify-center">
        <Text className="text-4xl font-bold text-white">
          {normalizedScore.toFixed(1)}
        </Text>
        <Text className="text-sm text-gray-400">
          Latest Score
        </Text>
      </View>
    </View>
  );
};

export default ScoreRing;