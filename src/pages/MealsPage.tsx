import { useEffect, useMemo, useRef, useState } from "react";
import type { Meal } from "../data/loadMeals";
import type { UITheme } from "../styles/theme";

const MEALS_SCROLL_KEY = "nomlet:scrollY:meals";

export function MealsPage({
  meals,
  basket,
  toggleMeal,
  ui,
  loading,
  error,
}: {
  meals: Meal[];
  basket: string[];
  toggleMeal: (mealId: string) => void;
  ui: UITheme;
  loading: boolean;
  error: string | null;
}) {
  // ---------- Search (simple, stable) ----------
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [queryUI, setQueryUI] = useState("");
  const debounceTimer = useRef<number | null>(null);

  function scheduleQueryUpdate(next: string) {
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => {
      setQuery(next);
      setQueryUI(next);
    }, 120);
  }

  function clearSearch() {
    if (searchInputRef.current) searchInputRef.current.value = "";
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    setQuery("");
    setQueryUI("");
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }

  // Search rule remains: filter only when 3+ letters (but we don't tell the user)
  const queryTrim = query.trim();
  const searchActive = queryTrim.length >= 3;
  const queryLower = queryTrim.toLowerCase();

  const mealListToShow = useMemo(() => {
    if (!searchActive) return meals;
    return meals.filter((m) => m.name.toLowerCase().includes(queryLower));
  }, [meals, searchActive, queryLower]);

  // ---------- Scroll position memory ----------
  const restoreDoneRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  // Restore once on mount
  useEffect(() => {
    if (restoreDoneRef.current) return;

    const raw = sessionStorage.getItem(MEALS_SCROLL_KEY);
    const y = raw ? Number(raw) : 0;

    // Defer until after initial paint so layout exists
    requestAnimationFrame(() => {
      if (Number.isFinite(y) && y > 0) {
        window.scrollTo({ top: y, left: 0, behavior: "auto" });
      }
      restoreDoneRef.current = true;
    });
  }, []);

  // Save on scroll (throttled with rAF)
  useEffect(() => {
    const onScroll = () => {
      if (rafIdRef.current != null) return;
      rafIdRef.current = window.requestAnimationFrame(() => {
        sessionStorage.setItem(MEALS_SCROLL_KEY, String(window.scrollY || 0));
        rafIdRef.current = null;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafIdRef.current != null) window.cancelAnimationFrame(rafIdRef.current);
      // Save one last time on unmount
      sessionStorage.setItem(MEALS_SCROLL_KEY, String(window.scrollY || 0));
    };
  }, []);

  return (
    <>
      {/* Sticky Search */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: ui.bg,
          paddingTop: 2,
          paddingBottom: 10,
          backdropFilter: "blur(10px)",
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
            {/* Minimal search icon */}
            <span
              aria-hidden="true"
              style={{
                width: 18,
                height: 18,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: ui.muted,
                flex: "0 0 auto",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: "block" }}
              >
                <path
                  d="M10.5 18a7.5 7.5 0 1 1 0-15a7.5 7.5 0 0 1 0 15Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M16.3 16.3L21 21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>

            <input
              ref={searchInputRef}
              defaultValue=""
              onInput={(e) => scheduleQueryUpdate((e.target as HTMLInputElement).value)}
              placeholder="Search meals…"
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
                  style={{
                    border: "none",
                    background: "transparent",
                    color: ui.brand,
                    fontWeight: 900,
                    cursor: "pointer",
                    padding: 0,
                    fontSize: 16,
                    lineHeight: 1,
                  }}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Info line (no "type 3 letters" instruction) */}
          <div style={{ marginTop: 10, color: ui.muted, fontSize: 13, fontWeight: 800 }}>
            {searchActive ? `Showing ${mealListToShow.length} of ${meals.length}` : `Showing ${meals.length} meals`}
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
            const inBasket = basket.includes(meal.id);
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
            );
          })}
        </div>
      )}
    </>
  );
}