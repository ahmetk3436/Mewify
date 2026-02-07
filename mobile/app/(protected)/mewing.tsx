import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, RefreshControl } from 'react-native';
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
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);

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

      // Load weekly history for the calendar
      try {
        const historyRes = await api.get('/mewing/history?days=7');
        if (historyRes.data.data?.entries) {
          const entries = historyRes.data.data.entries;
          const today = new Date();
          const dayOfWeek = today.getDay();
          // Monday = 0, Tuesday = 1, ..., Sunday = 6
          const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - mondayOffset);
          weekStart.setHours(0, 0, 0, 0);

          const newWeeklyData = [false, false, false, false, false, false, false];
          entries.forEach((entry: any) => {
            const entryDate = new Date(entry.date);
            entryDate.setHours(0, 0, 0, 0);
            const diff = Math.floor((entryDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
            if (diff >= 0 && diff < 7 && entry.mewing_minutes > 0) {
              newWeeklyData[diff] = true;
            }
          });
          setWeeklyData(newWeeklyData);
        }
      } catch {
        // Weekly data is optional, don't fail the whole screen
      }
    } catch (err) {
      setError('Failed to load mewing data. Please try again.');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
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
    } catch (err) {
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

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Ionicons name="cloud-offline-outline" size={48} color="#ef4444" />
        <Text className="text-red-500 mt-4 text-center px-8">{error}</Text>
        <TouchableOpacity
          onPress={() => {
            hapticSelection();
            loadData();
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
        <View className="px-5 pt-5 pb-4">
          <Text className="text-2xl font-bold text-gray-900">Mewing Tracker</Text>
          <Text className="text-base text-gray-500 mt-1">Build your jawline one day at a time</Text>
        </View>

        {/* Today's Progress Card */}
        <View className="mx-5 bg-blue-50 rounded-2xl p-5 mb-4">
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
            onPress={() => {
              hapticSelection();
              setShowModal(true);
            }}
            className="bg-blue-600 py-3 rounded-xl items-center"
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold text-base">Log Mewing Session</Text>
          </TouchableOpacity>
        </View>

        {/* Streak Card */}
        <View className="mx-5 flex-row gap-3 mb-4">
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
                {'\u2022'} Only pressing the tip of the tongue (need the whole tongue){'\n'}
                {'\u2022'} Pushing too hard (should be light, sustained pressure){'\n'}
                {'\u2022'} Mouth breathing instead of nasal breathing{'\n'}
                {'\u2022'} Clenching jaw or teeth too tightly{'\n'}
                {'\u2022'} Inconsistent practice
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
                {'\u2022'} 1-3 months: Improved nasal breathing, better posture awareness{'\n'}
                {'\u2022'} 3-6 months: Subtle changes in facial structure may appear{'\n'}
                {'\u2022'} 6-12 months: More noticeable improvements in jawline{'\n'}
                {'\u2022'} 1-2+ years: Significant changes possible, especially for younger individuals
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
