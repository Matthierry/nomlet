export type Theme = 'light' | 'dark';

export interface MealIngredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Meal {
  id: string;
  name: string;
  image: string;
  serves: 2;
  calories: number | null;
  recipeUrl: string;
  ingredients: MealIngredient[];
}

export interface ConsolidatedIngredient {
  key: string;
  name: string;
  unit: string;
  quantity: number;
}
