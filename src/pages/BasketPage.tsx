import { PLACEHOLDER_MEAL_IMAGE_URL, type Meal } from "../data/loadMeals"
import type { UITheme } from "../styles/theme"
import type { Page } from "../components/BottomNav"

function formatCalories(calories: number | null) {
  return calories != null ? `${calories} cal` : "Calories n/a"
}

function formatTime(totalTime: number | null) {
  return totalTime != null ? `${totalTime} mins` : "Time n/a"
}

export function BasketPage({
  basketMeals,
  ui,
  theme,
  toggleMeal,
  clearBasketOnly,
  clearAll,
  setPage,
}: {
  basketMeals: Meal[]
  ui: UITheme
  theme: "light" | "dark"
  toggleMeal: (mealId: string) => void
  clearBasketOnly: () => void
  clearAll: () => void
  setPage: (p: Page) => void
}) {
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

      <div
        style={{
          background: ui.card,
          borderRadius: 16,
          padding: 14,
          boxShadow: ui.shadow,
          border: `1px solid ${ui.border}`,
        }}
      >
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
                <img
                  src={m.imageUrl}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = PLACEHOLDER_MEAL_IMAGE_URL
                  }}
                  style={{ width: 52, height: 52, borderRadius: 12, objectFit: "cover" }}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, color: ui.brand }}>{m.name}</div>
                  <div style={{ color: ui.muted, fontSize: 13 }}>
                    {formatCalories(m.calories)} • {formatTime(m.totalTime)}
                  </div>
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