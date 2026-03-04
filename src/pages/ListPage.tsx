import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { formatListForCopy } from '../lib/ingredients';
import type { NomletContext } from '../lib/outlet-context';

export const ListPage = () => {
  const { consolidated, checks, edits, setChecks, setEdits, clearAll } = useOutletContext<NomletContext>();
  const [copied, setCopied] = useState(false);

  const rows = useMemo(
    () =>
      consolidated.map((item) => ({
        ...item,
        quantity: edits[item.key] ?? item.quantity,
        checked: checks[item.key] ?? false,
      })),
    [consolidated, edits, checks],
  );

  const handleCopy = async () => {
    const text = formatListForCopy(rows);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Shopping list</h1>

      {rows.length === 0 ? (
        <p className="rounded-xl bg-white p-4 text-sm shadow-soft dark:bg-[#566565]">
          Add meals first to generate your shopping list.
        </p>
      ) : (
        <>
          <ul className="space-y-2">
            {rows.map((item) => (
              <li key={item.key} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-soft dark:bg-[#566565]">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(event) => setChecks((prev) => ({ ...prev, [item.key]: event.target.checked }))}
                  className="h-5 w-5 accent-nomlet-sage"
                />
                <span className={`flex-1 text-sm ${item.checked ? 'line-through opacity-60' : ''}`}>{item.name}</span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={item.quantity}
                  onChange={(event) =>
                    setEdits((prev) => ({ ...prev, [item.key]: Number(event.target.value) || 0 }))
                  }
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm dark:border-slate-600 dark:bg-[#667575]"
                />
                <span className="w-12 text-xs text-slate-500 dark:text-slate-200">{item.unit}</span>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopy}
              className="rounded-xl bg-nomlet-aqua px-4 py-3 text-sm font-semibold text-slate-800"
            >
              {copied ? 'Copied!' : 'Copy list'}
            </button>
            <button
              onClick={clearAll}
              className="rounded-xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 dark:bg-slate-700 dark:text-slate-100"
            >
              Clear all
            </button>
          </div>
        </>
      )}
    </section>
  );
};
