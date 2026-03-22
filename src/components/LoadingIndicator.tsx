import { motion } from 'framer-motion';

interface LoadingIndicatorProps {
  message?: string;
}

export default function LoadingIndicator({
  message = 'AI analizira i gradi plan časa...',
}: LoadingIndicatorProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-primary to-secondary"
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground font-medium">{message}</span>
    </div>
  );
}
