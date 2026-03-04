import type { Meal, Theme } from '../types';
import type { useNomletState } from './useNomletState';

export type NomletContext = ReturnType<typeof useNomletState> & {
  meals: Meal[];
  loading: boolean;
  error: string | null;
  ingredientCount: number;
  setTheme: (theme: Theme) => void;
};
