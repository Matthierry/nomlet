import { useRef } from "react"
import type { Meal } from "../data/loadMeals"
import type { UITheme } from "../styles/theme"
import { ingredientKey } from "../utils/ingredients"
import type { ChecksMap, EditsMap } from "../utils/storage"

export function ListPage({
  basketMeals,
  ui,
  theme,
  checks,
  setChecks,
  edits,
  setEdits,
  clearAll,
}: {
  basketMeals: Meal[]
  ui: UITheme
  theme: "light" | "dark"
  checks: ChecksMap
  setChecks: React.Dispatch<React.SetStateAction<ChecksMap>>
  edits: EditsMap
  setEdits: React.Dispatch<React.SetStateAction<EditsMap>>
  clearAll: () => void
}) {
  // ---- LIST EDITS (keyboard-safe)
  const liveEditsRef = useRef<Record<string, number>>({})
  const qtyInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const ingredientMap: Record<string, { name: string; quantity: number; unit: string }> = {}

  basketMeals.forEach((meal) => {
    meal.ingredients.forEach((ing) => {
      const key = ingredientKey(ing.name, ing.unit)
      if (!ingredientMap[key]) ingredientMap[key] = { name: ing.name, quantity: 0, unit: ing.unit }
      ingredientMap[key].quantity += ing.quantity
    })
  })

  const ingredients = Object.values(ingredientMap).sort((a, b) => a.name.localeCompare(b.name))

  function setChecked(key: string, value: boolean) {
    setChecks((prev) => ({ ...prev, [key]: value }))
  }

  function commitQty(key: string, qty: number) {
    const safe = Number.isFinite(qty) ? Math.max(0, qty) : 0
    setEdits((prev) => ({ ...prev, [key]: safe }))
  }

  function getCurrentQty(key: string, fallback: number) {
    const live = liveEditsRef.current[key]
    if (typeof live === "number" && Number.isFinite(live)) return live
    const saved = edits[key]
    if (typeof saved === "number" && Number.isFinite(saved)) return saved
    return fallback
  }

  function setInputValue(key: string, value: number) {
    const el = qtyInputRefs.current[key]
    if (el) el.value = String(value)
    liveEditsRef.current[key] = value
    commitQty(key, value)
  }

  function bumpQty(key: string, fallback: number, delta: number) {
    const current = getCurrentQty(key, fallback)
    const next = Math.max(0, current + delta)
    setInputValue(key, next)
  }

  function copyList() {
    const text = ingredients
      .map((i) => {
        const key = ingredientKey(i.name, i.unit)
        const qty = getCurrentQty(key, i.quantity)
        return `${i.name} — ${qty} ${i.unit}`.trim()
      })
      .join("\n")

    navigator.clipboard.writeText(text)
    alert("Shopping list copied!")
  }

  return (
    <div style={{ background: ui.card, borderRadius: 16, padding: 14, boxShadow: ui.shadow, border: `1px solid ${ui.border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <div style={{ fontWeight: 900, color: ui.brand }}>Shopping list</div>

        <button
          onClick={clearAll}
          style={{
            borderRadius: 12,
            padding: "10px 12px",
            background: ui.card2,
            border: `1px solid ${ui.border}`,
            color: ui.brand,
            fontWeight: 900,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Clear all
        </button>
      </div>

      {ingredients.length === 0 ? (
        <p style={{ margin: 0, color: ui.muted }}>No ingredients yet. Add meals first.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {ingredients.map((i) => {
            const key = ingredientKey(i.name, i.unit)
            const checked = !!checks[key]
            const startQty = typeof edits[key] === "number" ? edits[key] : i.quantity

            return (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 6px",
                  borderBottom: `1px solid ${ui.border}`,
                  opacity: checked ? 0.65 : 1,
                }}
              >
                <input checked={checked} onChange={(e) => setChecked(key, e.target.checked)} type="checkbox" />
                <div style={{ flex: 1, fontWeight: 900, color: ui.text }}>{i.name}</div>

                <button
                  onClick={() => bumpQty(key, i.quantity, -1)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    background: ui.card2,
                    border: `1px solid ${ui.border}`,
                    color: ui.text,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  –
                </button>

                <input
                  defaultValue={startQty}
                  ref={(el) => {
                    qtyInputRefs.current[key] = el
                  }}
                  onFocus={() => {
                    liveEditsRef.current[key] = getCurrentQty(key, i.quantity)
                  }}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    liveEditsRef.current[key] = Number.isFinite(v) ? v : 0
                  }}
                  onBlur={() => {
                    const v = liveEditsRef.current[key]
                    commitQty(key, typeof v === "number" ? v : startQty)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur()
                  }}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  style={{
                    width: 72,
                    padding: "6px 8px",
                    borderRadius: 10,
                    border: `1px solid ${ui.border}`,
                    fontWeight: 900,
                    color: ui.text,
                    background: ui.card2,
                    textAlign: "center",
                  }}
                />

                <button
                  onClick={() => bumpQty(key, i.quantity, +1)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    background: ui.card2,
                    border: `1px solid ${ui.border}`,
                    color: ui.text,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  +
                </button>

                <div style={{ width: 44, color: ui.muted, fontWeight: 900, textAlign: "right" }}>{i.unit}</div>
              </div>
            )
          })}
        </div>
      )}

      <button
        onClick={copyList}
        disabled={ingredients.length === 0}
        style={{
          marginTop: 14,
          width: "100%",
          borderRadius: 14,
          padding: "12px 14px",
          background: ingredients.length === 0 ? "rgba(93,107,107,0.35)" : ui.brand,
          color: theme === "dark" ? "#1B1F1F" : "white",
          fontWeight: 900,
          border: "none",
          cursor: ingredients.length === 0 ? "not-allowed" : "pointer",
        }}
      >
        Copy shopping list
      </button>
    </div>
  )
}