import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import api from '../../lib/api';
import { hapticSuccess, hapticSelection, hapticError } from '../../lib/haptics';

interface Friend {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  friend_info?: {
    username: string;
    level: number;
    streak: number;
    last_active: string;
  };
}

interface LeaderboardEntry {
  user_id: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
}

export default function AccountabilityPartner() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendCode, setFriendCode] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'leaderboard'>('friends');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [friendsRes, leaderboardRes] = await Promise.all([
        api.get('/monetization/friends'),
        api.get('/monetization/friends/leaderboard'),
      ]);
      setFriends(friendsRes.data.data || []);
      setLeaderboard(leaderboardRes.data.data || []);
    } catch (err) {
      console.error('Failed to load friends data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendFriendRequest = async () => {
    if (!friendCode.trim()) return;

    hapticSelection();
    setIsAdding(true);

    try {
      await api.post('/monetization/friends/request', {
        receiver_id: friendCode.trim(),
      });
      hapticSuccess();
      Alert.alert('Request Sent!', 'Your friend request has been sent.');
      setFriendCode('');
      setShowAddFriend(false);
    } catch (err: any) {
      hapticError();
      Alert.alert('Error', err.response?.data?.message || 'Failed to send request');
    } finally {
      setIsAdding(false);
    }
  };

  const sendNudge = async (friendId: string) => {
    hapticSelection();

    try {
      await api.post('/monetization/friends/nudge', {
        friend_id: friendId,
        nudge_type: 'missed_session',
      });
      hapticSuccess();
      Alert.alert('Nudge Sent!', "Your friend will be notified to get back on track!");
    } catch (err) {
      hapticError();
      Alert.alert('Error', 'Failed to send nudge');
    }
  };

  const getTimeSinceActive = (lastActive: string): string => {
    const diff = Date.now() - new Date(lastActive).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Active now';
  };

  if (isLoading) {
    return (
      <View className="bg-[#0F172A] rounded-3xl p-6 border border-slate-800 items-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <Animated.View entering={FadeInUp.delay(600).springify()} className="mb-6">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4 px-1">
        <Text className="text-lg font-semibold text-white">Accountability Partners</Text>
        <TouchableOpacity
          onPress={() => { hapticSelection(); setShowAddFriend(true); }}
          className="w-8 h-8 rounded-full bg-violet-500/20 items-center justify-center"
        >
          <Ionicons name="add" size={18} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-slate-800/50 rounded-full p-1 mb-4 mx-1">
        <TouchableOpacity
          onPress={() => { hapticSelection(); setActiveTab('friends'); }}
          className={`flex-1 py-2 rounded-full ${activeTab === 'friends' ? 'bg-violet-600' : ''}`}
        >
          <Text className={`text-center text-sm font-medium ${activeTab === 'friends' ? 'text-white' : 'text-slate-400'}`}>
            Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { hapticSelection(); setActiveTab('leaderboard'); }}
          className={`flex-1 py-2 rounded-full ${activeTab === 'leaderboard' ? 'bg-violet-600' : ''}`}
        >
          <Text className={`text-center text-sm font-medium ${activeTab === 'leaderboard' ? 'text-white' : 'text-slate-400'}`}>
            Leaderboard
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="bg-[#0F172A] rounded-3xl border border-slate-800 overflow-hidden">
        {activeTab === 'friends' ? (
          friends.length === 0 ? (
            <View className="p-8 items-center">
              <View className="w-16 h-16 rounded-full bg-violet-500/10 items-center justify-center mb-4">
                <Ionicons name="people-outline" size={32} color="#8B5CF6" />
              </View>
              <Text className="text-white font-medium mb-1">No Friends Yet</Text>
              <Text className="text-slate-500 text-sm text-center">
                Add friends to keep each other accountable!
              </Text>
            </View>
          ) : (
            <ScrollView className="max-h-64">
              {friends.map((friend, index) => (
                <Animated.View
                  key={friend.id}
                  entering={FadeIn.delay(index * 50).springify()}
                  className="flex-row items-center p-4 border-b border-slate-800/50"
                >
                  {/* Avatar */}
                  <View className="w-12 h-12 rounded-full bg-violet-500/20 items-center justify-center mr-3">
                    <Ionicons name="person" size={20} color="#8B5CF6" />
                  </View>

                  {/* Info */}
                  <View className="flex-1">
                    <Text className="text-white font-medium">
                      {friend.friend_info?.username || 'Friend'}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="flame" size={12} color="#F97316" />
                      <Text className="text-slate-500 text-xs ml-1">
                        {friend.friend_info?.streak || 0} day streak
                      </Text>
                      <Text className="text-slate-600 text-xs mx-2">•</Text>
                      <Text className="text-slate-500 text-xs">
                        {friend.friend_info ? getTimeSinceActive(friend.friend_info.last_active) : ''}
                      </Text>
                    </View>
                  </View>

                  {/* Nudge button */}
                  <TouchableOpacity
                    onPress={() => sendNudge(friend.requester_id)}
                    className="px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30"
                  >
                    <Ionicons name="notifications" size={16} color="#FBBF24" />
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          )
        ) : (
          <ScrollView className="max-h-64">
            {leaderboard.map((entry, index) => (
              <Animated.View
                key={entry.user_id}
                entering={FadeIn.delay(index * 50).springify()}
                className={`flex-row items-center p-4 ${index < leaderboard.length - 1 ? 'border-b border-slate-800/50' : ''}`}
              >
                {/* Rank */}
                <View
                  className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                    index === 0 ? 'bg-amber-500/20' : index === 1 ? 'bg-slate-400/20' : index === 2 ? 'bg-orange-600/20' : 'bg-slate-800'
                  }`}
                >
                  <Text
                    className={`font-bold ${
                      index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-orange-400' : 'text-slate-500'
                    }`}
                  >
                    {index + 1}
                  </Text>
                </View>

                {/* Avatar */}
                <View className="w-10 h-10 rounded-full bg-violet-500/20 items-center justify-center mr-3">
                  <Ionicons name="person" size={18} color="#8B5CF6" />
                </View>

                {/* Info */}
                <View className="flex-1">
                  <Text className="text-white font-medium">Level {entry.current_level}</Text>
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="flame" size={12} color="#F97316" />
                    <Text className="text-slate-500 text-xs ml-1">{entry.current_streak}d</Text>
                  </View>
                </View>

                {/* XP */}
                <Text className="text-violet-400 font-bold">{entry.total_xp.toLocaleString()} XP</Text>
              </Animated.View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Add Friend Modal */}
      {showAddFriend && (
        <Animated.View
          entering={FadeIn.springify()}
          className="absolute inset-0 bg-black/80 justify-center"
          style={{ zIndex: 100 }}
        >
          <Animated.View
            entering={ZoomIn.springify()}
            className="mx-6 bg-[#0F172A] rounded-3xl p-6 border border-violet-500/20"
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-white">Add Friend</Text>
              <TouchableOpacity onPress={() => setShowAddFriend(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text className="text-slate-400 text-sm mb-4">
              Enter your friend's user ID or share your code with them.
            </Text>

            <TextInput
              value={friendCode}
              onChangeText={setFriendCode}
              placeholder="Friend's User ID"
              placeholderTextColor="#475569"
              className="bg-slate-800 rounded-xl px-4 py-3 text-white mb-4"
            />

            <TouchableOpacity
              onPress={sendFriendRequest}
              disabled={isAdding || !friendCode.trim()}
              className={`py-3 rounded-xl items-center ${friendCode.trim() ? 'bg-violet-600' : 'bg-slate-700'}`}
            >
              {isAdding ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-medium">Send Request</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}
    </Animated.View>
  );
}
