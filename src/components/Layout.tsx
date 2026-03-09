import { Outlet, Link } from 'react-router-dom';
import { ChefHat, Calendar, ShoppingCart, UserCircle } from 'lucide-react';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 py-4 px-6 flex justify-between items-center sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl">
          <ChefHat size={28} />
          <span>Meal Planner Pro</span>
        </Link>
        <nav className="flex gap-6 items-center">
          <Link to="/recipes" className="text-gray-600 hover:text-primary transition-colors">Recipes</Link>
          <Link to="/planner" className="flex items-center gap-1 text-gray-600 hover:text-primary transition-colors">
            <Calendar size={18} />
            Planner
          </Link>
          <Link to="/shopping" className="flex items-center gap-1 text-gray-600 hover:text-primary transition-colors">
            <ShoppingCart size={18} />
            List
          </Link>
          <button className="text-gray-500 hover:text-primary transition-colors">
            <UserCircle size={28} />
          </button>
        </nav>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
