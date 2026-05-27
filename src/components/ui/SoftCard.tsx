import React from 'react';
import { cn } from '../../lib/utils';

type SoftCardProps = {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  active?: boolean;
  onClick?: () => void;
  key?: React.Key;
};

export default function SoftCard({
  children,
  className,
  interactive = false,
  active = false,
  onClick,
}: SoftCardProps) {
  return (
    <div
      onClick={interactive ? onClick : undefined}
      className={cn(
        "clay-card rounded-[32px] p-6 bg-white border border-white/40 transition-all duration-300",
        interactive && "cursor-pointer hover:scale-[1.01] hover:shadow-xl active:scale-[0.99]",
        active && "ring-2 ring-[var(--color-primary)] bg-gradient-to-br from-white to-[#f0fffe]",
        className
      )}
    >
      {children}
    </div>
  );
}
