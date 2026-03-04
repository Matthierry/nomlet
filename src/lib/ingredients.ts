import type { ConsolidatedIngredient, Meal } from '../types';

export const ingredientKey = (name: string, unit: string) => `${name}__${unit}`;

export const consolidateIngredients = (meals: Meal[]): ConsolidatedIngredient[] => {
  const bucket = new Map<string, ConsolidatedIngredient>();

  meals.forEach((meal) => {
    meal.ingredients.forEach((ingredient) => {
      const key = ingredientKey(ingredient.name, ingredient.unit);
      const existing = bucket.get(key);

      if (existing) {
        existing.quantity += ingredient.quantity;
      } else {
        bucket.set(key, {
          key,
          name: ingredient.name,
          unit: ingredient.unit,
          quantity: ingredient.quantity,
        });
      }
    });
  });

  return [...bucket.values()].sort((a, b) => a.name.localeCompare(b.name));
};

export const formatListForCopy = (ingredients: ConsolidatedIngredient[]) =>
  ingredients.map((item) => `- ${item.name} — ${item.quantity} ${item.unit}`).join('\n');
