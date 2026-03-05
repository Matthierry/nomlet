export type Theme = "light" | "dark"

export type UITheme = {
  bg: string
  card: string
  card2: string
  text: string
  brand: string
  muted: string
  accent: string
  accentSoft: string
  pink: string
  border: string
  shadow: string
  navBg: string
  navBorder: string
}

export function getUI(theme: Theme): UITheme {
  const light: UITheme = {
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

  const dark: UITheme = {
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
}