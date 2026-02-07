import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';
import {
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
} from '../lib/storage';
import { hapticSuccess, hapticError } from '../lib/haptics';
import type { User, AuthResponse } from '../types/auth';

const MAX_GUEST_SCANS = 3;

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isGuest: boolean;
  guestUsageCount: number;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithApple: (identityToken: string, authCode: string, fullName?: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  canUseFeature: () => boolean;
  incrementGuestUsage: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [guestUsageCount, setGuestUsageCount] = useState(0);

  const isAuthenticated = user !== null;

  // Restore session on mount
  useEffect(() => {
    const restore = async () => {
      try {
        // Check guest mode first
        const guestMode = await AsyncStorage.getItem('guest_mode');
        if (guestMode === 'true') {
          const count = await AsyncStorage.getItem('guest_usage_count');
          setIsGuest(true);
          setGuestUsageCount(count ? parseInt(count, 10) : 0);
          setIsLoading(false);
          return;
        }

        const token = await getAccessToken();
        if (token) {
          const { data } = await api.get('/health');
          if (data.status === 'ok') {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUser({ id: payload.sub, email: payload.email });
          }
        }
      } catch {
        await clearTokens();
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', {
        email,
        password,
      });
      await setTokens(data.access_token, data.refresh_token);
      setUser(data.user);
      // Clear guest mode on login
      await AsyncStorage.multiRemove(['guest_mode', 'guest_usage_count']);
      setIsGuest(false);
      setGuestUsageCount(0);
      hapticSuccess();
    } catch (err) {
      hapticError();
      throw err;
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/register', {
        email,
        password,
      });
      await setTokens(data.access_token, data.refresh_token);
      setUser(data.user);
      await AsyncStorage.multiRemove(['guest_mode', 'guest_usage_count']);
      setIsGuest(false);
      setGuestUsageCount(0);
      hapticSuccess();
    } catch (err) {
      hapticError();
      throw err;
    }
  }, []);

  const loginWithApple = useCallback(
    async (identityToken: string, authCode: string, fullName?: string, email?: string) => {
      try {
        const { data } = await api.post<AuthResponse>('/auth/apple', {
          identity_token: identityToken,
          authorization_code: authCode,
          full_name: fullName,
          email,
        });
        await setTokens(data.access_token, data.refresh_token);
        setUser(data.user);
        await AsyncStorage.multiRemove(['guest_mode', 'guest_usage_count']);
        setIsGuest(false);
        setGuestUsageCount(0);
        hapticSuccess();
      } catch (err) {
        hapticError();
        throw err;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken });
      }
    } catch {
      // Ignore logout API errors
    } finally {
      await clearTokens();
      setUser(null);
    }
  }, []);

  const deleteAccount = useCallback(
    async (password?: string) => {
      await api.delete('/auth/account', {
        data: { password: password || '' },
      });
      await clearTokens();
      setUser(null);
      hapticSuccess();
    },
    []
  );

  const continueAsGuest = useCallback(async () => {
    await AsyncStorage.setItem('guest_mode', 'true');
    await AsyncStorage.setItem('guest_usage_count', '0');
    setIsGuest(true);
    setGuestUsageCount(0);
    hapticSuccess();
  }, []);

  const canUseFeature = useCallback(() => {
    if (isAuthenticated) return true;
    if (isGuest) return guestUsageCount < MAX_GUEST_SCANS;
    return false;
  }, [isAuthenticated, isGuest, guestUsageCount]);

  const incrementGuestUsage = useCallback(async () => {
    const newCount = guestUsageCount + 1;
    setGuestUsageCount(newCount);
    await AsyncStorage.setItem('guest_usage_count', newCount.toString());
  }, [guestUsageCount]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        isGuest,
        guestUsageCount,
        user,
        login,
        register,
        loginWithApple,
        logout,
        deleteAccount,
        continueAsGuest,
        canUseFeature,
        incrementGuestUsage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
