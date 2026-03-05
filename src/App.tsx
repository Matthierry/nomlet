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
  return `${name}__${unit}`
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

  // ---------- Search (simple, stable) ----------
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [query, setQuery] = useState("")
  const [queryUI, setQueryUI] = useState("")
  const debounceTimer = useRef<number | null>(null)

  function scheduleQueryUpdate(next: string) {
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current)
    debounceTimer.current = window.setTimeout(() => {
      setQuery(next)
      setQueryUI(next)
    }, 120)
  }

  function clearSearch() {
    if (searchInputRef.current) searchInputRef.current.value = ""
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current)
    setQuery("")
    setQueryUI("")
    requestAnimationFrame(() => searchInputRef.current?.focus())
  }

  // ---- LIST EDITS (keyboard-safe)
  const liveEditsRef = useRef<Record<string, number>>({})
  const qtyInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Persist
  useEffect(() => saveTheme(theme), [theme])
  useEffect(() => saveBasket(basket), [basket])
  useEffect(() => saveChecks(checks), [checks])
  useEffect(() => saveEdits(edits), [edits])

  // Load meals
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

  // Global background + remove side gap / horizontal scroll
  useEffect(() => {
    const setStyle = (el: HTMLElement, s: Partial<CSSStyleDeclaration>) => Object.assign(el.style, s)
    setStyle(document.documentElement, { background: ui.bg })
    setStyle(document.body, { background: ui.bg, margin: "0", overflowX: "hidden", width: "100%" })
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
    liveEditsRef.current = {}
    clearSearch()
    setPage("meals")
  }

  function clearBasketOnly() {
    setBasket([])
  }

  // Search rule: filter list only when 3+ letters
  const queryTrim = query.trim()
  const searchActive = queryTrim.length >= 3
  const queryLower = queryTrim.toLowerCase()

  const mealListToShow = useMemo(() => {
    if (!searchActive) return meals
    return meals.filter((m) => m.name.toLowerCase().includes(queryLower))
  }, [meals, searchActive, queryLower])

  function renderBottomNav() {
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

  function renderShell(children: React.ReactNode) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: ui.bg,
          padding: 16,
          paddingBottom: 72 + 18,
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

        {renderBottomNav()}
      </div>
    )
  }

  function renderMealsPage() {
    return (
      <>
        <div style={{ marginBottom: 12 }}>
          <div style={{ background: ui.card, borderRadius: 16, padding: 12, boxShadow: ui.shadow, border: `1px solid ${ui.border}` }}>
            <div style={{ fontWeight: 900, color: ui.brand, marginBottom: 8 }}>Find a meal</div>

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                background: ui.card2,
                border: `1px solid ${ui.border}`,
                borderRadius: 14,
                padding: "10px 12px",
                width: "100%",
                overflow: "hidden",
                boxSizing: "border-box",
              }}
            >
              <span style={{ color: ui.muted, fontWeight: 900 }}>🔎</span>

              <input
                ref={searchInputRef}
                defaultValue=""
                onInput={(e) => scheduleQueryUpdate((e.target as HTMLInputElement).value)}
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
                  fontSize: 16,
                }}
              />

              {/* Always render this container so DOM doesn't jump */}
              <div style={{ width: 26, display: "flex", justifyContent: "flex-end" }}>
                {queryUI.length > 0 && (
                  <button
                    onClick={clearSearch}
                    style={{ border: "none", background: "transparent", color: ui.brand, fontWeight: 900, cursor: "pointer", padding: 0 }}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div style={{ marginTop: 10, color: ui.muted, fontSize: 13, fontWeight: 800 }}>
              {searchActive ? `Showing ${mealListToShow.length} of ${meals.length}` : `Type at least 3 letters • Showing ${meals.length} meals`}
            </div>
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
          </div>
        )}
      </>
    )
  }

  function renderBasketPage() {
    return (
      <>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <button
            onClick={clearBasketOnly}
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
  }

  function renderListPage() {
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

  function renderSettingsPage() {
    return (
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
  }

  const content =
    page === "meals" ? renderMealsPage() : page === "basket" ? renderBasketPage() : page === "list" ? renderListPage() : renderSettingsPage()

  return renderShell(content)
}