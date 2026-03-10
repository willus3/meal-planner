import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ChefHat } from 'lucide-react';

/**
 * Public login page — the only page accessible without authentication.
 * Redirects to the dashboard automatically if the user is already signed in.
 */
export default function Login() {
  const { user, loading, error, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // If the user is already authenticated (e.g. returning visitor), skip the login page
  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm text-center space-y-6">

        {/* Logo + Title */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <ChefHat className="text-primary w-8 h-8" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Meal Planner Pro</h1>
          <p className="text-gray-500 text-sm">
            Sign in to start planning your meals for the week.
          </p>
        </div>

        {/* Error message — uses role="alert" so screen readers announce it */}
        {error && (
          <div role="alert" className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg text-left">
            {error}
          </div>
        )}

        {/* Google Sign-In button */}
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Sign in with Google"
        >
          {/* Google "G" logo as inline SVG — no external file needed */}
          <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="text-xs text-gray-400">
          Your data is private and only accessible to you.
        </p>
      </div>
    </div>
  );
}
