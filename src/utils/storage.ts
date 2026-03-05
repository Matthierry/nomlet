type Theme = "light" | "dark"

export const LS_BASKET = "nomlet:basket"
export const LS_THEME = "nomlet:theme"
export const LS_CHECKS = "nomlet:checks"
export const LS_EDITS = "nomlet:edits"

export type ChecksMap = Record<string, boolean>
export type EditsMap = Record<string, number>

export function safeJsonParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function loadBasket(): string[] {
  const arr = safeJsonParse<any>(localStorage.getItem(LS_BASKET), [])
  return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : []
}
export function saveBasket(ids: string[]) {
  localStorage.setItem(LS_BASKET, JSON.stringify(ids))
}

export function loadTheme(): Theme {
  const t = localStorage.getItem(LS_THEME)
  return t === "dark" ? "dark" : "light"
}
export function saveTheme(t: Theme) {
  localStorage.setItem(LS_THEME, t)
}

export function loadChecks(): ChecksMap {
  const obj = safeJsonParse<any>(localStorage.getItem(LS_CHECKS), {})
  return obj && typeof obj === "object" ? obj : {}
}
export function saveChecks(m: ChecksMap) {
  localStorage.setItem(LS_CHECKS, JSON.stringify(m))
}

export function loadEdits(): EditsMap {
  const obj = safeJsonParse<any>(localStorage.getItem(LS_EDITS), {})
  return obj && typeof obj === "object" ? obj : {}
}
export function saveEdits(m: EditsMap) {
  localStorage.setItem(LS_EDITS, JSON.stringify(m))
}