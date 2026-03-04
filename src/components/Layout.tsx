import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import type { NomletContext } from '../lib/outlet-context';

interface LayoutProps {
  context: NomletContext;
}

export const Layout = ({ context }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-nomlet-offwhite pb-24 text-slate-800 dark:bg-[#4A5959] dark:text-slate-100">
      <main className="mx-auto w-full max-w-2xl px-4 pb-4 pt-5">
        <Outlet context={context} />
      </main>
      <BottomNav />
    </div>
  );
};
