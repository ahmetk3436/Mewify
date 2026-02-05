import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ProgressHeader from '../../components/glow-plan/ProgressHeader';
import CategoryFilter from '../../components/glow-plan/CategoryFilter';
import RecommendationCard from '../../components/glow-plan/RecommendationCard';
import { hapticSuccess } from '../../lib/haptics';
import api from '../../lib/api';
import {
  Recommendation,
  CategoryType,
  ProgressStats,
} from '../../types/glow-plan';

// Mock data - will be replaced with API call
const mockRecommendations: Recommendation[] = [
  {
    id: '1',
    category: 'Jawline',
    title: 'Chin tuck exercises',
    description: 'Perform chin tucks daily to strengthen neck muscles and improve jawline definition. Do 3 sets of 15 reps, holding each rep for 5 seconds.',
    difficulty: 'easy',
    timeframeWeeks: 4,
    priority: true,
    completed: false,
  },
  {
    id: '2',
    category: 'Skin',
    title: 'Daily sunscreen',
    description: 'Apply SPF 30+ sunscreen every morning to protect your skin from UV damage and prevent premature aging.',
    difficulty: 'easy',
    timeframeWeeks: 2,
    priority: false,
    completed: true,
  },
  {
    id: '3',
    category: 'Fitness',
    title: 'Full body workout',
    description: 'Complete 3 full body workouts per week focusing on compound movements. Include squats, push-ups, and rows.',
    difficulty: 'medium',
    timeframeWeeks: 8,
    priority: true,
    completed: false,
  },
  {
    id: '4',
    category: 'Grooming',
    title: 'Skincare routine',
    description: 'Establish a morning and evening skincare routine including cleanser, moisturizer, and targeted treatments.',
    difficulty: 'medium',
    timeframeWeeks: 6,
    priority: false,
    completed: false,
  },
  {
    id: '5',
    category: 'Style',
    title: 'Wardrobe audit',
    description: 'Review your current wardrobe and identify pieces that fit well and align with your desired style.',
    difficulty: 'easy',
    timeframeWeeks: 2,
    priority: false,
    completed: true,
  },
];

export default function GlowPlanScreen() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Recommendation[]>(mockRecommendations);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All');
  const [progress, setProgress] = useState<ProgressStats>({ completed: 0, total: 0 });
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Calculate progress whenever recommendations change
  useEffect(() => {
    const completed = recommendations.filter(r => r.completed).length;
    const total = recommendations.length;
    setProgress({ completed, total });
  }, [recommendations]);

  const handleToggleComplete = (id: string, completed: boolean) => {
    setRecommendations(prev =>
      prev.map(rec =>
        rec.id === id ? { ...rec, completed } : rec
      )
    );

    // Trigger haptic feedback
    hapticSuccess();

    // Optional: Show confetti when all completed
    if (completed && progress.completed + 1 === progress.total) {
      Alert.alert('🎉 Congratulations!', 'You completed your entire glow plan!');
    }
  };

  const handleRegeneratePlan = async () => {
    Alert.alert(
      'Regenerate Plan',
      'This will create a new personalized glow plan based on your current progress. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          onPress: async () => {
            setIsRegenerating(true);
            try {
              // TODO: Call actual API endpoint
              // const response = await api.post('/glow-plan/regenerate');
              // setRecommendations(response.data);
              
              // Simulating API delay
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              // Reset mock data for demo purposes
              setRecommendations(prev => prev.map(r => ({ ...r, completed: false })));
              setSelectedCategory('All');
              
              Alert.alert('Success', 'Your new glow plan is ready!');
            } catch (error) {
              Alert.alert('Error', 'Failed to regenerate plan. Please try again.');
            } finally {
              setIsRegenerating(false);
            }
          },
        },
      ]
    );
  };

  const filteredRecommendations = selectedCategory === 'All'
    ? recommendations
    : recommendations.filter(r => r.category === selectedCategory);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <ProgressHeader progress={progress} />
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        
        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-24"
        >
          {filteredRecommendations.length === 0 ? (
            <View className="flex-1 items-center justify-center pt-20">
              <Ionicons name="leaf-outline" size={48} color="#d1d5db" />
              <Text className="mt-4 text-gray-500">No recommendations found.</Text>
            </View>
          ) : (
            filteredRecommendations.map((item) => (
              <RecommendationCard
                key={item.id}
                recommendation={item}
                onToggleComplete={handleToggleComplete}
              />
            ))
          )}
        </ScrollView>

        {/* Floating Action Button for Regenerate */}
        <View className="absolute bottom-6 left-0 right-0 px-5">
          <TouchableOpacity
            onPress={handleRegeneratePlan}
            disabled={isRegenerating}
            className={`flex-row items-center justify-center bg-blue-600 py-4 rounded-xl shadow-lg ${
              isRegenerating ? 'opacity-70' : ''
            }`}
            activeOpacity={0.8}
          >
            {isRegenerating ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={20} color="#ffffff" />
                <Text className="ml-2 text-base font-semibold text-white">
                  Regenerate Plan
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}