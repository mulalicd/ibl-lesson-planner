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
    // P6 (direction C; Director 2026-11-14): full width; the IDSS logo carries the colours, so the bar has no colour
    // marks of its own. The app name is large and centred; navigation sits on the right.
    <header className="sticky top-0 z-50 h-16 flex-shrink-0 border-b border-neutral-200 bg-white">
      <div className="relative flex h-full items-center justify-between gap-3 px-3 md:px-6">
        {/* Official IDSS logo (Director-supplied, 2026-11-06), served locally from /public/brand. */}
        <Link to="/chat" className="flex flex-shrink-0 items-center" aria-label="IBL Planer — početna">
          <img src="/brand/idss-logo.png" alt="Internationale Deutsche Schule Sarajevo" width={1460} height={443} className="h-8 w-auto sm:h-9" />
        </Link>

        <span aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-display text-lg font-extrabold tracking-tight text-black sm:text-2xl lg:text-3xl">
          IBL Planer
        </span>

        <div className="flex items-center gap-2 md:gap-3">
        <nav aria-label="Glavna navigacija" className="flex h-16 items-stretch">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-2 px-3 text-sm font-semibold transition-colors lg:px-4',
                  active ? 'text-primary' : 'text-neutral-600 hover:text-black',
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden lg:inline">{item.label}</span>
                {active && <motion.span layoutId="active-tab" className="absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-primary" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-shrink-0 items-center gap-3">
          <span className="hidden items-center gap-1.5 text-[11px] font-semibold text-neutral-500 xl:flex">
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
      </div>
    </header>
  );
}
