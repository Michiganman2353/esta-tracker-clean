// src/components/session/index.js
import AuthUserContext from './context';
import withAuthentication from './withAuthentication';
import withAuthorization from './withAuthorization';
import withEmailVerification from './withEmailVerification';
import { useAuth } from './context';

// Types
export interface AuthUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  roles: Record<string, string>;
  // Add more as needed
}

// Default export (for legacy)
export default {
  AuthUserContext,
  withAuthentication,
  withAuthorization,
  withEmailVerification,
  useAuth,
};

// Named exports
export {
  AuthUserContext,
  withAuthentication,
  withAuthorization,
  withEmailVerification,
  useAuth,
  AuthUser as typeAuthUser, // Type export
};