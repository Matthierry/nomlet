import { useEffect, useMemo, useState } from "react"
import { loadMeals, type Meal } from "./data/loadMeals"
import type { Page } from "./components/BottomNav"
import type { Theme } from "./styles/theme"

import { Shell } from "./components/Shell"
import { MealsPage } from "./pages/MealsPage"
import { BasketPage } from "./pages/BasketPage"
import { ListPage } from "./pages/ListPage"
import { SettingsPage } from "./pages/SettingsPage"

import { getUI } from "./styles/theme"
import {
  loadBasket,
  loadChecks,
  loadEdits,
  loadFavourites,
  loadTheme,
  saveBasket,
  saveChecks,
  saveEdits,
  saveFavourites,
  saveTheme,
  type ChecksMap,
  type EditsMap,
} from "./utils/storage"

export default function App() {
  const [page, setPage] = useState<Page>("meals")
  const [theme, setTheme] = useState<Theme>(() => loadTheme())

  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [basket, setBasket] = useState<string[]>(() => loadBasket())
  const [checks, setChecks] = useState<ChecksMap>(() => loadChecks())
  const [edits, setEdits] = useState<EditsMap>(() => loadEdits())
  const [favourites, setFavourites] = useState<string[]>(() => loadFavourites())

  useEffect(() => saveTheme(theme), [theme])
  useEffect(() => saveBasket(basket), [basket])
  useEffect(() => saveChecks(checks), [checks])
  useEffect(() => saveEdits(edits), [edits])
  useEffect(() => saveFavourites(favourites), [favourites])

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await loadMeals()
        setMeals(data)
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load meals"
        setError(message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const ui = useMemo(() => getUI(theme), [theme])

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

  function toggleFavourite(mealId: string) {
    setFavourites((prev) => {
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
  }

  const content =
    page === "meals" ? (
      <MealsPage
        meals={meals}
        basket={basket}
        favourites={favourites}
        toggleMeal={toggleMeal}
        toggleFavourite={toggleFavourite}
        setPage={setPage}
        ui={ui}
        loading={loading}
        error={error}
      />
    ) : page === "basket" ? (
      <BasketPage
        basketMeals={basketMeals}
        ui={ui}
        theme={theme}
        toggleMeal={toggleMeal}
        clearBasketOnly={clearBasketOnly}
        clearAll={clearAll}
        setPage={setPage}
      />
    ) : page === "list" ? (
      <ListPage
        basketMeals={basketMeals}
        ui={ui}
        theme={theme}
        checks={checks}
        setChecks={setChecks}
        edits={edits}
        setEdits={setEdits}
        clearAll={clearAll}
      />
    ) : (
      <SettingsPage ui={ui} theme={theme} setTheme={setTheme} clearAll={clearAll} />
    )

  return (
    <Shell ui={ui} page={page} setPage={setPage} basketCount={basketCount}>
      {content}
    </Shell>
  )
}
