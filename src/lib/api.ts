import type { Meal } from '../types';
import { withBaseUrl } from './assets';

export const fetchMeals = async (): Promise<Meal[]> => {
  const response = await fetch(withBaseUrl('data/meals.json'));

  if (!response.ok) {
    throw new Error('Could not load meals data.');
  }

  return (await response.json()) as Meal[];
};
