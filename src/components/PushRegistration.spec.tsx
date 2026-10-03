import { render } from '@testing-library/react';
import { Capacitor } from '@capacitor/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PushRegistration } from './PushRegistration';

const auth = vi.hoisted(() => ({ user: null as { id: string } | null, isLoading: false }));
vi.mock('../contexts/useAuth', () => ({ useAuth: () => auth }));

const oneSignal = {
  initialize: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  Notifications: { requestPermission: vi.fn().mockResolvedValue(true) },
};

const renderReady = () => {
  const view = render(<PushRegistration />);
  document.dispatchEvent(new Event('deviceready'));
  return view;
};

describe('PushRegistration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_ONESIGNAL_APP_ID', 'app-id');
    window.plugins = { OneSignal: oneSignal };
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
  });

  it('links the device to the logged-in user and asks for notification permission', () => {
    auth.user = { id: 'user-1' };

    renderReady();

    expect(oneSignal.initialize).toHaveBeenCalledWith('app-id');
    expect(oneSignal.login).toHaveBeenCalledWith('user-1');
    expect(oneSignal.Notifications.requestPermission).toHaveBeenCalled();
  });

  it('unlinks the device when nobody is logged in', () => {
    auth.user = null;

    renderReady();

    expect(oneSignal.logout).toHaveBeenCalled();
    expect(oneSignal.login).not.toHaveBeenCalled();
  });

  it('does nothing on the web', () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
    auth.user = { id: 'user-1' };

    renderReady();

    expect(oneSignal.initialize).not.toHaveBeenCalled();
  });
});
