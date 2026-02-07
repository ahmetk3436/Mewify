import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScoreGrid from '../../../components/analysis/ScoreGrid';
import StrengthsCard from '../../../components/analysis/StrengthsCard';
import ImprovementsCard from '../../../components/analysis/ImprovementsCard';
import ShareButton from '../../../components/analysis/ShareButton';
import api from '../../../lib/api';
import { hapticSelection, hapticSuccess } from '../../../lib/haptics';

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
  const [error, setError] = useState<string | null>(null);

  const loadAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/analyses/${id}`);
      const analysis = response.data.data;

      setData({
        id: analysis.id,
        overallScore: analysis.overall_score || 0,
        imageUri: analysis.image_url || '',
        scores: {
          symmetry: analysis.symmetry_score || 0,
          jawline: analysis.jawline_score || 0,
          skin: analysis.skin_score || 0,
          eyes: analysis.eye_score || 0,
          nose: analysis.nose_score || 0,
          lips: analysis.lips_score || 0,
          harmony: analysis.harmony_score || 0,
        },
        strengths: analysis.strengths || [],
        improvements: analysis.improvements || [],
      });
    } catch (err) {
      setError('Failed to load analysis. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, [id]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-950">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-400">Loading analysis...</Text>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-950">
        <Ionicons name="cloud-offline-outline" size={48} color="#ef4444" />
        <Text className="text-red-400 mt-4 text-center px-8">{error}</Text>
        <TouchableOpacity
          onPress={loadAnalysis}
          className="bg-blue-600 px-6 py-3 rounded-xl mt-4"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            hapticSelection();
            router.back();
          }}
          className="mt-4"
        >
          <Text className="text-gray-400">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header with Image */}
        <View className="relative h-80 w-full bg-gray-200">
          {data.imageUri ? (
            <Image
              source={{ uri: data.imageUri }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="h-full w-full items-center justify-center bg-blue-900">
              <Ionicons name="person" size={80} color="#60a5fa" />
            </View>
          )}

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => {
              hapticSelection();
              router.back();
            }}
            className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/30"
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
                {data.overallScore.toFixed(1)}
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
          {data.strengths.length > 0 && (
            <View className="mb-8">
              <View className="mb-4 flex-row items-center">
                <View className="mr-2 h-6 w-1 rounded-full bg-green-500" />
                <Text className="text-xl font-bold text-gray-900">Your Strengths</Text>
              </View>
              <View className="gap-3">
                {data.strengths.map((strength, index) => (
                  <StrengthsCard key={index} text={strength} />
                ))}
              </View>
            </View>
          )}

          {/* Improvements Section */}
          {data.improvements.length > 0 && (
            <View className="mb-8">
              <View className="mb-4 flex-row items-center">
                <View className="mr-2 h-6 w-1 rounded-full bg-amber-500" />
                <Text className="text-xl font-bold text-gray-900">Room to Grow</Text>
              </View>
              <View className="gap-3">
                {data.improvements.map((improvement, index) => (
                  <ImprovementsCard key={index} text={improvement} />
                ))}
              </View>
            </View>
          )}

          {/* Share Section */}
          <View className="mb-8">
            <ShareButton analysisData={data} />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-6 pb-8 pt-4 shadow-lg">
        <TouchableOpacity
          onPress={() => {
            hapticSelection();
            router.push('/(protected)/glow-plan');
          }}
          className="mb-3 items-center rounded-xl bg-blue-600 px-6 py-4 shadow-md"
        >
          <Text className="text-base font-bold text-white">View Your Glow Plan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            hapticSelection();
            router.push('/(protected)/(tabs)');
          }}
          className="flex-row items-center justify-center"
        >
          <Ionicons name="camera-outline" size={20} color="#6b7280" />
          <Text className="ml-2 text-base font-semibold text-gray-600">Scan Again</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
