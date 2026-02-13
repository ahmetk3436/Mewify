import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  PressableProps,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { cn } from '../../lib/cn';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'ai';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const variantGradients: Record<string, string[]> = {
  primary: ['#6366F1', '#8B5CF6'],
  secondary: ['#334155', '#475569'],
  destructive: ['#DC2626', '#EF4444'],
  ai: ['#7C3AED', '#EC4899'],
};

const variantStyles = {
  primary: 'border-transparent',
  secondary: 'border-transparent',
  outline: 'border-2 border-violet-500 bg-transparent',
  destructive: 'border-transparent',
  ghost: 'bg-transparent',
  ai: 'border-transparent',
};

const variantTextStyles = {
  primary: 'text-white',
  secondary: 'text-white',
  outline: 'text-violet-400',
  destructive: 'text-white',
  ghost: 'text-violet-400',
  ai: 'text-white',
};

const sizeStyles = {
  sm: 'px-3 py-2 rounded-lg',
  md: 'px-5 py-3 rounded-xl',
  lg: 'px-6 py-4 rounded-xl',
  xl: 'px-8 py-5 rounded-2xl',
};

const sizeTextStyles = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

export default function Button({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  icon,
  iconPosition = 'left',
  onPress,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    glowOpacity.value = withTiming(0.3, { duration: 100 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    glowOpacity.value = withTiming(0, { duration: 200 });
  };

  const handlePress = (e: any) => {
    if (!isDisabled && onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress(e);
    }
  };

  const gradientColors = variantGradients[variant] || variantGradients.primary;
  const hasGradient = ['primary', 'secondary', 'destructive', 'ai'].includes(variant);

  // Determine loading indicator color
  const loadingColor = variant === 'outline' || variant === 'ghost' ? '#8B5CF6' : '#FFFFFF';

  return (
    <Animated.View style={animatedStyle} className="relative">
      {/* Glow effect for AI variant */}
      {variant === 'ai' && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: -4,
              right: -4,
              top: -4,
              bottom: -4,
              borderRadius: 20,
              backgroundColor: '#7C3AED',
            },
            glowStyle,
          ]}
          className="blur-xl"
        />
      )}

      {hasGradient ? (
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isDisabled}
          style={style}
          className={cn(
            'overflow-hidden',
            sizeStyles[size],
            variantStyles[variant],
            isDisabled && 'opacity-50'
          )}
          {...props}
        >
          <LinearGradient
            colors={gradientColors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color={loadingColor} size="small" />
            ) : (
              <>
                {icon && iconPosition === 'left' && icon}
                <Text
                  className={cn(
                    'font-semibold',
                    variantTextStyles[variant],
                    sizeTextStyles[size]
                  )}
                >
                  {title}
                </Text>
                {icon && iconPosition === 'right' && icon}
              </>
            )}
          </LinearGradient>
        </Pressable>
      ) : (
        <AnimatedPressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isDisabled}
          style={style}
          className={cn(
            'flex-row items-center justify-center gap-2',
            sizeStyles[size],
            variantStyles[variant],
            isDisabled && 'opacity-50'
          )}
          {...props}
        >
          {isLoading ? (
            <ActivityIndicator color={loadingColor} size="small" />
          ) : (
            <>
              {icon && iconPosition === 'left' && icon}
              <Text
                className={cn(
                  'font-semibold',
                  variantTextStyles[variant],
                  sizeTextStyles[size]
                )}
              >
                {title}
              </Text>
              {icon && iconPosition === 'right' && icon}
            </>
          )}
        </AnimatedPressable>
      )}
    </Animated.View>
  );
}
