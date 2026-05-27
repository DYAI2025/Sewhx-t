import React from 'react';
import { cn } from '../../lib/utils';

type SoftButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
};

export default function SoftButton({
  children,
  variant = 'primary',
  disabled = false,
  onClick,
  className,
}: SoftButtonProps) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "px-6 py-3 rounded-full font-bold text-sm tracking-wide transition-all duration-200 outline-none select-none active:scale-[0.97]",
        variant === 'primary' && "bg-[var(--color-primary)] text-white hover:opacity-90 clay-button hover:shadow-cyan-100",
        variant === 'secondary' && "bg-[#ffffff] text-[var(--color-text-primary)] border border-gray-100 clay-button hover:bg-gray-50",
        variant === 'ghost' && "bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-gray-100/50",
        variant === 'danger' && "bg-rose-500 text-white clay-button hover:bg-rose-600",
        disabled && "opacity-50 cursor-not-allowed scale-100 active:scale-100 shadow-none hover:bg-transparent",
        className
      )}
    >
      {children}
    </button>
  );
}
