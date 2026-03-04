import type { Meal } from '../types';

export const fetchMeals = async (): Promise<Meal[]> => {
  const response = await fetch('./data/meals.json');

  if (!response.ok) {
    throw new Error('Could not load meals data.');
  }

  return (await response.json()) as Meal[];
};
