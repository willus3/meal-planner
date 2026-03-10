import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../ui/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Wraps protected routes. Shows a loading spinner while Firebase resolves the
 * initial auth state, then redirects to /login if no user is signed in.
 *
 * Why is the loading check important? When the app first loads, Firebase needs
 * a moment to check if the user has an active session. Without this check, every
 * user would briefly see the login page on refresh — even if they're already logged in.
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
