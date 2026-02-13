import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { hapticSelection } from '../../lib/haptics';

interface MewingMiniCardProps {
  minutesToday: number;
  dailyGoal: number;
  streak: number;
}

const MewingMiniCard: React.FC<MewingMiniCardProps> = ({
  minutesToday = 0,
  dailyGoal = 60,
  streak = 0,
}) => {
  const router = useRouter();
  const progress = dailyGoal > 0 ? (minutesToday / dailyGoal) * 100 : 0;
  const isComplete = progress >= 100;
  const progressWidth = useSharedValue(0);

  React.useEffect(() => {
    progressWidth.value = withSpring(Math.min(progress, 100) / 100, {
      damping: 15,
      stiffness: 80,
    });
  }, [progress]);

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  return (
    <TouchableOpacity
      onPress={() => {
        hapticSelection();
        router.push('/(protected)/mewing');
      }}
      activeOpacity={0.9}
      className="overflow-hidden rounded-3xl"
    >
      <LinearGradient
        colors={isComplete ? ['#065F46', '#047857'] : ['#0F172A', '#1E293B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-5"
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: isComplete ? '#10B98120' : '#8B5CF620' }}
            >
              <Ionicons
                name={isComplete ? 'checkmark-circle' : 'timer'}
                size={22}
                color={isComplete ? '#10B981' : '#8B5CF6'}
              />
            </View>
            <Text className="ml-3 text-lg font-semibold text-white">
              Today's Mewing
            </Text>
          </View>
          {streak > 0 && (
            <View className="flex-row items-center px-3 py-1 rounded-full bg-orange-500/20">
              <Ionicons name="flame" size={14} color="#F97316" />
              <Text className="ml-1 text-sm font-medium text-orange-400">
                {streak}
              </Text>
            </View>
          )}
        </View>

        <View className="mb-4">
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-slate-400">
              {minutesToday} / {dailyGoal} min
            </Text>
            <Text
              className="text-sm font-bold"
              style={{ color: isComplete ? '#10B981' : '#8B5CF6' }}
            >
              {progress.toFixed(0)}%
            </Text>
          </View>
          {/* Progress Bar */}
          <View className="h-2.5 bg-slate-800/50 rounded-full overflow-hidden">
            <Animated.View
              style={[
                {
                  height: '100%',
                  borderRadius: 999,
                },
                progressAnimatedStyle,
              ]}
            >
              <LinearGradient
                colors={isComplete ? ['#10B981', '#34D399'] : ['#8B5CF6', '#A78BFA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Ionicons
              name={isComplete ? 'happy' : 'fitness'}
              size={16}
              color={isComplete ? '#10B981' : '#64748B'}
            />
            <Text className="ml-2 text-sm text-slate-400">
              {isComplete ? 'Goal achieved!' : 'Keep pushing!'}
            </Text>
          </View>
          <View className="flex-row items-center px-4 py-2 rounded-full bg-violet-500/20">
            <Text className="text-sm font-semibold text-violet-400">
              Log Session
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#8B5CF6" className="ml-1" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default MewingMiniCard;
