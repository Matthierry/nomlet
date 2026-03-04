export const STORAGE_KEYS = {
  basket: 'nomlet:basket',
  checks: 'nomlet:checks',
  edits: 'nomlet:edits',
  theme: 'nomlet:theme',
} as const;

export const NAV_ITEMS = [
  { label: 'Meals', path: '/meals' },
  { label: 'Basket', path: '/basket' },
  { label: 'List', path: '/list' },
  { label: 'Settings', path: '/settings' },
] as const;
