import type { Meal } from '../types';
import { withBaseUrl } from './assets';

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

export const normalizeMealAssets = (meals: Meal[]): Meal[] =>
  meals.map((meal) => ({
    ...meal,
    image: meal.image
      ? isAbsoluteUrl(meal.image)
        ? meal.image
        : withBaseUrl(meal.image)
      : withBaseUrl('images/placeholder-meal.svg'),
  }));
