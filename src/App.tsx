import { useEffect, useMemo, useRef, useState } from "react"
import { loadMeals, type Meal } from "./data/loadMeals"
import { canInstallPWA, installPWA } from "./pwa"

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

  // Search UX
  const [mealQuery, setMealQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const searchWrapRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  // --- Persist
  useEffect(() => saveTheme(theme), [theme])
  useEffect(() => saveBasket(basket), [basket])
  useEffect(() => saveChecks(checks), [checks])
  useEffect(() => saveEdits(edits), [edits])

  // --- Load meals
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

  // --- Close search suggestions on outside tap
  useEffect(() => {
    function onDown(e: MouseEvent | TouchEvent) {
      const el = searchWrapRef.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) setSearchOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("touchstart", onDown, { passive: true })
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("touchstart", onDown)
    }
  }, [])

  // --- Fix “keyboard disappears / page jumps” on mobile
  // Prevent browser auto-scroll/re-layout from stealing focus as DOM updates.
  useEffect(() => {
    const vv = (window as any).visualViewport as VisualViewport | undefined
    if (!vv) return

    const handle = () => {
      // Only relevant when search is focused/open
      if (document.activeElement === searchInputRef.current) {
        // Keep suggestions open while typing
        setSearchOpen(true)
      }
    }
    vv.addEventListener("resize", handle)
    vv.addEventListener("scroll", handle)
    return () => {
      vv.removeEventListener("resize", handle)
      vv.removeEventListener("scroll", handle)
    }
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

  // Apply background + prevent side gap/horizontal scroll globally
  useEffect(() => {
    document.documentElement.style.background = ui.bg
    document.body.style.background = ui.bg
    document.body.style.margin = "0"
    document.body.style.overflowX = "hidden"
  }, [ui.bg])

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
    setMealQuery("")
    setSearchOpen(false)
    setPage("meals")
  }

  function clearBasketOnly() {
    setBasket([])
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
          paddingBottom: 10,
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

  const Shell = ({ children }: { children: React.ReactNode }) => {
    const bottomNavHeight = 72
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: ui.bg,
          padding: 16,
          paddingBottom: bottomNavHeight + 18,
          color: ui.text,
          overflowX: "hidden",
        }}
      >
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <div style={{ marginBottom: 12 }}>
            <h1 style={{ color: ui.brand, margin: 0, fontWeight: 900 }}>Nomlet</h1>
            <p style={{ margin: "6px 0 0", color: ui.muted }}>Meals picked. Shop sorted.</p>
          </div>

          {children}
        </div>

        <BottomNav />
      </div>
    )
  }

  // Suggestion behaviour: only show results at 3+ characters
  const queryTrim = mealQuery.trim()
  const queryLower = queryTrim.toLowerCase()
  const searchActive = queryTrim.length >= 3

  const suggestions = useMemo(() => {
    if (!searchActive) return []
    const hits = meals.filter((m) => m.name.toLowerCase().includes(queryLower))
    // Show best 10
    return hits.slice(0, 10)
  }, [meals, queryLower, searchActive])

  const mealListToShow = useMemo(() => {
    // When 3+ letters, filter the main list too (as requested)
    if (!searchActive) return meals
    return meals.filter((m) => m.name.toLowerCase().includes(queryLower))
  }, [meals, queryLower, searchActive])

  const MealsPage = () => (
    <>
      {/* Sticky search */}
      <div
        ref={searchWrapRef}
        style={{
          position: "sticky",
          top: 8,
          zIndex: 20,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            background: ui.card,
            borderRadius: 16,
            padding: 12,
            boxShadow: ui.shadow,
            border: `1px solid ${ui.border}`,
          }}
        >
          <div style={{ fontWeight: 900, color: ui.brand, marginBottom: 8 }}>Find a meal</div>

          {/* Input row */}
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              background: ui.card2,
              border: `1px solid ${ui.border}`,
              borderRadius: 14,
              padding: "10px 12px",
              boxSizing: "border-box",
              width: "100%",
              overflow: "hidden",
            }}
          >
            <span style={{ color: ui.muted, fontWeight: 900 }}>🔎</span>

            <input
              ref={searchInputRef}
              value={mealQuery}
              onChange={(e) => setMealQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search meals… (type 3+ letters)"
              inputMode="search"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              style={{
                flex: 1,
                minWidth: 0,
                border: "none",
                background: "transparent",
                color: ui.text,
                fontWeight: 900,
                outline: "none",
                fontSize: 16, // prevents iOS zoom; fine on Android too
              }}
            />

            {mealQuery.length > 0 && (
              <button
                onClick={() => {
                  setMealQuery("")
                  setSearchOpen(true)
                  // keep focus so keyboard doesn't disappear
                  requestAnimationFrame(() => searchInputRef.current?.focus())
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  color: ui.brand,
                  fontWeight: 900,
                  cursor: "pointer",
                  padding: 0,
                }}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
            <div style={{ color: ui.muted, fontSize: 13, fontWeight: 800, flex: 1 }}>
              {searchActive ? (
                <>Showing {mealListToShow.length} of {meals.length}</>
              ) : (
                <>Type at least 3 letters to search • Showing {meals.length} meals</>
              )}
            </div>
          </div>

          {/* Suggestions dropdown */}
          {searchOpen && mealQuery.trim().length > 0 && (
            <div
              style={{
                marginTop: 10,
                background: ui.card,
                border: `1px solid ${ui.border}`,
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              {!searchActive ? (
                <div style={{ padding: 12, color: ui.muted, fontWeight: 800 }}>
                  Keep typing… ({mealQuery.trim().length}/3)
                </div>
              ) : suggestions.length === 0 ? (
                <div style={{ padding: 12, color: ui.muted, fontWeight: 800 }}>
                  No matches for “{queryTrim}”
                </div>
              ) : (
                suggestions.map((m) => {
                  const inBasket = basket.includes(m.id)
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        toggleMeal(m.id)
                        // keep the keyboard open by re-focusing input
                        requestAnimationFrame(() => searchInputRef.current?.focus())
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "12px 12px",
                        background: "transparent",
                        border: "none",
                        borderBottom: `1px solid ${ui.border}`,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <img
                        src={m.imageUrl}
                        alt=""
                        style={{ width: 38, height: 38, borderRadius: 12, objectFit: "cover", border: `1px solid ${ui.border}` }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 900, color: ui.text }}>{m.name}</div>
                        <div style={{ color: ui.muted, fontSize: 12, fontWeight: 800 }}>{m.ingredients.length} items</div>
                      </div>
                      <div
                        style={{
                          fontWeight: 900,
                          color: inBasket ? "#2A2A2A" : ui.brand,
                          background: inBasket ? ui.pink : ui.accentSoft,
                          border: `1px solid ${ui.border}`,
                          borderRadius: 999,
                          padding: "8px 10px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {inBasket ? "Remove" : "Add"}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>

      {loading && <p style={{ color: ui.muted }}>Loading meals…</p>}

      {error && (
        <div style={{ background: ui.card, padding: 12, borderRadius: 12, border: `1px solid ${ui.border}` }}>
          <p style={{ margin: 0, color: ui.pink, fontWeight: 900 }}>Error: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: "grid", gap: 12 }}>
          {mealListToShow.map((meal) => {
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

          {!loading && searchActive && mealListToShow.length === 0 && (
            <div style={{ background: ui.card, borderRadius: 16, padding: 14, border: `1px solid ${ui.border}` }}>
              <div style={{ fontWeight: 900, color: ui.brand }}>No meals found</div>
              <p style={{ margin: "6px 0 0", color: ui.muted }}>Try a different search term.</p>
            </div>
          )}
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
      const safe = Number.isFinite(value) ? value : 0
      setEdits((prev) => ({ ...prev, [key]: safe < 0 ? 0 : safe }))
    }

    function bumpQty(key: string, current: number, delta: number) {
      const next = Math.max(0, (Number.isFinite(current) ? current : 0) + delta)
      setEditedQty(key, next)
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

                  <button
                    onClick={() => bumpQty(key, qty, -1)}
                    aria-label="Decrease quantity"
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
                    value={qty}
                    onChange={(e) => setEditedQty(key, Number(e.target.value))}
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
                    onClick={() => bumpQty(key, qty, +1)}
                    aria-label="Increase quantity"
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

        <button
          onClick={async () => {
            const ok = await installPWA()
            if (!ok) alert("Install isn’t available yet. Try Chrome, refresh once, then open Settings again.")
          }}
          style={{
            width: "100%",
            borderRadius: 14,
            padding: "12px 14px",
            background: ui.brand,
            color: theme === "dark" ? "#1B1F1F" : "white",
            fontWeight: 900,
            border: "none",
            cursor: "pointer",
            marginTop: 12,
            display: canInstallPWA() ? "block" : "none",
          }}
        >
          Install Nomlet
        </button>
      </div>

      <div style={{ background: ui.card, borderRadius: 16, padding: 14, boxShadow: ui.shadow, border: `1px solid ${ui.border}` }}>
        <div style={{ fontWeight: 900, color: ui.brand, marginBottom: 8 }}>Request meals</div>
        <p style={{ margin: 0, color: ui.muted }}>The ability to request meals to be added to the site will come soon.</p>
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