import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Modal, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { hapticSelection } from '../../lib/haptics';
import api from '../../lib/api';

const { width } = Dimensions.get('window');

interface Analysis {
  id: string;
  image_url: string;
  overall_score: number;
  analyzed_at: string;
}

interface CompareState {
  first: Analysis | null;
  second: Analysis | null;
}

// Simple View-based bar chart component
const ScoreTrendChart = ({ data }: { data: { score: number; date: string }[] }) => {
  if (data.length === 0) {
    return (
      <View className="h-32 items-center justify-center">
        <Text className="text-gray-400">No data yet</Text>
      </View>
    );
  }

  const maxScore = 10;
  const chartWidth = width - 80;
  const chartHeight = 100;

  return (
    <View className="h-32 px-2">
      <View className="flex-row items-end h-24 border-l border-b border-gray-200">
        {data.slice(-7).map((item, index, arr) => {
          const barHeight = (item.score / maxScore) * chartHeight;
          const barWidth = chartWidth / Math.max(arr.length, 1);

          return (
            <View key={index} className="items-center" style={{ width: barWidth }}>
              <View
                className="bg-blue-500 rounded-t"
                style={{ height: barHeight, width: 20 }}
              />
              <Text className="text-xs text-gray-500 mt-1">
                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const getScoreColor = (score: number) => {
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-blue-600';
  return 'text-amber-600';
};

export default function ProgressScreen() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [scoreHistory, setScoreHistory] = useState<{ score: number; date: string }[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [compare, setCompare] = useState<CompareState>({ first: null, second: null });
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      setError(null);
      const response = await api.get('/analyses?limit=50');
      if (response.data.data?.analyses) {
        const analysesData = response.data.data.analyses;
        setAnalyses(analysesData);

        // Build score history
        const history = analysesData.map((a: Analysis) => ({
          score: a.overall_score,
          date: a.analyzed_at,
        })).reverse();
        setScoreHistory(history);
      }
    } catch (err) {
      setError('Failed to load your progress. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAnalyses();
    setIsRefreshing(false);
  };

  const toggleCompareMode = () => {
    hapticSelection();
    if (compareMode) {
      setCompare({ first: null, second: null });
    }
    setCompareMode(!compareMode);
  };

  const handleSelectForCompare = (analysis: Analysis) => {
    hapticSelection();

    if (!compare.first) {
      setCompare({ ...compare, first: analysis });
    } else if (!compare.second && compare.first.id !== analysis.id) {
      setCompare({ ...compare, second: analysis });
      setShowCompareModal(true);
    }
  };

  const handlePhotoPress = (analysis: Analysis) => {
    hapticSelection();
    if (compareMode) {
      handleSelectForCompare(analysis);
    } else {
      router.push(`/(protected)/analysis/${analysis.id}`);
    }
  };

  const isSelected = (analysis: Analysis) => {
    return compare.first?.id === analysis.id || compare.second?.id === analysis.id;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const scoreDiff = compare.first && compare.second
    ? (compare.second.overall_score - compare.first.overall_score).toFixed(1)
    : '0';

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="px-5 pt-5 pb-4">
          <Text className="text-2xl font-bold text-gray-900">Your Progress</Text>
          <Text className="text-base text-gray-500 mt-1">Track your glow-up journey</Text>
        </View>
        <View className="px-5 flex-row flex-wrap justify-between">
          <View className="w-[48%] mb-3 rounded-xl bg-gray-200 aspect-square" />
          <View className="w-[48%] mb-3 rounded-xl bg-gray-200 aspect-square" />
          <View className="w-[48%] mb-3 rounded-xl bg-gray-200 aspect-square" />
          <View className="w-[48%] mb-3 rounded-xl bg-gray-200 aspect-square" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Ionicons name="cloud-offline-outline" size={48} color="#ef4444" />
        <Text className="text-red-500 mt-4 text-center px-8">{error}</Text>
        <TouchableOpacity
          onPress={() => {
            hapticSelection();
            setIsLoading(true);
            loadAnalyses();
          }}
          className="mt-4 bg-blue-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#2563eb"
          />
        }
      >
        {/* Header */}
        <View className="px-5 pt-5 pb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Your Progress</Text>
            <Text className="text-base text-gray-500 mt-1">Track your glow-up journey over time</Text>
          </View>
          <TouchableOpacity
            onPress={toggleCompareMode}
            className={`px-4 py-2 rounded-full ${compareMode ? 'bg-blue-600' : 'bg-gray-100'}`}
          >
            <Text className={`font-medium ${compareMode ? 'text-white' : 'text-gray-700'}`}>
              {compareMode ? 'Cancel' : 'Compare'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Score Trend Chart */}
        <View className="mx-5 bg-gray-50 rounded-2xl p-4 mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Score Trend</Text>
          <ScoreTrendChart data={scoreHistory} />
        </View>

        {/* Compare Mode Instructions */}
        {compareMode && (
          <View className="mx-5 bg-blue-50 rounded-xl p-4 mb-4">
            <Text className="text-sm text-blue-700">
              Select two photos to compare your progress side by side.
            </Text>
            {compare.first && !compare.second && (
              <Text className="text-sm text-blue-700 mt-2 font-medium">
                First photo selected. Now select a second one.
              </Text>
            )}
          </View>
        )}

        {/* Photo Grid */}
        <View className="px-5 mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">All Scans</Text>

          {analyses.length === 0 ? (
            <View className="items-center py-16">
              <Ionicons name="camera-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-500 mt-4 text-center">
                Take your first scan to start{'\n'}tracking your progress
              </Text>
              <Text className="text-gray-400 mt-1 text-sm text-center">
                Track your glow-up journey over time
              </Text>
              <TouchableOpacity
                onPress={() => {
                  hapticSelection();
                  router.push('/(protected)/(tabs)');
                }}
                className="mt-4 bg-blue-600 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold">Take First Scan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {analyses.map((analysis) => (
                <TouchableOpacity
                  key={analysis.id}
                  onPress={() => handlePhotoPress(analysis)}
                  className={`w-[48%] mb-3 rounded-xl overflow-hidden ${
                    isSelected(analysis) ? 'border-2 border-blue-600' : ''
                  }`}
                  activeOpacity={0.8}
                >
                  <View className="bg-gray-200 aspect-square">
                    {analysis.image_url ? (
                      <Image
                        source={{ uri: analysis.image_url }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center">
                        <Ionicons name="person" size={40} color="#9ca3af" />
                      </View>
                    )}
                    {isSelected(analysis) && (
                      <View className="absolute top-2 right-2 bg-blue-600 rounded-full p-1">
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      </View>
                    )}
                  </View>
                  <View className="p-2 bg-white">
                    <View className="flex-row items-center justify-between">
                      <Text className={`text-lg font-bold ${getScoreColor(analysis.overall_score)}`}>
                        {analysis.overall_score.toFixed(1)}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {formatDate(analysis.analyzed_at)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Compare Modal */}
      <Modal
        visible={showCompareModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowCompareModal(false);
          setCompare({ first: null, second: null });
        }}
      >
        <View className="flex-1 justify-center bg-black/70">
          <View className="mx-4 bg-white rounded-2xl overflow-hidden">
            <View className="p-4 flex-row items-center justify-between border-b border-gray-100">
              <Text className="text-lg font-bold text-gray-900">Compare Progress</Text>
              <TouchableOpacity onPress={() => {
                setShowCompareModal(false);
                setCompare({ first: null, second: null });
              }}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View className="flex-row p-4">
              {/* First Photo */}
              <View className="flex-1 items-center">
                <View className="bg-gray-200 w-32 h-32 rounded-xl overflow-hidden">
                  {compare.first?.image_url ? (
                    <Image
                      source={{ uri: compare.first.image_url }}
                      className="w-full h-full"
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <Ionicons name="person" size={40} color="#9ca3af" />
                    </View>
                  )}
                </View>
                <Text className="text-sm text-gray-500 mt-2">Before</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {compare.first?.overall_score.toFixed(1)}
                </Text>
                <Text className="text-xs text-gray-400">
                  {compare.first && formatDate(compare.first.analyzed_at)}
                </Text>
              </View>

              {/* Arrow */}
              <View className="items-center justify-center px-2">
                <Ionicons name="arrow-forward" size={24} color="#d1d5db" />
              </View>

              {/* Second Photo */}
              <View className="flex-1 items-center">
                <View className="bg-gray-200 w-32 h-32 rounded-xl overflow-hidden">
                  {compare.second?.image_url ? (
                    <Image
                      source={{ uri: compare.second.image_url }}
                      className="w-full h-full"
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <Ionicons name="person" size={40} color="#9ca3af" />
                    </View>
                  )}
                </View>
                <Text className="text-sm text-gray-500 mt-2">After</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {compare.second?.overall_score.toFixed(1)}
                </Text>
                <Text className="text-xs text-gray-400">
                  {compare.second && formatDate(compare.second.analyzed_at)}
                </Text>
              </View>
            </View>

            {/* Score Difference */}
            <View className="mx-4 mb-4 p-4 bg-gray-50 rounded-xl items-center">
              <Text className="text-sm text-gray-500">Score Change</Text>
              <Text className={`text-3xl font-bold ${
                parseFloat(scoreDiff) > 0 ? 'text-green-600' : parseFloat(scoreDiff) < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {parseFloat(scoreDiff) > 0 ? '+' : ''}{scoreDiff}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
