import { useEffect, useMemo, useState } from "react"
import { loadMeals, type Meal } from "./data/loadMeals"

type Page = "meals" | "basket" | "list" | "settings"
type Theme = "light" | "dark"

const LS_BASKET = "nomlet:basket"
const LS_THEME = "nomlet:theme"
const LS_CHECKS = "nomlet:checks"
const LS_EDITS = "nomlet:edits"

type ChecksMap = Record<string, boolean>
type EditsMap = Record<string, number>

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function loadBasket(): string[] {
  const arr = safeJsonParse<any>(localStorage.getItem(LS_BASKET), [])
  return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : []
}

function saveBasket(ids: string[]) {
  localStorage.setItem(LS_BASKET, JSON.stringify(ids))
}

function loadTheme(): Theme {
  const t = localStorage.getItem(LS_THEME)
  return t === "dark" ? "dark" : "light"
}

function saveTheme(t: Theme) {
  localStorage.setItem(LS_THEME, t)
}

function loadChecks(): ChecksMap {
  const obj = safeJsonParse<any>(localStorage.getItem(LS_CHECKS), {})
  return obj && typeof obj === "object" ? obj : {}
}

function saveChecks(m: ChecksMap) {
  localStorage.setItem(LS_CHECKS, JSON.stringify(m))
}

function loadEdits(): EditsMap {
  const obj = safeJsonParse<any>(localStorage.getItem(LS_EDITS), {})
  return obj && typeof obj === "object" ? obj : {}
}

function saveEdits(m: EditsMap) {
  localStorage.setItem(LS_EDITS, JSON.stringify(m))
}

function ingredientKey(name: string, unit: string) {
  return `${name}__${unit}` // strict: name+unit
}

