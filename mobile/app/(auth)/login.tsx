import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
      setError(err.response?.data?.message || 'Login failed. Please try again.');
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
    <SafeAreaView className="flex-1 bg-[#040916]">
      <LinearGradient
        colors={['#040916', '#0a1630', '#121a3f']}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View className="flex-1 justify-center px-8">
            <View className="mb-10 items-center">
              <LinearGradient
                colors={['#2563eb', '#4f46e5']}
                className="mb-4 h-20 w-20 items-center justify-center rounded-3xl"
              >
                <Ionicons name="sparkles" size={40} color="#ffffff" />
              </LinearGradient>
              <Text className="text-3xl font-bold text-white">Mewify</Text>
              <Text className="mt-1 text-base text-gray-400">AI glow-up assistant</Text>
            </View>

            {error ? (
              <View className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                <Text className="text-sm text-red-300">{error}</Text>
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
                dark
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
                dark
              />
            </View>

            <Button title="Sign In" onPress={handleLogin} isLoading={isLoading} size="lg" />

            <AppleSignInButton onError={(msg) => setError(msg)} />

            <Pressable
              className="mt-5 items-center rounded-xl border border-blue-400/25 bg-blue-500/10 py-3"
              onPress={handleGuestMode}
            >
              <Text className="text-base font-medium text-blue-200">Try Guest Mode</Text>
              <Text className="mt-0.5 text-xs text-blue-300/80">3 free scans, no account needed</Text>
            </Pressable>

            <View className="mt-7 flex-row items-center justify-center">
              <Text className="text-gray-400">Don't have an account? </Text>
              <Link href="/(auth)/register" asChild>
                <Pressable>
                  <Text className="font-semibold text-blue-300">Sign Up</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}
