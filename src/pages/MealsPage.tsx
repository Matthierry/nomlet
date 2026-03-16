import { useEffect, useMemo, useRef, useState } from "react"
import type { Meal } from "../data/loadMeals"
import type { UITheme } from "../styles/theme"
import type { Page } from "../components/BottomNav"

const MEALS_SCROLL_KEY = "nomlet:scrollY:meals"

type PrepFilter = "all" | "under10" | "under20" | "under30"

function formatCalories(calories: number | null) {
  return calories != null ? `${calories} cal` : "n/a"
}

function formatMinutes(value: number | null) {
  return value != null ? `${value} mins` : "n/a"
}

function prepFilterMatches(meal: Meal, prepFilter: PrepFilter) {
  if (prepFilter === "all") return true
  if (meal.prepTime == null) return false
  if (prepFilter === "under10") return meal.prepTime < 10
  if (prepFilter === "under20") return meal.prepTime < 20
  return meal.prepTime < 30
}

export function MealsPage({
  meals,
  basket,
  favourites,
  toggleMeal,
  toggleFavourite,
  setPage,
  ui,
  loading,
  error,
}: {
  meals: Meal[]
  basket: string[]
  favourites: string[]
  toggleMeal: (mealId: string) => void
  toggleFavourite: (mealId: string) => void
  setPage: (p: Page) => void
  ui: UITheme
  loading: boolean
  error: string | null
}) {
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [query, setQuery] = useState("")
  const [queryUI, setQueryUI] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [prepFilter, setPrepFilter] = useState<PrepFilter>("all")
  const [favouritesOnly, setFavouritesOnly] = useState(false)
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
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

  const categoryOptions = useMemo(() => {
    const categories = new Set<string>()
    meals.forEach((meal) => {
      const cat = meal.foodCat.trim()
      if (cat) categories.add(cat)
    })
    return ["All", ...Array.from(categories).sort((a, b) => a.localeCompare(b))]
  }, [meals])

  const queryLower = query.trim().toLowerCase()

  const filteredMeals = useMemo(() => {
    return meals.filter((meal) => {
      const matchesQuery =
        queryLower.length < 2 ||
        meal.name.toLowerCase().includes(queryLower) ||
        meal.foodCat.toLowerCase().includes(queryLower)
      const matchesCategory = activeCategory === "All" || meal.foodCat === activeCategory
      const matchesPrep = prepFilterMatches(meal, prepFilter)
      const matchesFavourite = !favouritesOnly || favourites.includes(meal.id)

      return matchesQuery && matchesCategory && matchesPrep && matchesFavourite
    })
  }, [meals, queryLower, activeCategory, prepFilter, favouritesOnly, favourites])

  const selectedMeal = useMemo(
    () => filteredMeals.find((meal) => meal.id === selectedMealId) ?? meals.find((meal) => meal.id === selectedMealId) ?? null,
    [selectedMealId, filteredMeals, meals]
  )

  function pickRandomMeal() {
    if (filteredMeals.length === 0) return
    const randomIndex = Math.floor(Math.random() * filteredMeals.length)
    setSelectedMealId(filteredMeals[randomIndex].id)
  }

  function showNotice(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(null), 1500)
  }

  const restoreDoneRef = useRef(false)
  const rafIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (restoreDoneRef.current) return

    const raw = sessionStorage.getItem(MEALS_SCROLL_KEY)
    const y = raw ? Number(raw) : 0

    requestAnimationFrame(() => {
      if (Number.isFinite(y) && y > 0) {
        window.scrollTo({ top: y, left: 0, behavior: "auto" })
      }
      restoreDoneRef.current = true
    })
  }, [])

  useEffect(() => {
    const onScroll = () => {
      if (rafIdRef.current != null) return
      rafIdRef.current = window.requestAnimationFrame(() => {
        sessionStorage.setItem(MEALS_SCROLL_KEY, String(window.scrollY || 0))
        rafIdRef.current = null
      })
    }

    window.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", onScroll)
      if (rafIdRef.current != null) window.cancelAnimationFrame(rafIdRef.current)
      sessionStorage.setItem(MEALS_SCROLL_KEY, String(window.scrollY || 0))
    }
  }, [])

  const prepOptions: { id: PrepFilter; label: string }[] = [
    { id: "all", label: "All prep times" },
    { id: "under10", label: "Under 10 mins" },
    { id: "under20", label: "Under 20 mins" },
    { id: "under30", label: "Under 30 mins" },
  ]

  return (
    <>
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: ui.bg, paddingBottom: 10 }}>
        <div
          style={{
            background: ui.card,
            borderRadius: 18,
            padding: 12,
            boxShadow: ui.shadow,
            border: `1px solid ${ui.border}`,
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
            <input
              ref={searchInputRef}
              defaultValue=""
              onInput={(e) => scheduleQueryUpdate((e.target as HTMLInputElement).value)}
              placeholder="Search meals"
              style={{
                flex: 1,
                border: `1px solid ${ui.border}`,
                borderRadius: 14,
                background: ui.card2,
                color: ui.text,
                fontSize: 16,
                fontWeight: 700,
                padding: "12px 14px",
              }}
            />
            {queryUI.length > 0 && (
              <button
                onClick={clearSearch}
                style={{
                  border: `1px solid ${ui.border}`,
                  borderRadius: 12,
                  background: ui.card2,
                  color: ui.brand,
                  fontWeight: 900,
                  width: 44,
                  height: 44,
                }}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {categoryOptions.map((cat) => {
              const active = cat === activeCategory
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    borderRadius: 999,
                    padding: "8px 12px",
                    border: `1px solid ${active ? ui.accent : ui.border}`,
                    background: active ? ui.accentSoft : ui.card2,
                    color: ui.text,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                  }}
                >
                  {cat}
                </button>
              )
            })}
          </div>

          <div style={{ display: "flex", gap: 8, overflowX: "auto", marginTop: 8, paddingBottom: 4 }}>
            {prepOptions.map((opt) => {
              const active = prepFilter === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => setPrepFilter(opt.id)}
                  style={{
                    borderRadius: 999,
                    padding: "8px 12px",
                    border: `1px solid ${active ? ui.accent : ui.border}`,
                    background: active ? ui.accentSoft : ui.card2,
                    color: ui.text,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                  }}
                >
                  {opt.label}
                </button>
              )
            })}

            <button
              onClick={() => setFavouritesOnly((prev) => !prev)}
              style={{
                borderRadius: 999,
                padding: "8px 12px",
                border: `1px solid ${favouritesOnly ? ui.accent : ui.border}`,
                background: favouritesOnly ? ui.accentSoft : ui.card2,
                color: ui.text,
                fontWeight: 800,
                whiteSpace: "nowrap",
              }}
            >
              {favouritesOnly ? "★ Favourites" : "☆ Favourites"}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
            <div style={{ color: ui.muted, fontSize: 13, fontWeight: 800 }}>
              Showing {filteredMeals.length} of {meals.length}
            </div>

            <button
              onClick={pickRandomMeal}
              disabled={filteredMeals.length === 0}
              style={{
                borderRadius: 12,
                border: `1px solid ${ui.border}`,
                background: filteredMeals.length === 0 ? ui.card2 : ui.brand,
                color: filteredMeals.length === 0 ? ui.muted : "#fff",
                fontWeight: 900,
                padding: "9px 12px",
              }}
            >
              Pick for me
            </button>
          </div>
        </div>
      </div>

      {loading && <p style={{ color: ui.muted }}>Loading meals…</p>}

      {error && (
        <div style={{ background: ui.card, padding: 12, borderRadius: 12, border: `1px solid ${ui.border}` }}>
          <p style={{ margin: 0, color: ui.pink, fontWeight: 900 }}>Error: {error}</p>
        </div>
      )}

      {!loading && !error && filteredMeals.length === 0 && (
        <div style={{ background: ui.card, borderRadius: 16, border: `1px solid ${ui.border}`, padding: 16 }}>
          <p style={{ margin: 0, fontWeight: 800, color: ui.muted }}>No meals match these filters.</p>
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: "grid", gap: 12 }}>
          {filteredMeals.map((meal) => {
            const inBasket = basket.includes(meal.id)
            const isFavourite = favourites.includes(meal.id)

            return (
              <div
                key={meal.id}
                style={{
                  background: ui.card,
                  borderRadius: 18,
                  overflow: "hidden",
                  boxShadow: ui.shadow,
                  border: `1px solid ${ui.border}`,
                }}
              >
                <button
                  onClick={() => setSelectedMealId(meal.id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  <img src={meal.imageUrl} alt="" loading="lazy" style={{ width: "100%", height: 170, objectFit: "cover" }} />

                  <div style={{ padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 900, color: ui.text, fontSize: 19, lineHeight: 1.2 }}>{meal.name}</div>
                        <div style={{ marginTop: 8, color: ui.muted, fontSize: 14 }}>
                          Prep {formatMinutes(meal.prepTime)} • Cook {formatMinutes(meal.cookTime)}
                        </div>
                        <div style={{ marginTop: 4, color: ui.muted, fontSize: 14 }}>
                          {meal.foodCat || "General"} • {formatCalories(meal.calories)}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavourite(meal.id)
                        }}
                        aria-label={isFavourite ? "Remove favourite" : "Add favourite"}
                        style={{
                          border: `1px solid ${ui.border}`,
                          background: ui.card2,
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          fontSize: 20,
                        }}
                      >
                        {isFavourite ? "★" : "☆"}
                      </button>
                    </div>
                  </div>
                </button>

                <div style={{ padding: "0 14px 14px" }}>
                  <button
                    onClick={() => {
                      toggleMeal(meal.id)
                      showNotice(inBasket ? "Removed from basket" : "Added to basket")
                    }}
                    style={{
                      width: "100%",
                      borderRadius: 14,
                      border: "none",
                      background: inBasket ? ui.pink : ui.brand,
                      color: inBasket ? "#2a2a2a" : "#fff",
                      padding: "13px 14px",
                      fontWeight: 900,
                      fontSize: 16,
                    }}
                  >
                    {inBasket ? "Remove" : "Add to basket"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {basket.length > 0 && (
        <button
          onClick={() => setPage("basket")}
          style={{
            position: "fixed",
            left: 16,
            right: 16,
            bottom: 84,
            zIndex: 30,
            border: "none",
            borderRadius: 16,
            background: ui.brand,
            color: "#fff",
            fontWeight: 900,
            padding: "14px 16px",
            boxShadow: ui.shadow,
          }}
        >
          View basket ({basket.length})
        </button>
      )}

      {selectedMeal && (
        <div
          onClick={() => setSelectedMealId(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 40,
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: ui.card,
              width: "100%",
              maxHeight: "88dvh",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 16,
              overflowY: "auto",
              borderTop: `1px solid ${ui.border}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 21, fontWeight: 900, color: ui.text }}>{selectedMeal.name}</div>
              <button
                onClick={() => setSelectedMealId(null)}
                style={{ borderRadius: 12, border: `1px solid ${ui.border}`, width: 42, height: 42, background: ui.card2, fontWeight: 900 }}
              >
                ✕
              </button>
            </div>

            {selectedMeal.description && <p style={{ marginTop: 0, color: ui.muted }}>{selectedMeal.description}</p>}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8, marginBottom: 12 }}>
              <div style={{ background: ui.card2, borderRadius: 12, padding: 10 }}>Prep: {formatMinutes(selectedMeal.prepTime)}</div>
              <div style={{ background: ui.card2, borderRadius: 12, padding: 10 }}>Cook: {formatMinutes(selectedMeal.cookTime)}</div>
              <div style={{ background: ui.card2, borderRadius: 12, padding: 10 }}>Calories: {formatCalories(selectedMeal.calories)}</div>
              <div style={{ background: ui.card2, borderRadius: 12, padding: 10 }}>Category: {selectedMeal.foodCat || "General"}</div>
            </div>

            <div style={{ fontWeight: 900, marginBottom: 8 }}>Ingredients</div>
            <ul style={{ marginTop: 0, paddingLeft: 18 }}>
              {selectedMeal.ingredients.map((ing, index) => (
                <li key={`${selectedMeal.id}-${ing.name}-${index}`} style={{ marginBottom: 6 }}>
                  {ing.name} x {ing.quantity} {ing.unit}
                </li>
              ))}
            </ul>

            {selectedMeal.recipeUrl && (
              <a
                href={selectedMeal.recipeUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: 6,
                  color: ui.brand,
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                Open recipe
              </a>
            )}

            <button
              onClick={() => {
                toggleMeal(selectedMeal.id)
                showNotice(basket.includes(selectedMeal.id) ? "Removed from basket" : "Added to basket")
              }}
              style={{
                marginTop: 14,
                width: "100%",
                border: "none",
                borderRadius: 14,
                background: basket.includes(selectedMeal.id) ? ui.pink : ui.brand,
                color: basket.includes(selectedMeal.id) ? "#2a2a2a" : "#fff",
                padding: "13px 14px",
                fontWeight: 900,
                fontSize: 16,
              }}
            >
              {basket.includes(selectedMeal.id) ? "Remove from basket" : "Add to basket"}
            </button>
          </div>
        </div>
      )}

      {notice && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: 148,
            zIndex: 50,
            background: ui.text,
            color: ui.bg,
            borderRadius: 999,
            padding: "8px 12px",
            fontWeight: 800,
          }}
        >
          {notice}
        </div>
      )}
    </>
  )
}
