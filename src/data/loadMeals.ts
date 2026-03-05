export type IngredientRow = {
    meal_id: string
    meal_name: string
    ingredient_name: string
    quantity: number
    unit: string
  }
  
  export type Meal = {
    id: string
    name: string
    imageUrl: string
    serves: 2
    calories: null
    ingredients: { name: string; quantity: number; unit: string }[]
  }
  
  const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTukmzr84rPGnM_iQsK9UML94PwobVav1b3xniAuOLNYbroPtF1WPEOzonSjS874nzz4Zkexa7NOlKn/pub?gid=1248400029&single=true&output=csv"
  
  function parseCSVLine(line: string): string[] {
    // Simple CSV parser that supports quoted values with commas
    const out: string[] = []
    let cur = ""
    let inQuotes = false
  
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        // toggle quotes unless it's an escaped quote
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
  
  export async function loadMeals(): Promise<Meal[]> {
    const res = await fetch(CSV_URL, { cache: "no-store" })
    if (!res.ok) throw new Error(`Failed to fetch CSV (${res.status})`)
  
    const text = await res.text()
    const lines = text.split(/\r?\n/).filter(Boolean)
    if (lines.length < 2) return []
  
    const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase())
  
    const idx = (name: string) => header.indexOf(name)
  
    const iMealId = idx("meal_id")
    const iMealName = idx("meal_name")
    const iIngName = idx("ingredient_name")
    const iQty = idx("quantity")
    const iUnit = idx("unit")
  
    if ([iMealId, iMealName, iIngName, iQty, iUnit].some((x) => x === -1)) {
      throw new Error("CSV headers must include: meal_id, meal_name, ingredient_name, quantity, unit")
    }
  
    const mealsMap = new Map<string, Meal>()
  
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i])
      const meal_id = cols[iMealId]
      const meal_name = cols[iMealName]
      const ingredient_name = cols[iIngName]
      const quantity = Number(cols[iQty] || 0)
      const unit = cols[iUnit]
  
      if (!meal_id || !meal_name || !ingredient_name) continue
  
      if (!mealsMap.has(meal_id)) {
        mealsMap.set(meal_id, {
          id: meal_id,
          name: meal_name,
          imageUrl: "/images/nomlet-placeholder.png",
          serves: 2,
          calories: null,
          ingredients: [],
        })
      }
  
      mealsMap.get(meal_id)!.ingredients.push({
        name: ingredient_name,
        quantity: Number.isFinite(quantity) ? quantity : 0,
        unit: unit || "",
      })
    }
  
    return Array.from(mealsMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }