# Nomlet

**Meals picked. Shop sorted.**

Nomlet is a mobile-first meal selector that generates one consolidated shopping list from selected meals.

## Tech stack
- Vite + React + TypeScript
- Tailwind CSS
- Hash routing (`#/meals`, `#/basket`, etc.) for GitHub Pages compatibility
- localStorage persistence for basket, checks, quantity edits, and theme

## Data source: Google Sheets -> static JSON
Nomlet does **not** call Google APIs at runtime. Instead, data is exported at build time.

### 1) Prepare your Google Sheet
Create or publish a tab with columns:

`meal_id, meal_name, recipe_url, image_url(optional), ingredient_name, ingredient_quantity, ingredient_unit`

Each ingredient should be one row (multiple rows per meal).

### 2) Publish to web and get CSV URL
1. In Google Sheets: **File -> Share -> Publish to web**.
2. Select your data tab and choose **CSV** format.
3. Copy the generated URL.
4. Replace `SHEET_CSV_URL` in `scripts/export-sheet-to-json.ts`.

### 3) Export data
```bash
npm run export:data
```

This writes `/public/data/meals.json`.

> A sample fallback file is already included for local development.

## Local development
```bash
npm install
npm run dev
```

## Production build
```bash
npm run build
```

The build script automatically runs `export:data` first.

## Deploy to GitHub Pages
1. `vite.config.ts` uses `base: './'` so built assets stay relative and work on GitHub Pages project paths.
2. Run:
   ```bash
   npm run deploy
   ```
3. In GitHub repo settings, use the `gh-pages` branch for Pages hosting.

## Weekly content update workflow
1. Update your Google Sheet meal rows.
2. Run:
   ```bash
   npm run export:data
   npm run deploy
   ```

## Where to edit branding/colors
- Tailwind palette: `tailwind.config.ts`
- Typography/global basics: `src/styles.css`
- About card and logo mark: `src/pages/SettingsPage.tsx`

## Project structure
- `src/components` reusable UI components
- `src/pages` route screens
- `src/lib` helpers/state/data logic
- `scripts` build-time exporter
- `public/data` generated JSON data
