export function ingredientKey(name: string, unit: string) {
  return `${name}__${unit}`
}

export const INGREDIENT_CATEGORY_ORDER = [
  "Vegetables",
  "Fruit",
  "Meat & Poultry",
  "Dairy",
  "Frozen",
  "Bakery",
  "Pasta, Rice & Grains",
  "Tinned & Jarred",
  "Sauces & Condiments",
  "Stock & Gravy",
  "Herbs & Spices",
  "Alcohol",
] as const

export const OTHER_CATEGORY_LABEL = "Other / Uncategorized"

export function normalizeIngredientCategory(category: string) {
  const trimmed = category.trim()
  return trimmed.length > 0 ? trimmed : OTHER_CATEGORY_LABEL
}

export function orderIngredientCategories(categories: string[]) {
  const seen = new Set<string>()
  const unique = categories.filter((cat) => {
    const normalized = normalizeIngredientCategory(cat)
    if (seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })

  const knownIndex = new Map<string, number>(
    INGREDIENT_CATEGORY_ORDER.map((cat, index) => [cat, index])
  )

  return unique
    .map((cat) => normalizeIngredientCategory(cat))
    .sort((a, b) => {
      const ia = knownIndex.get(a)
      const ib = knownIndex.get(b)

      if (ia != null && ib != null) return ia - ib
      if (ia != null) return -1
      if (ib != null) return 1

      if (a === OTHER_CATEGORY_LABEL && b !== OTHER_CATEGORY_LABEL) return 1
      if (b === OTHER_CATEGORY_LABEL && a !== OTHER_CATEGORY_LABEL) return -1

      return a.localeCompare(b)
    })
}
