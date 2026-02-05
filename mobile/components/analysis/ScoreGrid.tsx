import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ScoreGridProps {
  scores: {
    symmetry: number;
    jawline: number;
    skin: number;
    eyes: number;
    nose: number;
    lips: number;
    harmony: number;
  };
}

interface ScoreItemProps {
  icon: string;
  label: string;
  score: number;
  index: number;
}

function ScoreItem({ icon, label, score, index }: ScoreItemProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const delay = index * 100;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 5) return 'text-blue-600';
    return 'text-amber-600';
  };

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
      }}
      className="flex-1 flex-col items-center justify-center rounded-2xl bg-gray-50 p-4 border border-gray-100 m-1 min-h-[100px]"
    >
      <Ionicons name={icon as any} size={24} color="#9ca3af" />
      <Text className="mt-2 text-sm font-medium text-gray-600">{label}</Text>
      <Text className={`mt-1 text-2xl font-bold ${getScoreColor(score)}`}>
        {score}
      </Text>
    </Animated.View>
  );
}

export default function ScoreGrid({ scores }: ScoreGridProps) {
  const data = [
    { key: 'symmetry', icon: 'git-compare-outline', label: 'Symmetry', score: scores.symmetry },
    { key: 'jawline', icon: 'person-outline', label: 'Jawline', score: scores.jawline },
    { key: 'skin', icon: 'sparkles-outline', label: 'Skin', score: scores.skin },
    { key: 'eyes', icon: 'eye-outline', label: 'Eyes', score: scores.eyes },
    { key: 'nose', icon: 'scan-outline', label: 'Nose', score: scores.nose },
    { key: 'lips', icon: 'happy-outline', label: 'Lips', score: scores.lips },
    { key: 'harmony', icon: 'musical-notes-outline', label: 'Harmony', score: scores.harmony },
  ];

  return (
    <View className="flex-row flex-wrap justify-between">
      {data.map((item, index) => (
        <ScoreItem
          key={item.key}
          icon={item.icon}
          label={item.label}
          score={item.score}
          index={index}
        />
      ))}
    </View>
  );
}