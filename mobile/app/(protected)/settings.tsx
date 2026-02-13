import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert, Switch, ScrollView, Linking, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { useAuth } from '../../contexts/AuthContext';
import { isBiometricAvailable, getBiometricType } from '../../lib/biometrics';
import { hapticWarning, hapticMedium, hapticSelection, hapticSuccess } from '../../lib/haptics';
import { initializePurchases, restorePurchases } from '../../lib/purchases';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

// Responsive sizing
const SIZES = {
  rowHeight: isSmallDevice ? 52 : 56,
  iconSize: isSmallDevice ? 20 : 22,
  fontSize: {
    label: isSmallDevice ? 15 : 16,
    value: isSmallDevice ? 13 : 14,
    section: isSmallDevice ? 10 : 11,
  },
};

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  color = '#ffffff',
  showChevron = true,
  isLast = false,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  color?: string;
  showChevron?: boolean;
  isLast?: boolean;
}) {
  return (
    <Pressable
      className="flex-row items-center px-4"
      style={{ minHeight: 56 }}
      onPress={() => {
        if (onPress) {
          hapticSelection();
          onPress();
        }
      }}
      disabled={!onPress}
    >
      <View
        className="h-9 w-9 items-center justify-center rounded-xl"
        style={{ backgroundColor: color === '#ffffff' ? 'rgba(139, 92, 246, 0.15)' : `${color}20` }}
      >
        <Ionicons name={icon as any} size={SIZES.iconSize - 2} color={color === '#ffffff' ? '#8B5CF6' : color} />
      </View>
      <Text className="ml-3 flex-1 text-base" style={{ color }}>{label}</Text>
      {value && <Text className="mr-2 text-sm text-slate-500">{value}</Text>}
      {showChevron && onPress && <Ionicons name="chevron-forward" size={16} color="#4b5563" />}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { user, isGuest, logout, deleteAccount, guestDaysRemaining } = useAuth();
  const router = useRouter();
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const checkBiometrics = async () => {
      const available = await isBiometricAvailable();
      if (available) {
        const type = await getBiometricType();
        setBiometricType(type);
      }
    };
    checkBiometrics();
  }, []);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount(deletePassword);
      setShowDeleteModal(false);
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to delete account'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    hapticWarning();
    Alert.alert(
      '⚠️ Delete Account',
      'This action is permanent. All your data will be erased and cannot be recovered.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setShowDeleteModal(true),
        },
      ]
    );
  };

  const handleRestorePurchases = async () => {
    hapticMedium();
    const initialized = await initializePurchases();
    if (!initialized) {
      Alert.alert(
        'Purchases Unavailable',
        'RevenueCat key is not configured on this build. Add EXPO_PUBLIC_REVENUECAT_KEY to enable restore.'
      );
      return;
    }

    const restored = await restorePurchases();
    if (restored) {
      hapticSuccess();
      Alert.alert('✅ Success', 'Your purchases have been restored.');
      return;
    }

    Alert.alert('Not Found', 'No previous purchases found for this Apple ID.');
  };

  const guestRetentionLabel = (() => {
    if (!isGuest) return '';
    if (guestDaysRemaining === null) return 'Retention timer unavailable';
    if (guestDaysRemaining <= 0) return 'Guest data expired and was cleared';
    if (guestDaysRemaining === 1) return '1 day left before guest data auto-delete';
    return `${guestDaysRemaining} days left before guest data auto-delete`;
  })();

  return (
    <SafeAreaView className="flex-1 bg-[#000000]">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-4 pb-6">
          <Text className="text-2xl font-bold text-white">Settings</Text>
          <Text className="text-slate-500 mt-1">Manage your account & preferences</Text>
        </View>

        {/* Guest CTA Card */}
        {isGuest && (
          <Animated.View entering={FadeInUp.springify()} className="mx-5 mb-5">
            <LinearGradient
              colors={['#7C3AED', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-3xl p-5"
            >
              <View className="flex-row items-center mb-3">
                <Ionicons name="rocket" size={24} color="#fff" />
                <Text className="ml-2 text-lg font-bold text-white">Unlock Full Access</Text>
              </View>
              <Text className="text-violet-200 text-sm mb-4">
                Create an account to save your progress, unlock unlimited scans, and track your glow-up journey.
              </Text>
              <View className="flex-row gap-3">
                <Pressable
                  className="flex-1 rounded-xl bg-white py-3"
                  style={{ minHeight: 48 }}
                  onPress={() => {
                    hapticSelection();
                    router.push('/(auth)/register');
                  }}
                >
                  <Text className="text-center font-bold text-violet-600">Sign Up</Text>
                </Pressable>
                <Pressable
                  className="flex-1 rounded-xl border-2 border-white/30 py-3"
                  style={{ minHeight: 48 }}
                  onPress={() => {
                    hapticSelection();
                    router.push('/(auth)/login');
                  }}
                >
                  <Text className="text-center font-semibold text-white">Sign In</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Guest Retention Banner */}
        {isGuest && (
          <Animated.View
            entering={FadeInUp.delay(100).springify()}
            className={`mx-5 mb-5 rounded-2xl border px-4 py-3 ${
              (guestDaysRemaining ?? 30) <= 7
                ? 'border-amber-500/30 bg-amber-500/10'
                : 'border-violet-500/30 bg-violet-500/10'
            }`}
          >
            <View className="flex-row items-center">
              <Ionicons
                name="time-outline"
                size={20}
                color={(guestDaysRemaining ?? 30) <= 7 ? '#F59E0B' : '#8B5CF6'}
              />
              <Text
                className={`ml-2 flex-1 text-sm ${
                  (guestDaysRemaining ?? 30) <= 7 ? 'text-amber-300' : 'text-violet-300'
                }`}
              >
                {guestRetentionLabel}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Account Section */}
        {!isGuest && (
          <Animated.View entering={FadeInUp.delay(100).springify()} className="px-5 mb-5">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
              Account
            </Text>
            <View className="rounded-2xl bg-[#0F172A] border border-slate-800/50 overflow-hidden">
              <View className="flex-row items-center px-4" style={{ minHeight: 64 }}>
                <View className="h-12 w-12 items-center justify-center rounded-full bg-violet-500/20">
                  <Ionicons name="person" size={24} color="#8B5CF6" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-xs text-slate-500">Email</Text>
                  <Text className="text-base font-medium text-white">{user?.email}</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Security Section */}
        {!isGuest && (
          <Animated.View entering={FadeInUp.delay(150).springify()} className="px-5 mb-5">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
              Security
            </Text>
            <View className="rounded-2xl bg-[#0F172A] border border-slate-800/50 overflow-hidden">
              {biometricType && (
                <View className="flex-row items-center justify-between px-4 border-b border-slate-800/50">
                  <View className="flex-row items-center flex-1" style={{ minHeight: 56 }}>
                    <View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15">
                      <Ionicons name="finger-print" size={SIZES.iconSize - 2} color="#10B981" />
                    </View>
                    <View className="ml-3">
                      <Text className="text-base text-white">{biometricType}</Text>
                      <Text className="text-xs text-slate-500">Use to unlock the app</Text>
                    </View>
                  </View>
                  <Switch
                    value={biometricEnabled}
                    onValueChange={(val) => {
                      hapticSelection();
                      setBiometricEnabled(val);
                    }}
                    trackColor={{ false: '#334155', true: '#10B981' }}
                    thumbColor={biometricEnabled ? '#ffffff' : '#94a3b8'}
                  />
                </View>
              )}
              <SettingsRow icon="log-out-outline" label="Sign Out" onPress={logout} isLast />
            </View>
          </Animated.View>
        )}

        {/* Purchases Section */}
        <Animated.View entering={FadeInUp.delay(200).springify()} className="px-5 mb-5">
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
            Purchases
          </Text>
          <View className="rounded-2xl bg-[#0F172A] border border-slate-800/50 overflow-hidden">
            <SettingsRow icon="card-outline" label="Restore Purchases" onPress={handleRestorePurchases} isLast />
          </View>
        </Animated.View>

        {/* App Section */}
        <Animated.View entering={FadeInUp.delay(250).springify()} className="px-5 mb-5">
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
            App
          </Text>
          <View className="rounded-2xl bg-[#0F172A] border border-slate-800/50 overflow-hidden">
            <SettingsRow
              icon="shield-checkmark-outline"
              label="Privacy Policy"
              onPress={() => Linking.openURL('https://mewify.app/privacy')}
            />
            <SettingsRow
              icon="document-text-outline"
              label="Terms of Service"
              onPress={() => Linking.openURL('https://mewify.app/terms')}
            />
            <SettingsRow icon="information-circle-outline" label="Version" value="1.0.0" showChevron={false} isLast />
          </View>
        </Animated.View>

        {/* Danger Zone */}
        {!isGuest && (
          <Animated.View entering={FadeInUp.delay(300).springify()} className="px-5 mb-10">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
              Danger Zone
            </Text>
            <View className="rounded-2xl bg-[#0F172A] border border-red-500/20 overflow-hidden">
              <SettingsRow
                icon="trash-outline"
                label="Delete Account"
                onPress={confirmDelete}
                color="#EF4444"
                showChevron={false}
                isLast
              />
            </View>
          </Animated.View>
        )}

        <View className="h-10" />
      </ScrollView>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Deletion"
      >
        <View className="flex-row items-center mb-4 px-3 py-3 rounded-xl bg-red-500/10">
          <Ionicons name="warning" size={20} color="#EF4444" />
          <Text className="ml-2 flex-1 text-sm text-red-400">
            This action cannot be undone.
          </Text>
        </View>
        <Text className="mb-4 text-sm text-slate-400">
          Enter your password to confirm account deletion.
        </Text>
        <View className="mb-4">
          <Input
            placeholder="Your password"
            value={deletePassword}
            onChangeText={setDeletePassword}
            secureTextEntry
            dark
          />
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setShowDeleteModal(false)}
            />
          </View>
          <View className="flex-1">
            <Button
              title="Delete"
              variant="destructive"
              onPress={handleDeleteAccount}
              isLoading={isDeleting}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
