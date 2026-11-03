import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  title,
  subtitle,
  icon,
  badge,
  defaultOpen = false,
  children,
  className = '',
  headerClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={`rounded-2xl border border-neutral-200/90 dark:border-emerald-900/50 bg-white/70 dark:bg-[#12231a]/70 backdrop-blur-xs overflow-hidden transition-all duration-200 shadow-2xs ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between p-3.5 sm:p-4 text-right cursor-pointer hover:bg-neutral-50/80 dark:hover:bg-[#14281e]/80 transition-colors ${headerClassName}`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="w-8 h-8 rounded-xl bg-[#145a3a]/10 dark:bg-[#dfbd69]/10 text-[#145a3a] dark:text-[#dfbd69] flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0 text-right">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-[#14281d] dark:text-[#e9f2ec] truncate">
                {title}
              </span>
              {badge !== undefined && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-[10px] font-black text-emerald-800 dark:text-emerald-300">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div
          className={`p-1.5 rounded-xl bg-neutral-100 dark:bg-emerald-950/60 text-neutral-500 dark:text-emerald-300 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#145a3a] dark:text-[#dfbd69]' : ''
          }`}
        >
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>

      {isOpen && (
        <div className="p-3.5 sm:p-4.5 pt-0 border-t border-neutral-100 dark:border-emerald-900/40 animate-in fade-in duration-150">
          {children}
        </div>
      )}
    </div>
  );
};
