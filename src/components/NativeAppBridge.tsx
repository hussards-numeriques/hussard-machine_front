import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { SplashScreen } from '@capacitor/splash-screen';
import { appUrlToCallbackPath } from '../services/AuthClient';

export const NativeAppBridge: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    void SplashScreen.hide();
    const listener = App.addListener('appUrlOpen', ({ url }) => {
      const path = appUrlToCallbackPath(url);
      if (path) {
        void Browser.close();
        navigate(path, { replace: true });
      }
    });
    return () => {
      void listener.then((l) => l.remove());
    };
  }, [navigate]);

  return null;
};
