import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScoreRing from '../../../components/home/ScoreRing';
import MewingMiniCard from '../../../components/home/MewingMiniCard';
import GlowPlanPreview from '../../../components/home/GlowPlanPreview';
import api from '../../../lib/api';
import { hapticSuccess } from '../../../lib/haptics';

export default function HomeScreen() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [userData, setUserData] = useState({
    latestScore: 7.5,
    totalScans: 12,
    streak: 7,
    averageScoreTrend: 0.3, // positive trend
  });

  // Mock recommendations data
  const recommendations = [
    {
      id: '1',
      title: 'Improve Tongue Posture',
      description: 'Practice proper tongue placement for 10 mins daily',
      completed: false,
      priority: 9,
    },
    {
      id: '2',
      title: 'Hydrate More',
      description: 'Drink 2L water daily for better skin elasticity',
      completed: false,
      priority: 7,
    },
  ];

  const handleScanFace = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed for face scanning');
        return;
      }

      // Open camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.front,
      });

      if (!result.canceled) {
        setIsScanning(true);
        
        // Show face detection overlay (simulated)
        // In a real app, you'd show a face detection UI here
        
        // Mock analysis delay
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        // Success haptic
        hapticSuccess();
        
        // Navigate to results screen
        router.push('/results');
      }
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const renderQuickStats = () => (
    <View className="flex-row justify-between gap-3 mb-6">
      <View className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <View className="flex-row items-center mb-2">
          <Ionicons name="flash-outline" size={20} color="#F59E0B" />
          <Text className="ml-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            Streak
          </Text>
        </View>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          {userData.streak}
        </Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400">days</Text>
      </View>
      
      <View className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <View className="flex-row items-center mb-2">
          <Ionicons name="camera-outline" size={20} color="#8B5CF6" />
          <Text className="ml-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            Scans
          </Text>
        </View>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          {userData.totalScans}
        </Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400">total</Text>
      </View>

      <View className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <View className="flex-row items-center mb-2">
          <Ionicons name="bar-chart-outline" size={20} color="#10B981" />
          <Text className="ml-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            Trend
          </Text>
        </View>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          {userData.averageScoreTrend > 0 ? '+' : ''}{userData.averageScoreTrend}
        </Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400">avg</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            Track your mewing progress
          </Text>
        </View>

        {/* Score Ring */}
        <View className="items-center mb-8">
          <ScoreRing score={userData.latestScore} />
        </View>

        {/* Scan Button */}
        <TouchableOpacity
          onPress={handleScanFace}
          disabled={isScanning}
          className={`flex-row items-center justify-center bg-purple-600 rounded-2xl p-4 mb-8 shadow-lg ${isScanning ? 'opacity-70' : ''}`}
        >
          {isScanning ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="camera" size={24} color="white" />
              <Text className="ml-2 text-lg font-semibold text-white">
                Scan Your Face
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Quick Stats */}
        {renderQuickStats()}

        {/* Mewing Mini Card */}
        <MewingMiniCard 
          minutesToday={45} 
          dailyGoal={60} 
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