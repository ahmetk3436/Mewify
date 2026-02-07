import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScoreRing from '../../../components/home/ScoreRing';
import MewingMiniCard from '../../../components/home/MewingMiniCard';
import GlowPlanPreview from '../../../components/home/GlowPlanPreview';
import api from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { hapticSuccess, hapticSelection, hapticError } from '../../../lib/haptics';

export default function HomeScreen() {
  const router = useRouter();
  const { isGuest, guestUsageCount, canUseFeature, incrementGuestUsage } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [remainingUses, setRemainingUses] = useState(3);
  const [userData, setUserData] = useState({
    latestScore: 0,
    totalScans: 0,
    streak: 0,
    averageScoreTrend: 0,
  });
  const [mewingData, setMewingData] = useState({
    minutesToday: 0,
    dailyGoal: 60,
  });
  const [recommendations, setRecommendations] = useState<
    { id: string; title: string; description: string; completed: boolean; priority: number }[]
  >([]);

  const loadDashboardData = useCallback(async () => {
    try {
      if (isGuest) {
        setRemainingUses(3 - guestUsageCount);
        setIsLoading(false);
        return;
      }

      const results = await Promise.allSettled([
        api.get('/analyses/stats'),
        api.get('/analyses/latest'),
        api.get('/mewing/streaks'),
        api.get('/usage/remaining'),
        api.get('/mewing/today'),
        api.get('/glow-plan'),
      ]);

      // Stats
      if (results[0].status === 'fulfilled' && results[0].value.data.data) {
        const stats = results[0].value.data.data;
        setUserData((prev) => ({
          ...prev,
          totalScans: stats.total_scans || 0,
          averageScoreTrend: stats.average_score_trend || 0,
        }));
      }

      // Latest analysis
      if (results[1].status === 'fulfilled' && results[1].value.data.data) {
        const latest = results[1].value.data.data;
        setUserData((prev) => ({
          ...prev,
          latestScore: latest.overall_score || 0,
        }));
      }

      // Streaks
      if (results[2].status === 'fulfilled' && results[2].value.data.data) {
        const streaks = results[2].value.data.data;
        setUserData((prev) => ({
          ...prev,
          streak: streaks.current_streak || 0,
        }));
      }

      // Usage
      if (results[3].status === 'fulfilled') {
        const usage = results[3].value.data;
        setRemainingUses(usage.remaining_uses ?? 3);
      }

      // Mewing today
      if (results[4].status === 'fulfilled' && results[4].value.data.data) {
        const today = results[4].value.data.data;
        setMewingData({
          minutesToday: today.mewing_minutes || 0,
          dailyGoal: 60,
        });
      }

      // Glow plan recommendations
      if (results[5].status === 'fulfilled' && results[5].value.data.data) {
        const plans = results[5].value.data.data;
        if (Array.isArray(plans)) {
          setRecommendations(
            plans.map((p: any) => ({
              id: p.id,
              title: p.title,
              description: p.description,
              completed: p.completed || false,
              priority: p.priority || 5,
            }))
          );
        }
      }
    } catch (err) {
      // Silently fail - show whatever data we have
    } finally {
      setIsLoading(false);
    }
  }, [isGuest, guestUsageCount]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const handleScanFace = async () => {
    hapticSelection();

    // Check guest usage limit
    if (isGuest && !canUseFeature()) {
      Alert.alert(
        'Scan Limit Reached',
        'Create a free account to continue scanning, or upgrade to Premium for unlimited scans.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Up', onPress: () => router.push('/(auth)/register') },
        ]
      );
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed for face scanning');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.front,
      });

      if (!result.canceled && result.assets[0]) {
        setIsScanning(true);

        try {
          // Convert image to base64
          const imageUri = result.assets[0].uri;
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const dataUrl = reader.result as string;
              // Remove the data:image/...;base64, prefix
              const base64Data = dataUrl.split(',')[1] || dataUrl;
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          if (isGuest) {
            await incrementGuestUsage();
          }

          // Post to AI analysis endpoint
          const analysisResponse = await api.post('/analyses/ai', {
            image_base64: base64,
          });

          hapticSuccess();

          if (analysisResponse.data.data?.id) {
            router.push(`/(protected)/analysis/${analysisResponse.data.data.id}`);
          }

          // Update remaining uses
          if (analysisResponse.data.remaining_uses !== undefined) {
            setRemainingUses(analysisResponse.data.remaining_uses);
          }
        } catch (err: any) {
          hapticError();
          if (err.response?.status === 429) {
            Alert.alert(
              'Daily Limit Reached',
              'You have used all your free scans for today. Upgrade to Premium for unlimited scans.',
              [
                { text: 'OK', style: 'cancel' },
                { text: 'Upgrade', onPress: () => router.push('/(protected)/settings') },
              ]
            );
          } else {
            Alert.alert('Error', 'Failed to analyze image. Please try again.');
          }
        } finally {
          setIsScanning(false);
        }
      }
    } catch (error) {
      hapticError();
      setIsScanning(false);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    }
  };

  const renderQuickStats = () => (
    <View className="flex-row justify-between gap-3 mb-6">
      <View className="flex-1 bg-gray-900 rounded-xl p-4 border border-gray-800">
        <View className="flex-row items-center mb-2">
          <Ionicons name="flash-outline" size={20} color="#F59E0B" />
          <Text className="ml-2 text-xs font-medium text-gray-400">Streak</Text>
        </View>
        <Text className="text-2xl font-bold text-white">{userData.streak}</Text>
        <Text className="text-xs text-gray-500">days</Text>
      </View>

      <View className="flex-1 bg-gray-900 rounded-xl p-4 border border-gray-800">
        <View className="flex-row items-center mb-2">
          <Ionicons name="camera-outline" size={20} color="#8B5CF6" />
          <Text className="ml-2 text-xs font-medium text-gray-400">Scans</Text>
        </View>
        <Text className="text-2xl font-bold text-white">{userData.totalScans}</Text>
        <Text className="text-xs text-gray-500">total</Text>
      </View>

      <View className="flex-1 bg-gray-900 rounded-xl p-4 border border-gray-800">
        <View className="flex-row items-center mb-2">
          <Ionicons name="bar-chart-outline" size={20} color="#10B981" />
          <Text className="ml-2 text-xs font-medium text-gray-400">Trend</Text>
        </View>
        <Text className="text-2xl font-bold text-white">
          {userData.averageScoreTrend > 0 ? '+' : ''}
          {userData.averageScoreTrend.toFixed(1)}
        </Text>
        <Text className="text-xs text-gray-500">avg</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <ScrollView
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#3b82f6"
          />
        }
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-white">Dashboard</Text>
          <Text className="text-sm text-gray-400">Track your mewing progress</Text>
        </View>

        {/* Score Ring */}
        <View className="items-center mb-8">
          <ScoreRing score={userData.latestScore} />
        </View>

        {/* Scan Button */}
        <TouchableOpacity
          onPress={handleScanFace}
          disabled={isScanning}
          className={`flex-row items-center justify-center bg-blue-600 rounded-2xl p-4 mb-4 shadow-lg ${
            isScanning ? 'opacity-70' : ''
          }`}
        >
          {isScanning ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="camera" size={24} color="white" />
              <Text className="ml-2 text-lg font-semibold text-white">Scan Your Face</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Remaining scans badge */}
        {remainingUses >= 0 && remainingUses <= 3 && (
          <View className="items-center mb-6">
            <Text className="text-sm text-gray-500">
              {remainingUses === -1 ? 'Unlimited scans' : `${remainingUses} scans left today`}
            </Text>
          </View>
        )}

        {/* Quick Stats */}
        {renderQuickStats()}

        {/* Mewing Mini Card */}
        <MewingMiniCard
          minutesToday={mewingData.minutesToday}
          dailyGoal={mewingData.dailyGoal}
          streak={userData.streak}
        />

        {/* Glow Plan Preview */}
        <View className="mt-6 mb-8">
          <GlowPlanPreview recommendations={recommendations} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
