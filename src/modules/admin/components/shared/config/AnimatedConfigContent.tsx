import type { ReactNode } from 'react';
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'motion/react';

interface Props {
  open: boolean;
  id: string;
  labelledBy: string;
  className?: string;
  children: ReactNode;
}

export function AnimatedConfigContent({ open, ...props }: Props): ReactNode {
  return <AnimatePresence initial={false}>{open && <Content {...props} />}</AnimatePresence>;
}

function Content({ id, labelledBy, className, children }: Omit<Props, 'open'>): ReactNode {
  const present = useIsPresent();
  const reduceMotion = useReducedMotion();
  return <motion.div id={id} role="region" aria-labelledby={labelledBy} aria-hidden={!present} inert={!present}
    initial={reduceMotion ? false : { height: 0, opacity: 0, overflow: 'hidden' }}
    animate={{ height: 'auto', opacity: 1, overflow: 'hidden', transitionEnd: { overflow: 'visible' } }}
    exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
    transition={{ duration: reduceMotion ? 0 : 0.22, ease: 'easeInOut' }}>
    {/* Release overflow after expanding so the table toolbar can stick to the page. */}
    <div className={className}>{children}</div>
  </motion.div>;
}
