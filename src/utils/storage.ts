type Theme = "light" | "dark"

export const LS_BASKET = "nomlet:basket"
export const LS_THEME = "nomlet:theme"
export const LS_CHECKS = "nomlet:checks"
export const LS_EDITS = "nomlet:edits"
export const LS_FAVOURITES = "nomlet:favourites"
export const LS_EXTRAS = "nomlet:extras"

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function loadBasket(): string[] {
  const arr = safeJsonParse<unknown>(localStorage.getItem(LS_BASKET), [])
  return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : []
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
  const value = safeJsonParse<unknown>(localStorage.getItem(LS_CHECKS), {})
  if (!isRecord(value)) return {}

  const out: ChecksMap = {}
  Object.entries(value).forEach(([key, item]) => {
    if (typeof item === "boolean") out[key] = item
  })
  return out
}
export function saveChecks(m: ChecksMap) {
  localStorage.setItem(LS_CHECKS, JSON.stringify(m))
}

export function loadEdits(): EditsMap {
  const value = safeJsonParse<unknown>(localStorage.getItem(LS_EDITS), {})
  if (!isRecord(value)) return {}

  const out: EditsMap = {}
  Object.entries(value).forEach(([key, item]) => {
    if (typeof item === "number" && Number.isFinite(item)) out[key] = item
  })
  return out
}
export function saveEdits(m: EditsMap) {
  localStorage.setItem(LS_EDITS, JSON.stringify(m))
}

export function loadFavourites(): string[] {
  const arr = safeJsonParse<unknown>(localStorage.getItem(LS_FAVOURITES), [])
  return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : []
}

export function saveFavourites(ids: string[]) {
  localStorage.setItem(LS_FAVOURITES, JSON.stringify(ids))
}

export function loadExtras(): string[] {
  const arr = safeJsonParse<unknown>(localStorage.getItem(LS_EXTRAS), [])
  return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : []
}

export function saveExtras(items: string[]) {
  localStorage.setItem(LS_EXTRAS, JSON.stringify(items))
}
