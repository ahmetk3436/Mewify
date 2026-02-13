import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScoreGrid from '../../../components/analysis/ScoreGrid';
import StrengthsCard from '../../../components/analysis/StrengthsCard';
import ImprovementsCard from '../../../components/analysis/ImprovementsCard';
import ShareButton from '../../../components/analysis/ShareButton';
import api from '../../../lib/api';
import { hapticSelection } from '../../../lib/haptics';
import { getGuestAnalysisById } from '../../../lib/guestAnalysisHistory';

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

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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
    const analysisId = id || '';
    try {
      if (analysisId && !isUuid(analysisId)) {
        const local = await getGuestAnalysisById(analysisId);
        if (!local) {
          setError('Guest analysis not found.');
          return;
        }
        setData({
          id: local.id,
          overallScore: local.overall_score || 0,
          imageUri: local.image_url || '',
          scores: {
            symmetry: local.symmetry_score || 0,
            jawline: local.jawline_score || 0,
            skin: local.skin_score || 0,
            eyes: local.eye_score || 0,
            nose: local.nose_score || 0,
            lips: local.lips_score || 0,
            harmony: local.harmony_score || 0,
          },
          strengths: local.strengths || [],
          improvements: local.improvements || [],
        });
        return;
      }

      const response = await api.get(`/analyses/${analysisId}`);
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
    } catch {
      const local = analysisId ? await getGuestAnalysisById(analysisId) : null;
      if (local) {
        setData({
          id: local.id,
          overallScore: local.overall_score || 0,
          imageUri: local.image_url || '',
          scores: {
            symmetry: local.symmetry_score || 0,
            jawline: local.jawline_score || 0,
            skin: local.skin_score || 0,
            eyes: local.eye_score || 0,
            nose: local.nose_score || 0,
            lips: local.lips_score || 0,
            harmony: local.harmony_score || 0,
          },
          strengths: local.strengths || [],
          improvements: local.improvements || [],
        });
      } else {
        setError('Failed to load analysis. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, [id]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#040916]">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-400">Loading your scan...</Text>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#040916] px-8">
        <Ionicons name="cloud-offline-outline" size={48} color="#ef4444" />
        <Text className="mt-4 text-center text-red-400">{error}</Text>
        <TouchableOpacity
          onPress={loadAnalysis}
          className="mt-5 rounded-xl bg-blue-600 px-6 py-3"
        >
          <Text className="font-semibold text-white">Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            hapticSelection();
            router.back();
          }}
          className="mt-4"
        >
          <Text className="text-gray-500">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#040916]" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="relative h-80 w-full overflow-hidden bg-gray-900">
          {data.imageUri ? (
            <Image
              source={{ uri: data.imageUri }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="h-full w-full items-center justify-center bg-[#0b1730]">
              <Ionicons name="person" size={84} color="#60a5fa" />
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(4,9,22,0.95)']}
            className="absolute inset-0"
          />

          <TouchableOpacity
            onPress={() => {
              hapticSelection();
              router.back();
            }}
            className="absolute left-4 top-4 h-10 w-10 items-center justify-center rounded-full bg-black/35"
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>

          <View className="absolute bottom-6 left-5 right-5 flex-row items-end justify-between">
            <View>
              <Text className="text-xs uppercase tracking-widest text-white/70">Overall Score</Text>
              <View className="mt-1 flex-row items-end">
                <Text className="text-5xl font-bold text-white">{data.overallScore.toFixed(1)}</Text>
                <Text className="mb-1 ml-2 text-xl text-white/70">/10</Text>
              </View>
            </View>
            <LinearGradient
              colors={['#1d4ed8', '#6366f1']}
              className="rounded-xl px-3 py-2"
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text className="text-xs font-semibold text-white">AI Face Breakdown</Text>
            </LinearGradient>
          </View>
        </View>

        <View className="-mt-4 rounded-t-3xl bg-[#040916] px-5 pb-24 pt-6">
          <View className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <Text className="mb-3 text-base font-semibold text-white">Highlights</Text>
            <View className="flex-row flex-wrap gap-2">
              <View className="rounded-full bg-blue-500/15 px-3 py-1.5">
                <Text className="text-xs text-blue-300">Confidence + symmetry driven</Text>
              </View>
              <View className="rounded-full bg-indigo-500/15 px-3 py-1.5">
                <Text className="text-xs text-indigo-300">Actionable improvement plan</Text>
              </View>
            </View>
          </View>

          <View className="mb-8">
            <Text className="mb-4 text-xl font-bold text-white">Feature Breakdown</Text>
            <ScoreGrid scores={data.scores} />
          </View>

          {data.strengths.length > 0 && (
            <View className="mb-8">
              <View className="mb-4 flex-row items-center">
                <View className="mr-2 h-6 w-1 rounded-full bg-green-500" />
                <Text className="text-xl font-bold text-white">Your Strengths</Text>
              </View>
              <View className="gap-3">
                {data.strengths.map((strength, index) => (
                  <StrengthsCard key={index} text={strength} />
                ))}
              </View>
            </View>
          )}

          {data.improvements.length > 0 && (
            <View className="mb-8">
              <View className="mb-4 flex-row items-center">
                <View className="mr-2 h-6 w-1 rounded-full bg-amber-500" />
                <Text className="text-xl font-bold text-white">Improvement Targets</Text>
              </View>
              <View className="gap-3">
                {data.improvements.map((improvement, index) => (
                  <ImprovementsCard key={index} text={improvement} />
                ))}
              </View>
            </View>
          )}

          <View className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-4">
            <Text className="mb-3 text-base font-semibold text-white">Share Your Score</Text>
            <ShareButton analysisData={data} />
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#040916] px-5 pb-8 pt-4">
        <TouchableOpacity
          onPress={() => {
            hapticSelection();
            router.push('/(protected)/glow-plan');
          }}
          className="items-center rounded-xl bg-blue-600 px-6 py-4"
        >
          <Text className="text-base font-semibold text-white">Generate Updated Glow Plan</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
