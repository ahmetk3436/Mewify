import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import AppleSignInButton from '../../components/ui/AppleSignInButton';
import { hapticSelection } from '../../lib/haptics';

export default function LoginScreen() {
  const { login, continueAsGuest } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Login failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = async () => {
    hapticSelection();
    await continueAsGuest();
    router.replace('/(protected)/home');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 justify-center px-8">
          {/* Logo */}
          <View className="mb-8 items-center">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-blue-600">
              <Ionicons name="sparkles" size={40} color="#ffffff" />
            </View>
            <Text className="text-3xl font-bold text-white">Mewify</Text>
            <Text className="mt-1 text-base text-gray-400">Your AI glow-up companion</Text>
          </View>

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

          <View className="mb-6">
            <Input
              label="Password"
              placeholder="Your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
            />
          </View>

          <Button
            title="Sign In"
            onPress={handleLogin}
            isLoading={isLoading}
            size="lg"
          />

          <AppleSignInButton onError={(msg) => setError(msg)} />

          <View className="mt-6 flex-row items-center justify-center">
            <Text className="text-gray-400">Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <Pressable>
                <Text className="font-semibold text-blue-400">Sign Up</Text>
              </Pressable>
            </Link>
          </View>

          {/* Guest Mode */}
          <Pressable
            className="mt-6 items-center py-3"
            onPress={handleGuestMode}
          >
            <Text className="text-base font-medium text-gray-500">
              Try Without Account
            </Text>
            <Text className="mt-1 text-xs text-gray-600">3 free scans included</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
