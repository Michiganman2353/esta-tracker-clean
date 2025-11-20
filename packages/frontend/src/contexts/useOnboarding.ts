/**
 * App Component
 *
 * This is the root component for the ESTA Tracker web application.
 * It manages authentication state, routes, and global error handling.
 *
 * Features:
 * - Checks for authenticated user on mount, handles loading and network errors
 * - Displays skeleton dashboard and retry logic on connection issues
 * - Provides public routes for login, registration, and pricing
 * - Provides protected routes for authenticated users:
 *   - Dashboard, EmployeeDashboard, EmployerDashboard, AuditLog, Settings, etc.
 * - Implements conditional navigation based on user authentication
 * - Integrates maintenance mode notification
 *
 * Uses:
 * - React Router for client-side navigation
 * - API client for user authentication
 * - Design system components for consistent UI feedback
 *
 * All application pages and layout are controlled from here.
 */

import { useContext } from 'react';
import { OnboardingContext } from './OnboardingContext';

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
