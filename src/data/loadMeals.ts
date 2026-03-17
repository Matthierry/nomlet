export type Ingredient = {
  name: string
  quantity: number
  unit: string
  category: string
}

export type Meal = {
  id: string
  name: string
  description: string
  recipeUrl: string
  imageUrl: string
  serves: number
  calories: number | null
  prepTime: number | null
  cookTime: number | null
  totalTime: number | null
  foodCat: string
  instructions: string
  ingredients: Ingredient[]
}

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTukmzr84rPGnM_iQsK9UML94PwobVav1b3xniAuOLNYbroPtF1WPEOzonSjS874nzz4Zkexa7NOlKn/pub?gid=1096099850&single=true&output=csv"

export const PLACEHOLDER_MEAL_IMAGE_URL = `${import.meta.env.BASE_URL}images/nomlet-placeholder.png`

export function getMealImageUrl(mealId: string) {
  return `${import.meta.env.BASE_URL}images/meals/${encodeURIComponent(mealId)}.jpg`
}

function parseCSVLine(line: string): string[] {
  const out: string[] = []
  let cur = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]

    if (ch === '"') {
      const next = line[i + 1]
      if (inQuotes && next === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur)
      cur = ""
    } else {
      cur += ch
    }
  }

  out.push(cur)
  return out.map((s) => s.trim())
}

function toNumber(value: string | undefined): number | null {
  if (value == null || value === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export async function loadMeals(): Promise<Meal[]> {
  const res = await fetch(CSV_URL, { cache: "no-store" })
  if (!res.ok) throw new Error(`Failed to fetch CSV (${res.status})`)

  const text = await res.text()
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length < 2) return []

  const header = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase())

  const idx = (name: string) => header.indexOf(name)

  const iMealId = idx("meal_id")
  const iMealName = idx("meal_name")
  const iMealDescription = idx("meal_description")
  const iMealDescriptionTypo = idx("meal_descriptior")
  const iRecipeUrl = idx("recipe_url")
  const iCalories = idx("calories")
  const iPrepTime = idx("prep_time")
  const iCookTime = idx("cook_time")
  const iFoodCat = idx("food_cat")
  const iInstructions = idx("instructions")
  const iIngName = idx("ingredient_name")
  const iQty = idx("quantity")
  const iUnit = idx("unit")
  const iIngCategory = idx("ingredient_category")

  if ([iMealId, iMealName, iIngName, iQty, iUnit].some((x) => x === -1)) {
    throw new Error(
      "CSV headers must include: meal_id, meal_name, ingredient_name, quantity, unit"
    )
  }

  const mealsMap = new Map<string, Meal>()

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i])

    const mealId = cols[iMealId]?.trim()
    const mealName = cols[iMealName]?.trim()
    const ingredientName = cols[iIngName]?.trim()

    if (!mealId || !mealName || !ingredientName) continue

    const description =
      (iMealDescription !== -1 ? cols[iMealDescription] : "") ||
      (iMealDescriptionTypo !== -1 ? cols[iMealDescriptionTypo] : "") ||
      ""

    const recipeUrl = iRecipeUrl !== -1 ? (cols[iRecipeUrl] || "").trim() : ""
    const calories = iCalories !== -1 ? toNumber(cols[iCalories]) : null
    const prepTime = iPrepTime !== -1 ? toNumber(cols[iPrepTime]) : null
    const cookTime = iCookTime !== -1 ? toNumber(cols[iCookTime]) : null
    const foodCat = iFoodCat !== -1 ? (cols[iFoodCat] || "").trim() : ""
    const instructions = iInstructions !== -1 ? (cols[iInstructions] || "").trim() : ""
    const quantity = iQty !== -1 ? toNumber(cols[iQty]) ?? 0 : 0
    const unit = iUnit !== -1 ? (cols[iUnit] || "").trim() : ""
    const ingredientCategory =
      iIngCategory !== -1 ? (cols[iIngCategory] || "").trim() : ""

    if (!mealsMap.has(mealId)) {
      const totalTime =
        prepTime != null && cookTime != null
          ? prepTime + cookTime
          : prepTime != null
            ? prepTime
            : cookTime != null
              ? cookTime
              : null

      mealsMap.set(mealId, {
        id: mealId,
        name: mealName,
        description: description.trim(),
        recipeUrl,
        imageUrl: getMealImageUrl(mealId),
        serves: 2,
        calories,
        prepTime,
        cookTime,
        totalTime,
        foodCat,
        instructions,
        ingredients: [],
      })
    } else {
      const existingMeal = mealsMap.get(mealId)!
      if (!existingMeal.instructions && instructions) {
        existingMeal.instructions = instructions
      }
    }

    mealsMap.get(mealId)!.ingredients.push({
      name: ingredientName,
      quantity,
      unit,
      category: ingredientCategory,
    })
  }

  return Array.from(mealsMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}
