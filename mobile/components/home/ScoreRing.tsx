import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 180,
  strokeWidth = 10
}) => {
  const normalizedScore = Math.max(0, Math.min(score, 10));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  // Animated progress
  useEffect(() => {
    progress.value = withSpring(normalizedScore / 10, {
      damping: 15,
      stiffness: 80,
    });

    // Pulse animation for high scores
    if (normalizedScore >= 7) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1000 }),
          withTiming(0.3, { duration: 1000 })
        ),
        -1,
        true
      );
    }

    // Haptic feedback on mount
    if (normalizedScore > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [normalizedScore]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - (circumference * progress.value);
    return {
      strokeDashoffset,
    };
  });

  // Score tier colors (AI Gradient Haze palette)
  const getScoreColors = () => {
    if (normalizedScore >= 8) return ['#7C3AED', '#EC4899', '#F472B6']; // Purple to Pink (Elite)
    if (normalizedScore >= 6) return ['#8B5CF6', '#6366F1', '#3B82F6']; // Purple to Blue (Good)
    if (normalizedScore >= 4) return ['#3B82F6', '#0EA5E9', '#06B6D4']; // Blue to Cyan (Average)
    return ['#64748B', '#475569', '#334155']; // Gray (Needs Work)
  };

  const getScoreLabel = () => {
    if (normalizedScore >= 9) return 'Elite';
    if (normalizedScore >= 7) return 'Strong';
    if (normalizedScore >= 5) return 'Progressing';
    if (normalizedScore >= 3) return 'Building';
    return 'Starting';
  };

  const gradientColors = getScoreColors();
  const gradientId = `scoreGradient-${normalizedScore}`;

  return (
    <Animated.View
      className="items-center justify-center"
      style={{
        width: size + 40,
        height: size + 40,
        transform: [{ scale: pulseScale }],
      }}
    >
      {/* Glow Effect Background */}
      <Animated.View
        style={{
          position: 'absolute',
          width: size + 20,
          height: size + 20,
          borderRadius: (size + 20) / 2,
          backgroundColor: gradientColors[0],
          opacity: glowOpacity,
          shadowColor: gradientColors[0],
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 30,
          shadowOpacity: 0.5,
        }}
      />

      {/* Main Ring Container */}
      <View
        className="items-center justify-center rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: '#0A0A0F',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 20,
          shadowOpacity: 0.5,
        }}
      >
        {/* SVG Progress Ring */}
        <Svg
          width={size}
          height={size}
          style={{ position: 'absolute' }}
        >
          {/* Background Ring */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1E1E2E"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Gradient Definition */}
          <Defs>
            <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor={gradientColors[0]} />
              <Stop offset="50%" stopColor={gradientColors[1]} />
              <Stop offset="100%" stopColor={gradientColors[2] || gradientColors[1]} />
            </SvgLinearGradient>
          </Defs>
          {/* Progress Ring */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
            transform={`rotate(-90 ${size/2} ${size/2})`}
          />
        </Svg>

        {/* Score Content */}
        <View className="items-center justify-center">
          <Text
            className="font-bold tracking-tight"
            style={{
              fontSize: size * 0.28,
              color: '#FFFFFF',
              textShadowColor: gradientColors[0],
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 10,
            }}
          >
            {normalizedScore.toFixed(1)}
          </Text>
          <Text
            className="font-medium tracking-wider uppercase"
            style={{
              fontSize: size * 0.08,
              color: gradientColors[0],
              marginTop: 2,
            }}
          >
            {getScoreLabel()}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

export default ScoreRing;
