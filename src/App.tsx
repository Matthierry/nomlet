import { useEffect, useMemo, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { fetchMeals } from './lib/api';
import { normalizeMealAssets } from './lib/normalizeMeals';
import type { Meal } from './types';
import { useNomletState } from './lib/useNomletState';
import { MealsPage } from './pages/MealsPage';
import { BasketPage } from './pages/BasketPage';
import { ListPage } from './pages/ListPage';
import { SettingsPage } from './pages/SettingsPage';

const App = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMeals = async () => {
      try {
        const data = await fetchMeals();
        setMeals(normalizeMealAssets(data));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error while loading meals.');
      } finally {
        setLoading(false);
      }
    };

    void loadMeals();
  }, []);

  const state = useNomletState(meals);

  const context = useMemo(
    () => ({
      ...state,
      meals,
      loading,
      error,
      ingredientCount: state.consolidated.length,
    }),
    [state, meals, loading, error],
  );

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout context={context} />}>
          <Route path="/" element={<Navigate to="/meals" replace />} />
          <Route path="/meals" element={<MealsPage />} />
          <Route path="/basket" element={<BasketPage />} />
          <Route path="/list" element={<ListPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;
