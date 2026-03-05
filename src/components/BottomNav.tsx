import type { UITheme } from "../styles/theme"

export type Page = "meals" | "basket" | "list" | "settings"

export function BottomNav({
  page,
  setPage,
  basketCount,
  ui,
}: {
  page: Page
  setPage: (p: Page) => void
  basketCount: number
  ui: UITheme
}) {
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