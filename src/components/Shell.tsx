import type { UITheme } from "../styles/theme";
import { BottomNav, type Page } from "./BottomNav";

export function Shell({
  ui,
  page,
  setPage,
  basketCount,
  children,
}: {
  ui: UITheme;
  page: Page;
  setPage: (p: Page) => void;
  basketCount: number;
  children: React.ReactNode;
}) {
  const headerSrc = `${import.meta.env.BASE_URL}images/nomlet-header-transparent.png`;

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
        {/* Small header logo (left aligned) */}
        <div style={{ marginBottom: 18 }}>
          <img
            src={headerSrc}
            alt="Nomlet"
            style={{
              width: 110, // ~25% of previous ~420px hero size
              height: "auto",
              display: "block",
            }}
          />
        </div>

        {children}
      </div>

      <BottomNav
        page={page}
        setPage={setPage}
        basketCount={basketCount}
        ui={ui}
      />
    </div>
  );
}