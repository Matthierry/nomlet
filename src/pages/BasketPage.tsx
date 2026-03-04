import { useNavigate, useOutletContext } from 'react-router-dom';
import type { NomletContext } from '../lib/outlet-context';

export const BasketPage = () => {
  const { selectedMeals, toggleBasket, ingredientCount } = useOutletContext<NomletContext>();
  const navigate = useNavigate();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Basket</h1>
      {selectedMeals.length === 0 ? (
        <p className="rounded-xl bg-white p-4 text-sm shadow-soft dark:bg-[#566565]">No meals selected yet.</p>
      ) : (
        <>
          <p className="text-sm text-slate-500 dark:text-slate-200">Estimated unique ingredients: {ingredientCount}</p>
          <ul className="space-y-3">
            {selectedMeals.map((meal) => (
              <li key={meal.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft dark:bg-[#566565]">
                <img
                  src={meal.image}
                  alt={meal.name}
                  className="h-16 w-16 rounded-xl object-cover"
                  onError={(event) => {
                    event.currentTarget.src = 'images/placeholder-meal.svg';
                  }}
                />
                <div className="flex-1">
                  <h2 className="font-semibold">{meal.name}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-200">Serves 2</p>
                </div>
                <button
                  onClick={() => toggleBasket(meal.id)}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold dark:bg-slate-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={() => navigate('/list')}
            className="w-full rounded-2xl bg-nomlet-sage px-5 py-3 text-sm font-semibold text-white"
          >
            Continue to list
          </button>
        </>
      )}
    </section>
  );
};
