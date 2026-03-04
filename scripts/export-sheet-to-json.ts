import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/REPLACE_WITH_SHEET_ID/pub?gid=0&single=true&output=csv';

interface CsvRow {
  meal_id: string;
  meal_name: string;
  recipe_url: string;
  image_url?: string;
  ingredient_name: string;
  ingredient_quantity: string;
  ingredient_unit: string;
}

const parseCsvLine = (line: string) => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
};

const toRows = (csv: string): CsvRow[] => {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const [headerLine, ...dataLines] = lines;
  const headers = parseCsvLine(headerLine);

  return dataLines.map((line) => {
    const values = parseCsvLine(line);
    const record = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    return record as unknown as CsvRow;
  });
};

const exportData = async () => {
  const response = await fetch(SHEET_CSV_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
  }

  const csv = await response.text();
  const rows = toRows(csv);

  const grouped = new Map<string, any>();

  rows.forEach((row) => {
    if (!grouped.has(row.meal_id)) {
      grouped.set(row.meal_id, {
        id: row.meal_id,
        name: row.meal_name,
        image: row.image_url || '/images/placeholder-meal.svg',
        serves: 2,
        calories: null,
        recipeUrl: row.recipe_url,
        ingredients: [],
      });
    }

    grouped.get(row.meal_id).ingredients.push({
      name: row.ingredient_name,
      quantity: Number(row.ingredient_quantity) || 0,
      unit: row.ingredient_unit,
    });
  });

  const meals = [...grouped.values()];
  const outputDir = resolve(process.cwd(), 'public/data');

  await mkdir(outputDir, { recursive: true });
  await writeFile(resolve(outputDir, 'meals.json'), JSON.stringify(meals, null, 2));

  console.log(`Exported ${meals.length} meals to public/data/meals.json`);
};

exportData().catch((error: unknown) => {
  console.error('Export failed:', error);
  process.exit(1);
});
