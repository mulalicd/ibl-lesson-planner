import { Link, useLocation } from 'react-router-dom';
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
    <header className="flex-shrink-0 h-16 bg-card border-b border-border/30 shadow-depth-2 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between gap-4">
        {/* Official IDSS logo (Director-supplied, 2026-11-06), served locally
            from /public/brand (no hot-link). Colours snapped to the exact
            five IDSS hex values (CONSTITUTION rule 6); original kept as
            public/brand/idss-logo-original.png. */}
        <Link to="/chat" className="flex items-center gap-3 group flex-shrink-0" aria-label="IBL Planer — početna">
          <img
            src="/brand/idss-logo.png"
            alt="Internationale Deutsche Schule Sarajevo"
            width={1460}
            height={443}
            className="h-8 sm:h-9 w-auto"
          />
          <span className="hidden md:block border-l border-border/60 pl-3 text-sm font-bold text-foreground tracking-tight">
            IBL Planer
          </span>
        </Link>

        {/* Center Nav */}
        <nav className="flex items-center gap-1 p-1 rounded-2xl bg-muted/40">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'relative flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  active
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 rounded-xl bg-primary shadow-depth-2"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <item.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Version badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="hidden md:flex items-center gap-1.5 text-[10px] text-muted-foreground/50 font-semibold bg-muted/30 px-3 py-1.5 rounded-full">
            <Sparkles className="w-3 h-3" /> PSI v8.0
          </span>
          {session && (
            <button
              type="button"
              onClick={() => { void signOut().then(() => window.location.assign('/login')); }}
              title={`Odjava (${session.user.email ?? ''})`}
              aria-label="Odjava"
              className="w-10 h-10 rounded-xl neu-btn flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