export default function App() {
  const [page, setPage] = useState<Page>("meals")

  const [theme, setTheme] = useState<Theme>(() => loadTheme())

  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [basket, setBasket] = useState<string[]>(() => loadBasket())

  const [checks, setChecks] = useState<ChecksMap>(() => loadChecks())
  const [edits, setEdits] = useState<EditsMap>(() => loadEdits())

  useEffect(() => saveTheme(theme), [theme])
  useEffect(() => saveBasket(basket), [basket])
  useEffect(() => saveChecks(checks), [checks])
  useEffect(() => saveEdits(edits), [edits])

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await loadMeals()
        setMeals(data)
      } catch (e: any) {
        setError(e?.message ?? "Failed to load meals")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const ui = useMemo(() => {
    const light = {
      bg: "#F1F7F7",
      card: "#FFFFFF",
      card2: "#F1F7F7",
      text: "#2A2A2A",
      brand: "#5D6B6B",
      muted: "#666666",
      accent: "#A0C7C6",
      accentSoft: "#D5E5E5",
      pink: "#F7CBCA",
      border: "rgba(0,0,0,0.08)",
      shadow: "0 10px 30px rgba(0,0,0,0.08)",
      navBg: "rgba(241,247,247,0.92)",
      navBorder: "rgba(0,0,0,0.06)",
    }
    const dark = {
      bg: "#1B1F1F",
      card: "#252B2B",
      card2: "#1F2424",
      text: "#F1F7F7",
      brand: "#D5E5E5",
      muted: "rgba(241,247,247,0.72)",
      accent: "#A0C7C6",
      accentSoft: "#2C3434",
      pink: "#F7CBCA",
      border: "rgba(241,247,247,0.12)",
      shadow: "0 10px 30px rgba(0,0,0,0.35)",
      navBg: "rgba(27,31,31,0.92)",
      navBorder: "rgba(241,247,247,0.10)",
    }
    return theme === "dark" ? dark : light
  }, [theme])

  const basketCount = basket.length

  const basketMeals = useMemo(() => {
    const set = new Set(basket)
    return meals.filter((m) => set.has(m.id))
  }, [meals, basket])

  function toggleMeal(mealId: string) {
    setBasket((prev) => {
      const set = new Set(prev)
      if (set.has(mealId)) set.delete(mealId)
      else set.add(mealId)
      return Array.from(set)
    })
  }

  function clearAll() {
    setBasket([])
    setChecks({})
    setEdits({})
    setPage("meals")
  }

  function clearBasketOnly() {
    setBasket([])
    // keep checks/edits by default (some people like returning later),
    // but you can switch this to clearAll() if you prefer.
  }

  const Shell = ({ children }: { children: React.ReactNode }) => {
    const bottomNavHeight = 72
    const extraForStickyCTA = page === "meals" && basketCount > 0 ? 74 : 0

    return (
      <div
        style={{
          minHeight: "100vh",
          background: ui.bg,
          padding: 16,
          paddingBottom: bottomNavHeight + 16 + extraForStickyCTA,
          color: ui.text,
        }}
      >
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <div style={{ marginBottom: 16 }}>
            <h1 style={{ color: ui.brand, margin: 0, fontWeight: 900 }}>Nomlet</h1>
            <p style={{ margin: "6px 0 0", color: ui.muted }}>Meals picked. Shop sorted.</p>
          </div>

          {children}
        </div>

        {/* Sticky CTA (Meals only) */}
        {basketCount > 0 && page === "meals" && (
          <div
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: bottomNavHeight,
              padding: 12,
              background: ui.navBg,
              backdropFilter: "blur(10px)",
              borderTop: `1px solid ${ui.navBorder}`,
            }}
          >
            <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", gap: 10 }}>
              <button
                onClick={() => setPage("basket")}
                style={{
                  flex: 1,
                  borderRadius: 14,
                  padding: "12px 14px",
                  background: ui.brand,
                  color: theme === "dark" ? "#1B1F1F" : "white",
                  fontWeight: 900,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Review basket ({basketCount})
              </button>

              <button
                onClick={clearBasketOnly}
                style={{
                  borderRadius: 14,
                  padding: "12px 14px",
                  background: ui.card,
                  color: ui.brand,
                  fontWeight: 900,
                  border: `1px solid ${ui.border}`,
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <BottomNav />
      </div>
    )
  }

  const BottomNav = () => {
    const items: { id: Page; label: string; badge?: number }[] = [
      { id: "meals", label: "Meals" },
      { id: "basket", label: "Basket", badge: basketCount },
      { id: "list", label: "List" },
      { id: "settings", label: "Settings" },
    ]

    return (
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          background: ui.navBg,
          backdropFilter: "blur(10px)",
          borderTop: `1px solid ${ui.navBorder}`,
          padding: 10,
        }}
      >
        <div style={{ maxWidth: 520, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {items.map((it) => {
            const active = page === it.id
            return (
              <button
                key={it.id}
                onClick={() => setPage(it.id)}
                style={{
                  borderRadius: 14,
                  padding: "10px 8px",
                  border: `1px solid ${active ? ui.accent : ui.border}`,
                  background: active ? ui.accentSoft : ui.card,
                  color: ui.text,
                  fontWeight: 900,
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                {it.label}
                {typeof it.badge === "number" && it.badge > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 10,
                      minWidth: 18,
                      height: 18,
                      padding: "0 6px",
                      borderRadius: 999,
                      background: ui.pink,
                      color: "#2A2A2A",
                      fontSize: 12,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      border: `1px solid ${ui.border}`,
                    }}
                  >
                    {it.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const MealsPage = () => (
    <>
      {loading && <p style={{ color: ui.muted }}>Loading meals…</p>}

      {error && (
        <div style={{ background: ui.card, padding: 12, borderRadius: 12, border: `1px solid ${ui.border}` }}>
          <p style={{ margin: 0, color: ui.pink, fontWeight: 900 }}>Error: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: "grid", gap: 12 }}>
          {meals.map((meal) => {
            const inBasket = basket.includes(meal.id)
            return (
              <div
                key={meal.id}
                style={{
                  background: ui.card,
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: ui.shadow,
                  border: `1px solid ${ui.border}`,
                }}
              >
                <img src={meal.imageUrl} alt="" style={{ width: "100%", height: 160, objectFit: "cover" }} />
                <div style={{ padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 900, color: ui.brand }}>{meal.name}</div>
                      <div style={{ marginTop: 4, color: ui.muted, fontSize: 13 }}>Calories: ??? • Serves 2</div>
                    </div>

                    <div style={{ color: ui.accent, fontWeight: 900, alignSelf: "center", whiteSpace: "nowrap" }}>
                      {meal.ingredients.length} items
                    </div>
                  </div>

                  <button
                    onClick={() => toggleMeal(meal.id)}
                    style={{
                      marginTop: 12,
                      width: "100%",
                      borderRadius: 12,
                      padding: "10px 12px",
                      border: `1px solid ${ui.border}`,
                      fontWeight: 900,
                      background: inBasket ? ui.pink : ui.accentSoft,
                      color: "#2a2a2a",
                      cursor: "pointer",
                    }}
                  >
                    {inBasket ? "Remove from basket" : "Add to basket"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )

  const BasketPage = () => (
    <>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <button
          onClick={() => clearBasketOnly()}
          style={{
            borderRadius: 12,
            padding: "10px 12px",
            background: ui.card,
            border: `1px solid ${ui.border}`,
            color: ui.brand,
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          Clear basket
        </button>

        <div style={{ flex: 1 }} />

        <button
          onClick={clearAll}
          style={{
            borderRadius: 12,
            padding: "10px 12px",
            background: ui.card,
            border: `1px solid ${ui.border}`,
            color: ui.brand,
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          Clear all
        </button>
      </div>

      <div style={{ background: ui.card, borderRadius: 16, padding: 14, boxShadow: ui.shadow, border: `1px solid ${ui.border}` }}>
        <div style={{ fontWeight: 900, color: ui.brand, marginBottom: 8 }}>Review basket</div>

        {basketMeals.length === 0 ? (
          <p style={{ margin: 0, color: ui.muted }}>Your basket is empty.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {basketMeals.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  padding: 10,
                  borderRadius: 12,
                  background: ui.card2,
                  border: `1px solid ${ui.border}`,
                }}
              >
                <img src={m.imageUrl} alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: "cover" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, color: ui.brand }}>{m.name}</div>
                  <div style={{ color: ui.muted, fontSize: 13 }}>Serves 2 • Calories ???</div>
                </div>

                <button
                  onClick={() => toggleMeal(m.id)}
                  style={{
                    borderRadius: 12,
                    padding: "10px 12px",
                    background: ui.pink,
                    border: `1px solid ${ui.border}`,
                    color: "#2a2a2a",
                    fontWeight: 900,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setPage("list")}
          disabled={basketMeals.length === 0}
          style={{
            marginTop: 14,
            width: "100%",
            borderRadius: 14,
            padding: "12px 14px",
            background: basketMeals.length === 0 ? "rgba(93,107,107,0.35)" : ui.brand,
            color: theme === "dark" ? "#1B1F1F" : "white",
            fontWeight: 900,
            border: "none",
            cursor: basketMeals.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          Continue to list
        </button>
      </div>
    </>
  )

  const ListPage = () => {
    // Build merged ingredients
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

    function setEditedQty(key: string, value: number) {
      setEdits((prev) => ({ ...prev, [key]: value }))
    }

    function copyList() {
      const text = ingredients
        .map((i) => {
          const key = ingredientKey(i.name, i.unit)
          const qty = typeof edits[key] === "number" ? edits[key] : i.quantity
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
              const qty = typeof edits[key] === "number" ? edits[key] : i.quantity

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

                  <input
                    value={qty}
                    onChange={(e) => setEditedQty(key, Number(e.target.value))}
                    type="number"
                    min={0}
                    style={{
                      width: 78,
                      padding: "6px 8px",
                      borderRadius: 10,
                      border: `1px solid ${ui.border}`,
                      fontWeight: 900,
                      color: ui.text,
                      background: ui.card2,
                    }}
                  />

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

        <p style={{ margin: "10px 0 0", color: ui.muted, fontSize: 12 }}>
          Tip: quantities and ticks are saved automatically on this device.
        </p>
      </div>
    )
  }

  const SettingsPage = () => (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ background: ui.card, borderRadius: 16, padding: 14, boxShadow: ui.shadow, border: `1px solid ${ui.border}` }}>
        <div style={{ fontWeight: 900, color: ui.brand, marginBottom: 8 }}>Appearance</div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900, color: ui.text }}>Dark mode</div>
            <div style={{ color: ui.muted, fontSize: 13 }}>Default is light mode</div>
          </div>

          <button
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            style={{
              borderRadius: 999,
              padding: "10px 14px",
              background: theme === "dark" ? ui.pink : ui.accentSoft,
              border: `1px solid ${ui.border}`,
              fontWeight: 900,
              cursor: "pointer",
              color: "#2A2A2A",
              whiteSpace: "nowrap",
            }}
          >
            {theme === "dark" ? "On" : "Off"}
          </button>
        </div>
      </div>

      <div style={{ background: ui.card, borderRadius: 16, padding: 14, boxShadow: ui.shadow, border: `1px solid ${ui.border}` }}>
        <div style={{ fontWeight: 900, color: ui.brand, marginBottom: 8 }}>Request meals</div>
        <p style={{ margin: 0, color: ui.muted }}>
          The ability to request meals to be added to the site will come soon.
        </p>
      </div>

      <div style={{ background: ui.card, borderRadius: 16, padding: 14, boxShadow: ui.shadow, border: `1px solid ${ui.border}` }}>
        <div style={{ fontWeight: 900, color: ui.brand, marginBottom: 8 }}>Reset</div>
        <button
          onClick={clearAll}
          style={{
            width: "100%",
            borderRadius: 14,
            padding: "12px 14px",
            background: ui.brand,
            color: theme === "dark" ? "#1B1F1F" : "white",
            fontWeight: 900,
            border: "none",
            cursor: "pointer",
          }}
        >
          Clear all data
        </button>
      </div>
    </div>
  )

  return (
    <Shell>
      {page === "meals" && <MealsPage />}
      {page === "basket" && <BasketPage />}
      {page === "list" && <ListPage />}
      {page === "settings" && <SettingsPage />}
    </Shell>
  )
}