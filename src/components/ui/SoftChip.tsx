import React from 'react';
import { cn } from '../../lib/utils';

type SoftChipProps = {
  label: string;
  active?: boolean;
  color?: string; // hex or tailwind class
  onClick?: () => void;
};

export default function SoftChip({
  label,
  active = false,
  color,
  onClick,
}: SoftChipProps) {
  return (
    <span
      onClick={onClick}
      className={cn(
        "inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200 select-none border",
        active 
          ? "bg-[var(--color-primary)] text-white border-transparent shadow-[0_2px_10px_rgba(0,207,204,0.2)]" 
          : "bg-white text-[var(--color-text-secondary)] border-gray-100/60 shadow-sm hover:border-gray-200",
        onClick && "cursor-pointer active:scale-95",
      )}
      style={!active && color ? { borderLeft: `4px solid ${color}` } : undefined}
    >
      {label}
    </span>
  );
}
