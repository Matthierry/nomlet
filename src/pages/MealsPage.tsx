import { useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { MealCard } from '../components/MealCard';
import type { NomletContext } from '../lib/outlet-context';

export const MealsPage = () => {
  const { meals, basket, toggleBasket, loading, error } = useOutletContext<NomletContext>();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const filteredMeals = useMemo(
    () => meals.filter((meal) => meal.name.toLowerCase().includes(query.toLowerCase())),
    [meals, query],
  );

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Nomlet</h1>
        <p className="text-sm text-slate-500 dark:text-slate-200">Meals picked. Shop sorted.</p>
      </header>

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search meals"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none ring-nomlet-aqua focus:ring-2 dark:border-slate-600 dark:bg-[#667575]"
      />

      {loading && <p className="rounded-xl bg-white p-4 text-sm shadow-soft dark:bg-[#566565]">Loading meals...</p>}
      {error && <p className="rounded-xl bg-red-100 p-4 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filteredMeals.map((meal) => (
          <MealCard key={meal.id} meal={meal} inBasket={basket.includes(meal.id)} onToggle={toggleBasket} />
        ))}
      </div>

      {!loading && filteredMeals.length === 0 && (
        <p className="rounded-xl bg-white p-4 text-sm shadow-soft dark:bg-[#566565]">No meals match your search.</p>
      )}

      {basket.length > 0 && (
        <button
          onClick={() => navigate('/basket')}
          className="fixed bottom-20 left-4 right-4 mx-auto max-w-2xl rounded-2xl bg-nomlet-sage px-5 py-3 text-sm font-semibold text-white shadow-soft"
        >
          Review basket ({basket.length})
        </button>
      )}
    </section>
  );
};
