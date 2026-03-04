import type { Meal } from '../types';

interface MealCardProps {
  meal: Meal;
  inBasket: boolean;
  onToggle: (mealId: string) => void;
}

export const MealCard = ({ meal, inBasket, onToggle }: MealCardProps) => {
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-soft dark:bg-[#566565]">
      <img
        src={meal.image || 'images/placeholder-meal.svg'}
        alt={meal.name}
        className="h-40 w-full object-cover"
      />
      <div className="space-y-3 p-4">
        <div>
          <h3 className="text-lg font-semibold">{meal.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-200">Calories: {meal.calories ?? '???'}</p>
          <p className="text-sm text-slate-500 dark:text-slate-200">Serves {meal.serves}</p>
        </div>
        <button
          onClick={() => onToggle(meal.id)}
          className={`w-full rounded-xl px-4 py-2 text-sm font-semibold transition ${
            inBasket
              ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100'
              : 'bg-nomlet-pink text-slate-800 hover:brightness-95'
          }`}
        >
          {inBasket ? 'Remove' : 'Add'}
        </button>
      </div>
    </article>
  );
};
