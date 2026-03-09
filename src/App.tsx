import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RecipeDiscovery from './pages/RecipeDiscovery';
import MealPlanner from './pages/MealPlanner';
import ShoppingList from './pages/ShoppingList';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="recipes" element={<RecipeDiscovery />} />
        <Route path="planner" element={<MealPlanner />} />
        <Route path="shopping" element={<ShoppingList />} />
      </Route>
    </Routes>
  );
}

export default App;
