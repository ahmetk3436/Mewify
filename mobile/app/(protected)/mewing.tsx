import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { hapticSuccess, hapticSelection } from '../../lib/haptics';
import api from '../../lib/api';

interface MewingProgress {
  id: string;
  date: string;
  mewing_minutes: number;
  completed: boolean;
  notes: string;
}

interface MewingGoal {
  daily_minutes_goal: number;
  current_streak: number;
  longest_streak: number;
}

export default function MewingScreen() {
  const [todayProgress, setTodayProgress] = useState<MewingProgress | null>(null);
  const [goal, setGoal] = useState<MewingGoal>({ daily_minutes_goal: 60, current_streak: 0, longest_streak: 0 });
  const [showModal, setShowModal] = useState(false);
  const [minutes, setMinutes] = useState('30');
  const [notes, setNotes] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [weeklyData, setWeeklyData] = useState<boolean[]>([false, false, false, false, false, false, false]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load today's progress
      const todayRes = await api.get('/mewing/today');
      if (todayRes.data.data) {
        setTodayProgress(todayRes.data.data);
      }

      // Load goal/streak info
      const goalRes = await api.get('/mewing/goal');
      if (goalRes.data.data) {
        setGoal(goalRes.data.data);
      }

      // Load streaks
      const streakRes = await api.get('/mewing/streaks');
      if (streakRes.data.data) {
        setGoal(prev => ({
          ...prev,
          current_streak: streakRes.data.data.current_streak,
          longest_streak: streakRes.data.data.longest_streak,
        }));
      }
    } catch (error) {
      console.log('Failed to load mewing data');
    }
  };

  const handleLogSession = async () => {
    const mins = parseInt(minutes, 10);
    if (isNaN(mins) || mins <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of minutes.');
      return;
    }

    try {
      await api.post('/mewing/log', {
        mewing_minutes: mins,
        notes: notes,
      });

      hapticSuccess();
      setShowModal(false);
      setMinutes('30');
      setNotes('');
      loadData();

      Alert.alert('Session Logged!', `Great job! You logged ${mins} minutes of mewing.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to log session. Please try again.');
    }
  };

  const toggleSection = (section: string) => {
    hapticSelection();
    setExpandedSection(expandedSection === section ? null : section);
  };

  const progressPercent = todayProgress
    ? Math.min((todayProgress.mewing_minutes / goal.daily_minutes_goal) * 100, 100)
    : 0;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-5 pb-4">
          <Text className="text-2xl font-bold text-gray-900">Mewing Tracker</Text>
          <Text className="text-base text-gray-500 mt-1">Build your jawline one day at a time</Text>
        </View>

        {/* Today's Progress Card */}
        <View className="mx-5 bg-gradient-to-r bg-blue-50 rounded-2xl p-5 mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Today's Progress</Text>

          {/* Progress Ring */}
          <View className="items-center mb-4">
            <View className="w-32 h-32 rounded-full border-8 border-gray-200 items-center justify-center relative">
              <View
                className="absolute w-32 h-32 rounded-full border-8 border-blue-500"
                style={{ opacity: progressPercent / 100 }}
              />
              <Text className="text-3xl font-bold text-gray-900">
                {todayProgress?.mewing_minutes || 0}
              </Text>
              <Text className="text-sm text-gray-500">/ {goal.daily_minutes_goal} min</Text>
            </View>
          </View>

          {/* Log Session Button */}
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            className="bg-blue-600 py-3 rounded-xl items-center"
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold text-base">Log Mewing Session</Text>
          </TouchableOpacity>
        </View>

        {/* Streak Card */}
        <View className="mx-5 flex-row space-x-3 mb-4">
          <View className="flex-1 bg-orange-50 rounded-xl p-4 items-center">
            <Ionicons name="flame" size={28} color="#f97316" />
            <Text className="text-2xl font-bold text-gray-900 mt-1">{goal.current_streak}</Text>
            <Text className="text-sm text-gray-500">Day Streak</Text>
          </View>
          <View className="flex-1 bg-purple-50 rounded-xl p-4 items-center">
            <Ionicons name="trophy" size={28} color="#9333ea" />
            <Text className="text-2xl font-bold text-gray-900 mt-1">{goal.longest_streak}</Text>
            <Text className="text-sm text-gray-500">Best Streak</Text>
          </View>
        </View>

        {/* Weekly Calendar */}
        <View className="mx-5 bg-gray-50 rounded-xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">This Week</Text>
          <View className="flex-row justify-between">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <View key={i} className="items-center">
                <Text className="text-xs text-gray-500 mb-2">{day}</Text>
                <View className={`w-8 h-8 rounded-full items-center justify-center ${
                  weeklyData[i] ? 'bg-green-500' : 'bg-gray-200'
                }`}>
                  {weeklyData[i] && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Mewing Guide Accordion */}
        <View className="mx-5 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Mewing Guide</Text>

          {/* What is Mewing */}
          <TouchableOpacity
            onPress={() => toggleSection('what')}
            className="bg-gray-50 rounded-xl p-4 mb-2"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-medium text-gray-900">What is Mewing?</Text>
              <Ionicons
                name={expandedSection === 'what' ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#9ca3af"
              />
            </View>
            {expandedSection === 'what' && (
              <Text className="text-sm text-gray-600 mt-3">
                Mewing is a technique that involves placing your tongue on the roof of your mouth with your lips sealed and teeth slightly together. This proper oral posture, practiced over time, may help improve facial structure, jawline definition, and overall facial aesthetics.
              </Text>
            )}
          </TouchableOpacity>

          {/* Correct Tongue Position */}
          <TouchableOpacity
            onPress={() => toggleSection('position')}
            className="bg-gray-50 rounded-xl p-4 mb-2"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-medium text-gray-900">Correct Tongue Position</Text>
              <Ionicons
                name={expandedSection === 'position' ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#9ca3af"
              />
            </View>
            {expandedSection === 'position' && (
              <Text className="text-sm text-gray-600 mt-3">
                1. Press the entire tongue flat against the roof of your mouth{'\n'}
                2. The tip of your tongue should be just behind your front teeth{'\n'}
                3. Keep your lips sealed naturally{'\n'}
                4. Teeth should be lightly touching or slightly apart{'\n'}
                5. Breathe through your nose, not your mouth
              </Text>
            )}
          </TouchableOpacity>

          {/* Common Mistakes */}
          <TouchableOpacity
            onPress={() => toggleSection('mistakes')}
            className="bg-gray-50 rounded-xl p-4 mb-2"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-medium text-gray-900">Common Mistakes</Text>
              <Ionicons
                name={expandedSection === 'mistakes' ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#9ca3af"
              />
            </View>
            {expandedSection === 'mistakes' && (
              <Text className="text-sm text-gray-600 mt-3">
                • Only pressing the tip of the tongue (need the whole tongue){'\n'}
                • Pushing too hard (should be light, sustained pressure){'\n'}
                • Mouth breathing instead of nasal breathing{'\n'}
                • Clenching jaw or teeth too tightly{'\n'}
                • Inconsistent practice
              </Text>
            )}
          </TouchableOpacity>

          {/* Expected Results */}
          <TouchableOpacity
            onPress={() => toggleSection('results')}
            className="bg-gray-50 rounded-xl p-4"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-medium text-gray-900">Expected Results</Text>
              <Ionicons
                name={expandedSection === 'results' ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#9ca3af"
              />
            </View>
            {expandedSection === 'results' && (
              <Text className="text-sm text-gray-600 mt-3">
                Timeline varies by age and consistency:{'\n'}
                • 1-3 months: Improved nasal breathing, better posture awareness{'\n'}
                • 3-6 months: Subtle changes in facial structure may appear{'\n'}
                • 6-12 months: More noticeable improvements in jawline{'\n'}
                • 1-2+ years: Significant changes possible, especially for younger individuals
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Log Session Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">Log Session</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <Text className="text-base text-gray-600 mb-2">Minutes spent mewing:</Text>
            <TextInput
              value={minutes}
              onChangeText={setMinutes}
              keyboardType="numeric"
              className="bg-gray-100 rounded-xl px-4 py-3 text-lg mb-4"
              placeholder="30"
            />

            <Text className="text-base text-gray-600 mb-2">Notes (optional):</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              className="bg-gray-100 rounded-xl px-4 py-3 text-base mb-4"
              placeholder="How did your session go?"
            />

            <TouchableOpacity
              onPress={handleLogSession}
              className="bg-blue-600 py-4 rounded-xl items-center"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-base">Save Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
