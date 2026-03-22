import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, LayoutGrid, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import aiAvatarImg from '@/assets/ai-avatar.jpg';

export default function AppHeader() {
  const location = useLocation();

  const navItems = [
    { path: '/chat', icon: MessageSquare, label: 'Planer' },
    { path: '/dashboard', icon: LayoutGrid, label: 'Planovi' },
  ];

  return (
    <header className="flex-shrink-0 h-16 neu-card border-b border-border/30 sticky top-0 z-50 rounded-none">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/chat" className="flex items-center gap-3 group flex-shrink-0">
          <motion.div
            whileHover={{ rotate: 6, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg shadow-primary/15"
          >
            <img src={aiAvatarImg} alt="IBL Planer" className="w-full h-full object-cover" />
          </motion.div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-foreground tracking-tight leading-tight">
              IBL Planer
            </h1>
            <p className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">
              IDSS Sarajevo
            </p>
          </div>
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
                    className="absolute inset-0 rounded-xl bg-primary shadow-md shadow-primary/20"
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
        </div>
      </div>
    </header>
  );
}
