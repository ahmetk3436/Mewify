import React, { useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { hapticSelection } from '../../lib/haptics';

const TABS = [
  { name: 'home', label: 'Home', icon: 'home', iconOutline: 'home-outline', path: '/(protected)/(tabs)' },
  { name: 'mewing', label: 'Mewing', icon: 'fitness', iconOutline: 'fitness-outline', path: '/(protected)/mewing' },
  { name: 'progress', label: 'Progress', icon: 'images', iconOutline: 'images-outline', path: '/(protected)/progress' },
  { name: 'settings', label: 'Settings', icon: 'person', iconOutline: 'person-outline', path: '/(protected)/settings' },
] as const;

export default function ProtectedLayout() {
  const { isAuthenticated, isLoading, isGuest } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isGuest) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, isGuest]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-950">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Hide tab bar on detail screens
  const hideTabBar = pathname.includes('/analysis/') || pathname.includes('/glow-plan') || pathname.includes('/paywall');

  const isTabActive = (tabName: string) => {
    if (tabName === 'home') return pathname === '/(protected)/(tabs)' || pathname === '/' || pathname.includes('(tabs)');
    return pathname.includes(tabName);
  };

  return (
    <View className="flex-1 bg-gray-950">
      <Slot />
      {!hideTabBar && (
        <View
          className="flex-row border-t border-gray-800 bg-gray-950"
          style={{ paddingBottom: insets.bottom || 20 }}
        >
          {TABS.map((tab) => {
            const active = isTabActive(tab.name);
            return (
              <Pressable
                key={tab.name}
                className="flex-1 items-center py-2"
                onPress={() => {
                  hapticSelection();
                  router.push(tab.path as any);
                }}
              >
                <Ionicons
                  name={(active ? tab.icon : tab.iconOutline) as any}
                  size={24}
                  color={active ? '#3b82f6' : '#6b7280'}
                />
                <Text
                  className="mt-1 text-xs"
                  style={{ color: active ? '#3b82f6' : '#6b7280' }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
