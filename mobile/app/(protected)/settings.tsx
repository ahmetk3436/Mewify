import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert, Switch, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { isBiometricAvailable, getBiometricType } from '../../lib/biometrics';
import { hapticWarning, hapticMedium, hapticSelection } from '../../lib/haptics';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

function SettingsRow({ icon, label, value, onPress, color = '#ffffff', showChevron = true }: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  color?: string;
  showChevron?: boolean;
}) {
  return (
    <Pressable
      className="flex-row items-center px-4 py-3.5"
      onPress={() => {
        if (onPress) {
          hapticSelection();
          onPress();
        }
      }}
      disabled={!onPress}
    >
      <Ionicons name={icon as any} size={20} color={color === '#ffffff' ? '#9ca3af' : color} />
      <Text className="ml-3 flex-1 text-base" style={{ color }}>{label}</Text>
      {value && <Text className="mr-2 text-sm text-gray-500">{value}</Text>}
      {showChevron && onPress && <Ionicons name="chevron-forward" size={16} color="#4b5563" />}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { user, isGuest, logout, deleteAccount } = useAuth();
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
      'Delete Account',
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

  const handleRestorePurchases = () => {
    hapticMedium();
    Alert.alert('Restore Purchases', 'Checking for previous purchases...');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-4">
          <Text className="mb-6 text-2xl font-bold text-white">Settings</Text>

          {/* Guest CTA */}
          {isGuest && (
            <Pressable
              className="mb-6 rounded-2xl bg-blue-600 p-5"
              onPress={() => {
                hapticSelection();
                router.push('/(auth)/register');
              }}
            >
              <Text className="text-lg font-bold text-white">Create Your Account</Text>
              <Text className="mt-1 text-sm text-blue-200">
                Save your progress, unlock unlimited scans, and track your glow-up journey.
              </Text>
              <View className="mt-3 flex-row gap-3">
                <Pressable
                  className="rounded-xl bg-white px-4 py-2"
                  onPress={() => router.push('/(auth)/register')}
                >
                  <Text className="font-semibold text-blue-600">Sign Up</Text>
                </Pressable>
                <Pressable
                  className="rounded-xl border border-blue-400 px-4 py-2"
                  onPress={() => router.push('/(auth)/login')}
                >
                  <Text className="font-semibold text-blue-200">Sign In</Text>
                </Pressable>
              </View>
            </Pressable>
          )}

          {/* Account Section */}
          {!isGuest && (
            <>
              <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Account
              </Text>
              <View className="mb-6 rounded-2xl bg-gray-900 border border-gray-800">
                <View className="px-4 py-3.5">
                  <Text className="text-xs text-gray-500">Email</Text>
                  <Text className="mt-0.5 text-base font-medium text-white">{user?.email}</Text>
                </View>
              </View>
            </>
          )}

          {/* Security Section */}
          {!isGuest && (
            <>
              <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Security
              </Text>
              <View className="mb-6 rounded-2xl bg-gray-900 border border-gray-800">
                {biometricType && (
                  <View className="flex-row items-center justify-between border-b border-gray-800 px-4 py-3.5">
                    <View className="flex-row items-center flex-1">
                      <Ionicons name="finger-print" size={20} color="#9ca3af" />
                      <View className="ml-3">
                        <Text className="text-base text-white">{biometricType}</Text>
                        <Text className="text-xs text-gray-500">Use to unlock the app</Text>
                      </View>
                    </View>
                    <Switch
                      value={biometricEnabled}
                      onValueChange={setBiometricEnabled}
                      trackColor={{ true: '#3b82f6' }}
                    />
                  </View>
                )}
                <SettingsRow icon="log-out-outline" label="Sign Out" onPress={logout} />
              </View>
            </>
          )}

          {/* Purchases */}
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Purchases
          </Text>
          <View className="mb-6 rounded-2xl bg-gray-900 border border-gray-800">
            <SettingsRow icon="card-outline" label="Restore Purchases" onPress={handleRestorePurchases} />
          </View>

          {/* App Section */}
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            App
          </Text>
          <View className="mb-6 rounded-2xl bg-gray-900 border border-gray-800">
            <SettingsRow
              icon="shield-checkmark-outline"
              label="Privacy Policy"
              onPress={() => Linking.openURL('https://mewify.app/privacy')}
            />
            <View className="mx-4 border-b border-gray-800" />
            <SettingsRow
              icon="document-text-outline"
              label="Terms of Service"
              onPress={() => Linking.openURL('https://mewify.app/terms')}
            />
            <View className="mx-4 border-b border-gray-800" />
            <SettingsRow icon="information-circle-outline" label="Version" value="1.0.0" showChevron={false} />
          </View>

          {/* Danger Zone */}
          {!isGuest && (
            <>
              <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Danger Zone
              </Text>
              <View className="mb-8 rounded-2xl bg-gray-900 border border-red-900/50">
                <SettingsRow
                  icon="trash-outline"
                  label="Delete Account"
                  onPress={confirmDelete}
                  color="#ef4444"
                  showChevron={false}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Deletion"
      >
        <Text className="mb-4 text-sm text-gray-400">
          Enter your password to confirm account deletion. This cannot be undone.
        </Text>
        <View className="mb-4">
          <Input
            placeholder="Your password"
            value={deletePassword}
            onChangeText={setDeletePassword}
            secureTextEntry
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
