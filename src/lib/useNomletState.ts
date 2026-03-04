import { useEffect, useMemo, useState } from 'react';
import type { Meal, Theme } from '../types';
import { consolidateIngredients } from './ingredients';
import { STORAGE_KEYS } from './constants';
import { readStorage, writeStorage } from './storage';

export const useNomletState = (meals: Meal[]) => {
  const [basket, setBasket] = useState<string[]>(() => readStorage(STORAGE_KEYS.basket, [] as string[]));
  const [checks, setChecks] = useState<Record<string, boolean>>(() =>
    readStorage(STORAGE_KEYS.checks, {} as Record<string, boolean>),
  );
  const [edits, setEdits] = useState<Record<string, number>>(() =>
    readStorage(STORAGE_KEYS.edits, {} as Record<string, number>),
  );
  const [theme, setTheme] = useState<Theme>(() => readStorage(STORAGE_KEYS.theme, 'light' as Theme));

  useEffect(() => writeStorage(STORAGE_KEYS.basket, basket), [basket]);
  useEffect(() => writeStorage(STORAGE_KEYS.checks, checks), [checks]);
  useEffect(() => writeStorage(STORAGE_KEYS.edits, edits), [edits]);
  useEffect(() => writeStorage(STORAGE_KEYS.theme, theme), [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const selectedMeals = useMemo(() => meals.filter((meal) => basket.includes(meal.id)), [meals, basket]);
  const consolidated = useMemo(() => consolidateIngredients(selectedMeals), [selectedMeals]);

  const toggleBasket = (mealId: string) => {
    setBasket((prev) => (prev.includes(mealId) ? prev.filter((id) => id !== mealId) : [...prev, mealId]));
  };

  const clearAll = () => {
    setBasket([]);
    setChecks({});
    setEdits({});
  };

  return {
    basket,
    checks,
    edits,
    theme,
    setTheme,
    selectedMeals,
    consolidated,
    toggleBasket,
    setChecks,
    setEdits,
    clearAll,
  };
};
