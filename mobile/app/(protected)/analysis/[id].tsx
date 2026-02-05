import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScoreGrid from '../../../components/analysis/ScoreGrid';
import StrengthsCard from '../../../components/analysis/StrengthsCard';
import ImprovementsCard from '../../../components/analysis/ImprovementsCard';
import ShareButton from '../../../components/analysis/ShareButton';

// Mock Data Interface
interface AnalysisData {
  id: string;
  overallScore: number;
  imageUri: string;
  scores: {
    symmetry: number;
    jawline: number;
    skin: number;
    eyes: number;
    nose: number;
    lips: number;
    harmony: number;
  };
  strengths: string[];
  improvements: string[];
}

export default function AnalysisScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AnalysisData | null>(null);

  // Mock Data Fetching Simulation
  React.useEffect(() => {
    // Simulate API call delay
    const timer = setTimeout(() => {
      setData({
        id: id || '1',
        overallScore: 8.4,
        imageUri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        scores: {
          symmetry: 9,
          jawline: 7,
          skin: 8,
          eyes: 9,
          nose: 8,
          lips: 7,
          harmony: 9,
        },
        strengths: [
          'Excellent facial symmetry and balance',
          'Bright, clear eye area with good spacing',
          'Strong jawline definition',
        ],
        improvements: [
          'Hydration boost for skin texture',
          'Contouring to enhance cheekbones',
          'Lip volume enhancement',
        ],
      });
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [id]);

  if (isLoading || !data) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-4 text-gray-500">Analyzing features...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="relative h-80 w-full bg-gray-200">
          <Image
            source={{ uri: data.imageUri }}
            className="h-full w-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
          
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          {/* Overall Score Overlay */}
          <View className="absolute bottom-6 left-6">
            <Text className="text-sm font-medium text-white/90 uppercase tracking-wider">
              Overall Score
            </Text>
            <View className="mt-1 flex-row items-baseline">
              <Text className="text-6xl font-bold text-white">
                {data.overallScore}
              </Text>
              <Text className="ml-2 text-2xl font-medium text-white/80">/10</Text>
            </View>
          </View>
        </View>

        {/* Content Container */}
        <View className="-mt-4 rounded-t-3xl bg-gray-50 px-6 pb-24 pt-8">
          
          {/* Score Grid Section */}
          <View className="mb-8">
            <Text className="mb-4 text-xl font-bold text-gray-900">
              Feature Breakdown
            </Text>
            <ScoreGrid scores={data.scores} />
          </View>

          {/* Strengths Section */}
          <View className="mb-8">
            <View className="mb-4 flex-row items-center">
              <View className="mr-2 h-6 w-1 rounded-full bg-green-500" />
              <Text className="text-xl font-bold text-gray-900">Your Strengths</Text>
            </View>
            <View className="space-y-3">
              {data.strengths.map((strength, index) => (
                <StrengthsCard key={index} text={strength} />
              ))}
            </View>
          </View>

          {/* Improvements Section */}
          <View className="mb-8">
            <View className="mb-4 flex-row items-center">
              <View className="mr-2 h-6 w-1 rounded-full bg-amber-500" />
              <Text className="text-xl font-bold text-gray-900">Room to Grow</Text>
            </View>
            <View className="space-y-3">
              {data.improvements.map((improvement, index) => (
                <ImprovementsCard key={index} text={improvement} />
              ))}
            </View>
          </View>

          {/* Share Section */}
          <View className="mb-8">
            <ShareButton analysisData={data} />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-6 pb-8 pt-4 shadow-lg">
        <TouchableOpacity
          onPress={() => router.push('/(protected)/plan')} // Assuming plan route exists or will be created
          className="mb-3 items-center rounded-xl bg-blue-600 px-6 py-4 shadow-md active:bg-blue-700"
        >
          <Text className="text-base font-bold text-white">View Your Glow Plan</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => router.push('/(protected)/scan')}
          className="flex-row items-center justify-center"
        >
          <Ionicons name="camera-outline" size={20} color="#6b7280" />
          <Text className="ml-2 text-base font-semibold text-gray-600">Scan Again</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}