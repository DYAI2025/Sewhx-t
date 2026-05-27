import React from 'react';
import { cn } from '../../lib/utils';

type SoftToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
};

export default function SoftToggle({ checked, onChange, label }: SoftToggleProps) {
  return (
    <label className="flex items-center space-x-3 cursor-pointer select-none">
      <div 
        onClick={() => onChange(!checked)}
        className={cn(
          "w-12 h-6 rounded-full p-0.5 transition-all duration-300",
          checked ? "bg-[var(--color-primary)]" : "bg-gray-200"
        )}
      >
        <div 
          className={cn(
            "w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300",
            checked ? "translate-x-6" : "translate-x-0"
          )}
        />
      </div>
      <span className="text-sm font-semibold text-[var(--color-text-primary)]">{label}</span>
    </label>
  );
}
