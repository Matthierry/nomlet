import type { Meal } from "../data/loadMeals"

const BASE_SERVINGS = 2

function roundToHalf(value: number) {
  return Math.round(value * 2) / 2
}

function roundToQuarter(value: number) {
  return Math.round(value * 4) / 4
}

export function scaleQuantity(quantity: number, unit: string, servings: number) {
  if (!Number.isFinite(quantity)) return quantity

  const ratio = servings / BASE_SERVINGS
  const scaled = quantity * ratio
  const normalizedUnit = unit.trim().toLowerCase()

  if (normalizedUnit.includes("g") || normalizedUnit.includes("ml")) {
    return Math.max(0, Math.round(scaled))
  }

  if (normalizedUnit === "tbsp" || normalizedUnit === "tsp") {
    return Math.max(0, roundToHalf(scaled))
  }

  if (
    normalizedUnit.includes("clove") ||
    normalizedUnit.includes("item") ||
    normalizedUnit.includes("whole")
  ) {
    return Math.max(0, roundToQuarter(scaled))
  }

  return Math.max(0, roundToHalf(scaled))
}

export function getMealServings(meal: Meal, servingsMap: Record<string, number>) {
  const value = servingsMap[meal.id]
  if (typeof value !== "number" || !Number.isFinite(value) || value < 1) return meal.serves
  return Math.round(value)
}
