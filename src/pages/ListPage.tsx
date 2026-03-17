import { useMemo, useState } from "react"
import type { Meal } from "../data/loadMeals"
import type { UITheme } from "../styles/theme"
import {
  ingredientKey,
  normalizeIngredientCategory,
  orderIngredientCategories,
  OTHER_CATEGORY_LABEL,
} from "../utils/ingredients"
import type { ChecksMap, EditsMap } from "../utils/storage"

type IngredientRow = {
  key: string
  name: string
  quantity: number
  unit: string
  category: string
}

function formatQuantity(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.00$/, "")
}

function extraKey(name: string) {
  return `extra:${name.toLowerCase()}`
}

export function ListPage({
  basketMeals,
  ui,
  theme,
  checks,
  setChecks,
  edits,
  setEdits,
  extras,
  setExtras,
  clearAll,
}: {
  basketMeals: Meal[]
  ui: UITheme
  theme: "light" | "dark"
  checks: ChecksMap
  setChecks: React.Dispatch<React.SetStateAction<ChecksMap>>
  edits: EditsMap
  setEdits: React.Dispatch<React.SetStateAction<EditsMap>>
  extras: string[]
  setExtras: React.Dispatch<React.SetStateAction<string[]>>
  clearAll: () => void
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState(false)
  const [extraInput, setExtraInput] = useState("")

  const ingredients = useMemo(() => {
    const ingredientMap: Record<string, IngredientRow> = {}

    basketMeals.forEach((meal) => {
      meal.ingredients.forEach((ing) => {
        const key = ingredientKey(ing.name, ing.unit)
        const category = normalizeIngredientCategory(ing.category)

        if (!ingredientMap[key]) {
          ingredientMap[key] = {
            key,
            name: ing.name,
            quantity: 0,
            unit: ing.unit,
            category,
          }
        }

        ingredientMap[key].quantity += ing.quantity

        if (
          ingredientMap[key].category === OTHER_CATEGORY_LABEL &&
          category !== OTHER_CATEGORY_LABEL
        ) {
          ingredientMap[key].category = category
        }
      })
    })

    return Object.values(ingredientMap).sort((a, b) => a.name.localeCompare(b.name))
  }, [basketMeals])

  const grouped = useMemo(() => {
    const map: Record<string, IngredientRow[]> = {}

    ingredients.forEach((ingredient) => {
      if (!map[ingredient.category]) map[ingredient.category] = []
      map[ingredient.category].push(ingredient)
    })

    const order = orderIngredientCategories(Object.keys(map))

    return order.map((category) => ({
      category,
      items: map[category] ?? [],
    }))
  }, [ingredients])

  function setChecked(key: string, value: boolean) {
    setChecks((prev) => ({ ...prev, [key]: value }))
  }

  function updateQty(key: string, value: number) {
    const safe = Number.isFinite(value) ? Math.max(0, value) : 0
    setEdits((prev) => ({ ...prev, [key]: safe }))
  }

  function getQty(key: string, fallback: number) {
    const edited = edits[key]
    return typeof edited === "number" && Number.isFinite(edited) ? edited : fallback
  }

  function toggleGroup(category: string) {
    setCollapsed((prev) => ({ ...prev, [category]: !prev[category] }))
  }

  function addExtra() {
    const next = extraInput.trim()
    if (!next) return

    const exists = extras.some((item) => item.toLowerCase() === next.toLowerCase())
    if (exists) {
      setExtraInput("")
      return
    }

    setExtras((prev) => [...prev, next])
    setExtraInput("")
  }

  function removeExtra(name: string) {
    setExtras((prev) => prev.filter((item) => item !== name))
  }

  async function copyList() {
    const ingredientText = grouped
      .filter((group) => group.items.length > 0)
      .map((group) => {
        const lines = group.items.map((item) => {
          const qty = formatQuantity(getQty(item.key, item.quantity))
          const unit = item.unit ? ` ${item.unit}` : ""
          return `- ${item.name} x ${qty}${unit}`
        })
        return `${group.category}\n${lines.join("\n")}`
      })

    const extrasText =
      extras.length > 0
        ? `Extras\n${extras.map((item) => `- ${item}`).join("\n")}`
        : ""

    const text = [...ingredientText, extrasText].filter(Boolean).join("\n\n")

    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const hasAnyListItems = grouped.length > 0 || extras.length > 0

  return (
    <div
      style={{
        background: ui.card,
        borderRadius: 16,
        padding: 14,
        boxShadow: ui.shadow,
        border: `1px solid ${ui.border}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div style={{ fontWeight: 900, color: ui.brand, fontSize: 20 }}>Shopping list</div>

        <button
          onClick={clearAll}
          style={{
            borderRadius: 12,
            padding: "10px 12px",
            background: ui.card2,
            border: `1px solid ${ui.border}`,
            color: ui.brand,
            fontWeight: 900,
          }}
        >
          Clear all
        </button>
      </div>

      {grouped.length === 0 ? (
        <p style={{ margin: 0, color: ui.muted, fontWeight: 700, fontSize: 16 }}>
          No ingredients yet. Add meals first.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {grouped.map((group) => {
            const isCollapsed = collapsed[group.category] ?? false

            return (
              <section
                key={group.category}
                style={{
                  border: `1px solid ${ui.border}`,
                  borderRadius: 14,
                  overflow: "hidden",
                  background: ui.card,
                }}
              >
                <button
                  onClick={() => toggleGroup(group.category)}
                  style={{
                    width: "100%",
                    border: "none",
                    background: ui.card2,
                    color: ui.text,
                    textAlign: "left",
                    padding: "13px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontWeight: 900,
                    fontSize: 17,
                  }}
                >
                  <span>{group.category}</span>
                  <span style={{ color: ui.muted, fontSize: 14 }}>
                    {group.items.length} {group.items.length === 1 ? "item" : "items"} {isCollapsed ? "▸" : "▾"}
                  </span>
                </button>

                {!isCollapsed && (
                  <div style={{ display: "grid", gap: 4, padding: "10px 10px 12px" }}>
                    {group.items.map((item) => {
                      const checked = !!checks[item.key]
                      const qty = getQty(item.key, item.quantity)

                      return (
                        <div
                          key={item.key}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "34px 1fr auto auto",
                            alignItems: "center",
                            gap: 10,
                            padding: "11px 6px",
                            borderBottom: `1px solid ${ui.border}`,
                            background: checked ? ui.card2 : "transparent",
                            borderRadius: 10,
                          }}
                        >
                          <button
                            onClick={() => setChecked(item.key, !checked)}
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 9,
                              border: `1px solid ${ui.border}`,
                              background: checked ? ui.brand : ui.card,
                              color: checked ? "#fff" : ui.text,
                              fontWeight: 900,
                              fontSize: 16,
                            }}
                            aria-label={checked ? "Mark as not completed" : "Mark as completed"}
                          >
                            {checked ? "✓" : ""}
                          </button>

                          <div
                            style={{
                              fontWeight: 800,
                              color: checked ? ui.muted : ui.text,
                              fontSize: 18,
                              textDecoration: checked ? "line-through" : "none",
                            }}
                          >
                            {item.name}
                          </div>

                          <input
                            type="number"
                            min={0}
                            value={qty}
                            onChange={(e) => updateQty(item.key, Number(e.target.value))}
                            style={{
                              width: 72,
                              borderRadius: 10,
                              border: `1px solid ${ui.border}`,
                              background: ui.card2,
                              color: ui.text,
                              fontWeight: 800,
                              textAlign: "center",
                              padding: "8px 6px",
                            }}
                          />

                          <div
                            style={{
                              fontWeight: 800,
                              color: ui.muted,
                              minWidth: 38,
                              textAlign: "right",
                              fontSize: 15,
                            }}
                          >
                            {item.unit}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      <section
        style={{
          marginTop: 16,
          border: `1px solid ${ui.border}`,
          borderRadius: 14,
          padding: 12,
          background: ui.card,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 900, color: ui.text, marginBottom: 10 }}>Extras</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
          <input
            type="text"
            value={extraInput}
            onChange={(e) => setExtraInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addExtra()
              }
            }}
            placeholder="Add extra item"
            style={{
              border: `1px solid ${ui.border}`,
              borderRadius: 12,
              background: ui.card2,
              color: ui.text,
              fontSize: 16,
              fontWeight: 700,
              padding: "12px 14px",
            }}
          />
          <button
            onClick={addExtra}
            style={{
              border: "none",
              borderRadius: 12,
              background: ui.brand,
              color: "#fff",
              fontWeight: 900,
              padding: "0 16px",
            }}
          >
            Add
          </button>
        </div>

        {extras.length > 0 && (
          <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
            {extras.map((item) => {
              const key = extraKey(item)
              const checked = !!checks[key]

              return (
                <div
                  key={key}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "34px 1fr auto",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 6px",
                    borderBottom: `1px solid ${ui.border}`,
                    background: checked ? ui.card2 : "transparent",
                    borderRadius: 10,
                  }}
                >
                  <button
                    onClick={() => setChecked(key, !checked)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 9,
                      border: `1px solid ${ui.border}`,
                      background: checked ? ui.brand : ui.card,
                      color: checked ? "#fff" : ui.text,
                      fontWeight: 900,
                      fontSize: 16,
                    }}
                    aria-label={checked ? "Mark as not completed" : "Mark as completed"}
                  >
                    {checked ? "✓" : ""}
                  </button>

                  <div
                    style={{
                      fontWeight: 800,
                      color: checked ? ui.muted : ui.text,
                      fontSize: 17,
                      textDecoration: checked ? "line-through" : "none",
                    }}
                  >
                    {item}
                  </div>

                  <button
                    onClick={() => removeExtra(item)}
                    style={{
                      borderRadius: 10,
                      border: `1px solid ${ui.border}`,
                      background: ui.card2,
                      color: ui.pink,
                      fontWeight: 900,
                      padding: "8px 10px",
                    }}
                    aria-label={`Remove ${item}`}
                  >
                    Remove
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <button
        onClick={copyList}
        disabled={!hasAnyListItems}
        style={{
          marginTop: 14,
          width: "100%",
          borderRadius: 14,
          padding: "13px 14px",
          background: !hasAnyListItems ? "rgba(93,107,107,0.35)" : ui.brand,
          color: theme === "dark" ? "#1B1F1F" : "white",
          fontWeight: 900,
          border: "none",
          fontSize: 16,
        }}
      >
        {copied ? "Copied!" : "Copy list"}
      </button>
    </div>
  )
}
