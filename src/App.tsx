import { Link, useLocation, Routes, Route } from 'react-router-dom';
import { ChefHat, Calendar, ShoppingCart, User, History } from 'lucide-react';
import { cn } from './lib/utils';
import { useAuth } from './hooks/useAuth';
import AuthGuard from './components/auth/AuthGuard';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RecipeDiscovery from './pages/RecipeDiscovery';
import MealPlanner from './pages/MealPlanner';
import ShoppingList from './pages/ShoppingList';

function App() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const isCurrentPath = (path: string) => location.pathname === path;

  // /login is a public route — render it without the nav shell
  if (location.pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">

      {/* Header/Nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <ChefHat size={24} className="text-primary" aria-hidden="true" />
            Meal Planner Pro
          </Link>

          <nav className="flex items-center gap-1 sm:gap-4 md:gap-6" aria-label="Main navigation">
            <Link
              to="/recipes"
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isCurrentPath('/recipes') ? "bg-primary/5 text-primary" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
              aria-current={isCurrentPath('/recipes') ? 'page' : undefined}
            >
              <ChefHat size={18} aria-hidden="true" />
              <span className="hidden sm:inline">Recipes</span>
            </Link>
            <Link
              to="/planner"
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isCurrentPath('/planner') ? "bg-primary/5 text-primary" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
              aria-current={isCurrentPath('/planner') ? 'page' : undefined}
            >
              <Calendar size={18} aria-hidden="true" />
              <span className="hidden sm:inline">Planner</span>
            </Link>
            <Link
              to="/shopping"
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isCurrentPath('/shopping') ? "bg-primary/5 text-primary" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
              aria-current={isCurrentPath('/shopping') ? 'page' : undefined}
            >
              <ShoppingCart size={18} aria-hidden="true" />
              <span className="hidden sm:inline">List</span>
            </Link>
            <Link
              to="/history"
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isCurrentPath('/history') ? "bg-primary/5 text-primary" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
              aria-current={isCurrentPath('/history') ? 'page' : undefined}
            >
              <History size={18} aria-hidden="true" />
              <span className="hidden sm:inline">History</span>
            </Link>

            <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" aria-hidden="true" />

            {/* User avatar / sign-out */}
            {user && (
              <button
                onClick={signOut}
                title={`Sign out (${user.email})`}
                className={cn(
                  "w-9 h-9 flex items-center justify-center rounded-full transition-colors border-2",
                  isCurrentPath('/') ? "border-primary text-primary bg-primary/5" : "border-transparent text-gray-500 hover:bg-gray-100"
                )}
                aria-label={`Sign out — signed in as ${user.email}`}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName ?? 'User avatar'}
                    className="w-full h-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User size={20} aria-hidden="true" />
                )}
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content Area — all routes are protected by AuthGuard */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/recipes" element={<AuthGuard><RecipeDiscovery /></AuthGuard>} />
          <Route path="/planner" element={<AuthGuard><MealPlanner /></AuthGuard>} />
          <Route path="/shopping" element={<AuthGuard><ShoppingList /></AuthGuard>} />
          <Route path="/history" element={<AuthGuard><div className="text-center py-20 text-gray-400">Plan History — coming soon</div></AuthGuard>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
