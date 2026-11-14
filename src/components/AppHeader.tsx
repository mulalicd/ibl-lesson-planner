import { Link, useLocation } from 'react-router-dom';
import { PSI_VERSION_LABEL } from '@/lib/constants';
import { motion } from 'framer-motion';
import { MessageSquare, LayoutGrid, Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export default function AppHeader() {
  const location = useLocation();
  const { session, signOut } = useAuth();

  const navItems = [
    { path: '/chat', icon: MessageSquare, label: 'Planer' },
    { path: '/dashboard', icon: LayoutGrid, label: 'Planovi' },
  ];

  return (
    // P6 S2 (direction C): a calm white bar above the desk; the five IDSS colours appear only in the mark.
    <header className="sticky top-0 z-50 h-16 flex-shrink-0 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-4 px-4 md:px-8">
        {/* Official IDSS logo (Director-supplied, 2026-11-06), served locally from /public/brand. */}
        <Link to="/chat" className="flex flex-shrink-0 items-center gap-3" aria-label="IBL Planer — početna">
          <img src="/brand/idss-logo.png" alt="Internationale Deutsche Schule Sarajevo" width={1460} height={443} className="h-8 w-auto sm:h-9" />
          <span className="hidden items-center gap-2 border-l border-neutral-200 pl-3 md:flex">
            <span aria-hidden="true" className="flex gap-0.5">
              <span className="h-5 w-1.5 rounded-sm bg-brand-blue" /><span className="h-5 w-1.5 rounded-sm bg-brand-lightblue" />
              <span className="h-5 w-1.5 rounded-sm bg-brand-yellow" /><span className="h-5 w-1.5 rounded-sm bg-brand-red" />
              <span className="h-5 w-1.5 rounded-sm bg-black" />
            </span>
            <span className="font-display text-[15px] font-extrabold tracking-tight">IBL Planer</span>
          </span>
        </Link>

        <nav aria-label="Glavna navigacija" className="flex h-full items-stretch gap-1">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-2 px-4 text-sm font-semibold transition-colors',
                  active ? 'text-primary' : 'text-neutral-600 hover:text-black',
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
                {active && <motion.span layoutId="active-tab" className="absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-primary" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-shrink-0 items-center gap-3">
          <span className="hidden items-center gap-1.5 text-[11px] font-semibold text-neutral-500 md:flex">
            <Sparkles className="h-3 w-3" /> {PSI_VERSION_LABEL}
          </span>
          {session && (
            <button
              type="button"
              onClick={() => { void signOut().then(() => window.location.assign('/login')); }}
              title={`Odjava (${session.user.email ?? ''})`}
              aria-label="Odjava"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-colors hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
