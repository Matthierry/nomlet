import { useOutletContext } from 'react-router-dom';
import type { NomletContext } from '../lib/outlet-context';

export const SettingsPage = () => {
  const { theme, setTheme } = useOutletContext<NomletContext>();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      <article className="rounded-2xl bg-white p-4 shadow-soft dark:bg-[#566565]">
        <h2 className="mb-2 font-semibold">Appearance</h2>
        <label className="flex items-center justify-between text-sm">
          <span>Dark mode</span>
          <input
            type="checkbox"
            checked={theme === 'dark'}
            onChange={(event) => setTheme(event.target.checked ? 'dark' : 'light')}
            className="h-5 w-5 accent-nomlet-sage"
          />
        </label>
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-soft dark:bg-[#566565]">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-nomlet-pink font-semibold text-slate-800">N</div>
          <div>
            <h2 className="font-semibold">Nomlet</h2>
            <p className="text-sm text-slate-500 dark:text-slate-200">Meals picked. Shop sorted.</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-100">
          The ability to request meals to be added to the site will come soon.
        </p>
      </article>
    </section>
  );
};
