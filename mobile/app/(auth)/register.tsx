import React, { useState, useMemo } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { hapticSelection } from '../../lib/haptics';

export default function RegisterScreen() {
  const { register, continueAsGuest } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = useMemo(() => {
    if (password.length === 0) return null;
    if (password.length < 6) return { label: 'Weak', color: 'bg-red-500', textColor: 'text-red-500' };
    if (password.length < 10) return { label: 'Medium', color: 'bg-amber-500', textColor: 'text-amber-500' };
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    if (hasNumber && (hasSpecial || hasUpper)) {
      return { label: 'Strong', color: 'bg-green-500', textColor: 'text-green-500' };
    }
    return { label: 'Medium', color: 'bg-amber-500', textColor: 'text-amber-500' };
  }, [password]);

  const handleRegister = async () => {
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = async () => {
    hapticSelection();
    await continueAsGuest();
    router.replace('/(protected)/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 justify-center px-8">
          <Text className="mb-2 text-3xl font-bold text-white">
            Create account
          </Text>
          <Text className="mb-8 text-base text-gray-400">
            Start your glow-up journey
          </Text>

          {error ? (
            <View className="mb-4 rounded-xl bg-red-900/30 border border-red-800 p-3">
              <Text className="text-sm text-red-400">{error}</Text>
            </View>
          ) : null}

          <View className="mb-4">
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
            />
          </View>

          <View className="mb-2">
            <Input
              label="Password"
              placeholder="Min. 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
            />
          </View>

          {/* Password Strength Indicator */}
          {passwordStrength && (
            <View className="mb-4 flex-row items-center">
              <View className="flex-1 h-1 rounded-full bg-gray-700 overflow-hidden">
                <View
                  className={`h-full rounded-full ${passwordStrength.color}`}
                  style={{
                    width: passwordStrength.label === 'Weak' ? '33%' :
                           passwordStrength.label === 'Medium' ? '66%' : '100%',
                  }}
                />
              </View>
              <Text className={`ml-3 text-xs ${passwordStrength.textColor}`}>
                {passwordStrength.label}
              </Text>
            </View>
          )}

          <View className="mb-6">
            <Input
              label="Confirm Password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textContentType="newPassword"
            />
          </View>

          <Button
            title="Create Account"
            onPress={handleRegister}
            isLoading={isLoading}
            size="lg"
          />

          <View className="mt-6 flex-row items-center justify-center">
            <Text className="text-gray-400">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable onPress={() => hapticSelection()}>
                <Text className="font-semibold text-blue-400">Sign In</Text>
              </Pressable>
            </Link>
          </View>

          {/* Guest Mode */}
          <Pressable
            className="mt-6 items-center py-3"
            onPress={handleGuestMode}
          >
            <Text className="text-base font-medium text-gray-500">
              Skip for now
            </Text>
            <Text className="mt-1 text-xs text-gray-600">Try 3 free scans</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
