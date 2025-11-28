import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';
import * as authService from '../../lib/authService';
import type { User } from '../../types';

// Mock modules
vi.mock('../../lib/authService');

// Mock the Firebase service - Login.tsx may import from @/services/firebase
vi.mock('@/services/firebase', () => ({
  auth: {},
  db: {},
  storage: {},
  app: {},
}));

// Mock @esta/firebase
vi.mock('@esta/firebase', () => ({
  app: {},
  auth: { currentUser: null },
  db: {},
  storage: {},
  analytics: null,
  createEmployerProfile: vi.fn(),
  getEmployerProfileByCode: vi.fn(),
  linkEmployeeToEmployer: vi.fn(),
}));

vi.mock('../../lib/api', () => ({
  apiClient: {
    login: vi.fn(),
    setToken: vi.fn(),
  },
}));

const mockOnLogin = vi.fn();

const renderLogin = (initialEntries = ['/login']) => {
  return render(
    <MemoryRouter
      initialEntries={initialEntries}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Login onLogin={mockOnLogin} />
    </MemoryRouter>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any window state modifications
    window.history.replaceState({}, '', '/');
  });

  describe('Rendering', () => {
    it('should render login form', () => {
      renderLogin();

      expect(screen.getByText('Michigan ESTA Tracker')).toBeInTheDocument();
      expect(
        screen.getByText('Earned Sick Time Act Compliance')
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /sign in/i })
      ).toBeInTheDocument();
    });

    it('should render register link', () => {
      renderLogin();

      const registerLink = screen.getByText(
        /Don't have an account\? Register/i
      );
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('should show verified message when verified param is true', () => {
      renderLogin(['/login?verified=true']);

      expect(
        screen.getByText(/Email verified successfully/i)
      ).toBeInTheDocument();
    });

    it('should not show verified message when verified param is false', () => {
      renderLogin(['/login?verified=false']);

      expect(
        screen.queryByText(/Email verified successfully/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require email field', () => {
      renderLogin();

      const emailInput = screen.getByPlaceholderText('Email address');
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should require password field', () => {
      renderLogin();

      const passwordInput = screen.getByPlaceholderText('Password');
      expect(passwordInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should update email input value', () => {
      renderLogin();

      const emailInput = screen.getByPlaceholderText(
        'Email address'
      ) as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      expect(emailInput.value).toBe('test@example.com');
    });

    it('should update password input value', () => {
      renderLogin();

      const passwordInput = screen.getByPlaceholderText(
        'Password'
      ) as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      expect(passwordInput.value).toBe('password123');
    });
  });

  describe('Firebase Authentication', () => {
    it('should call signIn when Firebase is configured', async () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'employee',
        employerSize: 'large',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      vi.mocked(authService.signIn).mockResolvedValue(mockUser);

      renderLogin();

      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(authService.signIn).toHaveBeenCalledWith(
          'test@example.com',
          'password123'
        );
      });

      expect(mockOnLogin).toHaveBeenCalledWith(mockUser);
    });

    it('should show loading state during authentication', async () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'employee',
        employerSize: 'large',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      vi.mocked(authService.signIn).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockUser), 100))
      );

      renderLogin();

      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalled();
      });
    });

    it('should handle Firebase authentication errors', async () => {
      vi.mocked(authService.signIn).mockRejectedValue(
        new Error('Invalid credentials')
      );

      renderLogin();

      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      expect(mockOnLogin).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display network error message', async () => {
      vi.mocked(authService.signIn).mockRejectedValue({ isNetworkError: true });

      renderLogin();

      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/unable to connect to server/i)
        ).toBeInTheDocument();
      });
    });

    it('should display 401 unauthorized error', async () => {
      vi.mocked(authService.signIn).mockRejectedValue({ status: 401 });

      renderLogin();

      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/invalid email or password/i)
        ).toBeInTheDocument();
      });
    });

    it('should display 403 forbidden error for pending approval', async () => {
      vi.mocked(authService.signIn).mockRejectedValue({ status: 403 });

      renderLogin();

      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/account is pending approval/i)
        ).toBeInTheDocument();
      });
    });

    it('should display generic error for 4xx errors', async () => {
      vi.mocked(authService.signIn).mockRejectedValue({
        status: 400,
        message: 'Bad request',
      });

      renderLogin();

      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Bad request')).toBeInTheDocument();
      });
    });

    it('should display generic error for 5xx errors', async () => {
      vi.mocked(authService.signIn).mockRejectedValue({ status: 500 });

      renderLogin();

      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/server error.*try again later/i)
        ).toBeInTheDocument();
      });
    });

    it('should clear error when form is resubmitted', async () => {
      vi.mocked(authService.signIn).mockRejectedValueOnce(
        new Error('First error')
      );

      renderLogin();

      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // First submission with error
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      // Second submission should clear error first
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'employee',
        employerSize: 'large',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      vi.mocked(authService.signIn).mockResolvedValue(mockUser);
      fireEvent.click(submitButton);

      // Error should be cleared immediately
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form structure', () => {
      renderLogin();

      const form = screen
        .getByRole('button', { name: /sign in/i })
        .closest('form');
      expect(form).toBeInTheDocument();
    });

    it('should have proper input labels via placeholders', () => {
      renderLogin();

      expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    });

    it('should have autocomplete attributes', () => {
      renderLogin();

      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');

      expect(emailInput).toHaveAttribute('autocomplete', 'email');
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });
  });
});
