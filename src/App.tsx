import { Link, useLocation, Routes, Route } from 'react-router-dom';
import { ChefHat, Calendar, ShoppingCart, User } from 'lucide-react';
import { cn } from './lib/utils';
import Dashboard from './pages/Dashboard';
import RecipeDiscovery from './pages/RecipeDiscovery';
import MealPlanner from './pages/MealPlanner';
import ShoppingList from './pages/ShoppingList';

function App() {
  const location = useLocation();

  const isCurrentPath = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      
      {/* Header/Nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <ChefHat size={24} className="text-primary" />
            Meal Planner Pro
          </Link>
          
          <nav className="flex items-center gap-1 sm:gap-4 md:gap-6">
            <Link 
              to="/recipes" 
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isCurrentPath('/recipes') ? "bg-primary/5 text-primary" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <ChefHat size={18} />
              <span className="hidden sm:inline">Recipes</span>
            </Link>
            <Link 
              to="/planner" 
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isCurrentPath('/planner') ? "bg-primary/5 text-primary" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <Calendar size={18} />
              <span className="hidden sm:inline">Planner</span>
            </Link>
            <Link 
              to="/shopping" 
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isCurrentPath('/shopping') ? "bg-primary/5 text-primary" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <ShoppingCart size={18} />
              <span className="hidden sm:inline">List</span>
            </Link>
            <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block"></div>
            <Link 
              to="/" 
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-full transition-colors border-2",
                isCurrentPath('/') ? "border-primary text-primary bg-primary/5" : "border-transparent text-gray-500 hover:bg-gray-100"
              )}
            >
              <User size={20} />
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/recipes" element={<RecipeDiscovery />} />
          <Route path="/planner" element={<MealPlanner />} />
          <Route path="/shopping" element={<ShoppingList />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
