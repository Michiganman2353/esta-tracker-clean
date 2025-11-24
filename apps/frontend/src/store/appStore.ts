/**
 * App Store using Zustand
 * 
 * Centralized state management for global application state that doesn't require
 * Context API overhead. Uses Zustand for better performance and simpler API.
 * 
 * Features:
 * - User preferences and UI state
 * - Notification management
 * - Loading states
 * - Edge config caching
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  timestamp: number;
}

// User preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  pushNotifications: boolean;
  compactView: boolean;
  sidebarCollapsed: boolean;
}

// Edge config cache
export interface EdgeConfig {
  maintenanceMode: boolean;
  maxUploadSize: number;
  supportedFileTypes: string[];
  apiRateLimit: number;
  lastFetched?: number;
}

interface AppState {
  // UI State
  notifications: Notification[];
  isLoading: boolean;
  loadingMessage: string | null;
  
  // User Preferences
  preferences: UserPreferences;
  
  // Edge Config Cache
  edgeConfig: EdgeConfig | null;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  setLoading: (isLoading: boolean, message?: string) => void;
  
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  
  setEdgeConfig: (config: EdgeConfig) => void;
  clearEdgeConfig: () => void;
}

// Default preferences
const defaultPreferences: UserPreferences = {
  theme: 'system',
  emailNotifications: true,
  pushNotifications: true,
  compactView: false,
  sidebarCollapsed: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial State
      notifications: [],
      isLoading: false,
      loadingMessage: null,
      preferences: defaultPreferences,
      edgeConfig: null,
      
      // Notification Actions
      addNotification: (notification) => {
        const id = `notification-${Date.now()}-${Math.random()}`;
        const newNotification: Notification = {
          ...notification,
          id,
          timestamp: Date.now(),
        };
        
        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));
        
        // Auto-remove after duration (default 5 seconds)
        if (notification.duration !== 0) {
          setTimeout(() => {
            set((state) => ({
              notifications: state.notifications.filter((n) => n.id !== id),
            }));
          }, notification.duration || 5000);
          
          // Note: In a real implementation, we'd want to track timeouts
          // to allow manual clearing before auto-removal
        }
      },
      
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },
      
      clearNotifications: () => {
        set({ notifications: [] });
      },
      
      // Loading Actions
      setLoading: (isLoading, message) => {
        set({ isLoading, loadingMessage: message || null });
      },
      
      // Preferences Actions
      updatePreferences: (preferences) => {
        set((state) => ({
          preferences: { ...state.preferences, ...preferences },
        }));
      },
      
      // Edge Config Actions
      setEdgeConfig: (config) => {
        set({ 
          edgeConfig: { 
            ...config, 
            lastFetched: Date.now() 
          } 
        });
      },
      
      clearEdgeConfig: () => {
        set({ edgeConfig: null });
      },
    }),
    {
      name: 'esta-tracker-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist preferences and edge config
      partialize: (state) => ({
        preferences: state.preferences,
        edgeConfig: state.edgeConfig,
      }),
    }
  )
);

// Selectors for optimized re-renders
export const useNotifications = () => useAppStore((state) => state.notifications);
export const useLoading = () => useAppStore((state) => ({ 
  isLoading: state.isLoading, 
  message: state.loadingMessage 
}));
export const usePreferences = () => useAppStore((state) => state.preferences);
export const useEdgeConfig = () => useAppStore((state) => state.edgeConfig);
