import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../lib/constants';

export const BottomNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur dark:border-slate-700 dark:bg-nomlet-sage/95">
    <ul className="mx-auto grid w-full max-w-2xl grid-cols-4 gap-1">
      {NAV_ITEMS.map((item) => (
        <li key={item.path}>
          <NavLink
            to={item.path}
            className={({ isActive }) =>
              `block rounded-xl px-2 py-2 text-center text-xs font-medium transition ${
                isActive
                  ? 'bg-nomlet-teal text-nomlet-sage dark:bg-nomlet-aqua dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-200'
              }`
            }
          >
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>
);
