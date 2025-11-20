/**
 * Tests for Zustand App Store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from './appStore';

describe('AppStore', () => {
  beforeEach(() => {
    // Clear store before each test
    useAppStore.setState({
      notifications: [],
      isLoading: false,
      loadingMessage: null,
      edgeConfig: null,
    });
  });

  describe('Notifications', () => {
    it('should add notification with auto-generated id and timestamp', () => {
      const { addNotification } = useAppStore.getState();
      
      addNotification({
        type: 'success',
        message: 'Test notification',
      });

      const notifications = useAppStore.getState().notifications;
      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toMatchObject({
        type: 'success',
        message: 'Test notification',
      });
      expect(notifications[0].id).toBeDefined();
      expect(notifications[0].timestamp).toBeDefined();
    });

    it('should remove notification by id', () => {
      const { addNotification, removeNotification } = useAppStore.getState();
      
      addNotification({
        type: 'info',
        message: 'Test notification',
      });

      const notifications = useAppStore.getState().notifications;
      const notificationId = notifications[0].id;
      
      removeNotification(notificationId);
      
      expect(useAppStore.getState().notifications).toHaveLength(0);
    });

    it('should clear all notifications', () => {
      const { addNotification, clearNotifications } = useAppStore.getState();
      
      addNotification({ type: 'success', message: 'Test 1' });
      addNotification({ type: 'error', message: 'Test 2' });
      
      expect(useAppStore.getState().notifications).toHaveLength(2);
      
      clearNotifications();
      
      expect(useAppStore.getState().notifications).toHaveLength(0);
    });

    it('should auto-remove notification after duration', async () => {
      vi.useFakeTimers();
      
      const { addNotification } = useAppStore.getState();
      
      addNotification({
        type: 'warning',
        message: 'Auto-remove test',
        duration: 1000,
      });

      expect(useAppStore.getState().notifications).toHaveLength(1);
      
      vi.advanceTimersByTime(1000);
      
      expect(useAppStore.getState().notifications).toHaveLength(0);
      
      vi.useRealTimers();
    });

    it('should not auto-remove notification when duration is 0', async () => {
      vi.useFakeTimers();
      
      const { addNotification } = useAppStore.getState();
      
      addNotification({
        type: 'info',
        message: 'Persistent notification',
        duration: 0,
      });

      expect(useAppStore.getState().notifications).toHaveLength(1);
      
      vi.advanceTimersByTime(10000);
      
      expect(useAppStore.getState().notifications).toHaveLength(1);
      
      vi.useRealTimers();
    });
  });

  describe('Loading State', () => {
    it('should set loading state without message', () => {
      const { setLoading } = useAppStore.getState();
      
      setLoading(true);
      
      expect(useAppStore.getState().isLoading).toBe(true);
      expect(useAppStore.getState().loadingMessage).toBeNull();
    });

    it('should set loading state with message', () => {
      const { setLoading } = useAppStore.getState();
      
      setLoading(true, 'Processing...');
      
      expect(useAppStore.getState().isLoading).toBe(true);
      expect(useAppStore.getState().loadingMessage).toBe('Processing...');
    });

    it('should clear loading state', () => {
      const { setLoading } = useAppStore.getState();
      
      setLoading(true, 'Loading...');
      setLoading(false);
      
      expect(useAppStore.getState().isLoading).toBe(false);
      expect(useAppStore.getState().loadingMessage).toBeNull();
    });
  });

  describe('User Preferences', () => {
    it('should have default preferences', () => {
      const preferences = useAppStore.getState().preferences;
      
      expect(preferences).toEqual({
        theme: 'system',
        emailNotifications: true,
        pushNotifications: true,
        compactView: false,
        sidebarCollapsed: false,
      });
    });

    it('should update preferences partially', () => {
      const { updatePreferences } = useAppStore.getState();
      
      updatePreferences({ theme: 'dark' });
      
      expect(useAppStore.getState().preferences.theme).toBe('dark');
      expect(useAppStore.getState().preferences.emailNotifications).toBe(true);
    });

    it('should update multiple preferences at once', () => {
      const { updatePreferences } = useAppStore.getState();
      
      updatePreferences({
        compactView: true,
        sidebarCollapsed: true,
      });
      
      const preferences = useAppStore.getState().preferences;
      expect(preferences.compactView).toBe(true);
      expect(preferences.sidebarCollapsed).toBe(true);
    });
  });

  describe('Edge Config', () => {
    it('should set edge config with timestamp', () => {
      const { setEdgeConfig } = useAppStore.getState();
      
      const config = {
        maintenanceMode: false,
        maxUploadSize: 10485760,
        supportedFileTypes: ['pdf', 'jpg', 'png'],
        apiRateLimit: 100,
      };
      
      setEdgeConfig(config);
      
      const edgeConfig = useAppStore.getState().edgeConfig;
      expect(edgeConfig).toMatchObject(config);
      expect(edgeConfig?.lastFetched).toBeDefined();
    });

    it('should clear edge config', () => {
      const { setEdgeConfig, clearEdgeConfig } = useAppStore.getState();
      
      setEdgeConfig({
        maintenanceMode: false,
        maxUploadSize: 10485760,
        supportedFileTypes: ['pdf'],
        apiRateLimit: 100,
      });
      
      clearEdgeConfig();
      
      expect(useAppStore.getState().edgeConfig).toBeNull();
    });
  });

  describe('Selectors', () => {
    it('should select notifications', () => {
      const { addNotification } = useAppStore.getState();
      
      addNotification({ type: 'success', message: 'Test' });
      
      const notifications = useAppStore.getState().notifications;
      expect(notifications).toHaveLength(1);
    });

    it('should select loading state', () => {
      const { setLoading } = useAppStore.getState();
      
      setLoading(true, 'Loading...');
      
      const { isLoading, loadingMessage } = useAppStore.getState();
      expect(isLoading).toBe(true);
      expect(loadingMessage).toBe('Loading...');
    });

    it('should select preferences', () => {
      const { updatePreferences } = useAppStore.getState();
      
      updatePreferences({ theme: 'dark' });
      
      const preferences = useAppStore.getState().preferences;
      expect(preferences.theme).toBe('dark');
    });

    it('should select edge config', () => {
      const { setEdgeConfig } = useAppStore.getState();
      
      const config = {
        maintenanceMode: true,
        maxUploadSize: 5242880,
        supportedFileTypes: ['pdf'],
        apiRateLimit: 50,
      };
      
      setEdgeConfig(config);
      
      const edgeConfig = useAppStore.getState().edgeConfig;
      expect(edgeConfig?.maintenanceMode).toBe(true);
    });
  });
});
