import type { UITheme } from "../styles/theme"
import type { Theme } from "../styles/theme"
import { canInstallPWA, installPWA } from "../pwa"

export function SettingsPage({
  ui,
  theme,
  setTheme,
  clearAll,
}: {
  ui: UITheme
  theme: Theme
  setTheme: React.Dispatch<React.SetStateAction<Theme>>
  clearAll: () => void
}) {
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