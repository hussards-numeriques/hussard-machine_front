import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../contexts/useAuth';

interface OneSignalPlugin {
  initialize(appId: string): void;
  login(externalId: string): void;
  logout(): void;
  Notifications: { requestPermission(fallbackToSettings?: boolean): Promise<boolean> };
}

declare global {
  interface Window {
    plugins?: { OneSignal?: OneSignalPlugin };
  }
}

export const PushRegistration: React.FC = () => {
  const { user, isLoading } = useAuth();
  const userId = user?.id ?? null;

  useEffect(() => {
    const appId: unknown = import.meta.env.VITE_ONESIGNAL_APP_ID;
    if (!Capacitor.isNativePlatform() || isLoading || typeof appId !== 'string') {
      return;
    }
    const register = () => {
      const oneSignal = window.plugins?.OneSignal;
      if (!oneSignal) {
        return;
      }
      oneSignal.initialize(appId);
      if (userId) {
        oneSignal.login(userId);
        void oneSignal.Notifications.requestPermission(false);
      } else {
        oneSignal.logout();
      }
    };
    document.addEventListener('deviceready', register, { once: true });
    return () => document.removeEventListener('deviceready', register);
  }, [userId, isLoading]);

  return null;
};
