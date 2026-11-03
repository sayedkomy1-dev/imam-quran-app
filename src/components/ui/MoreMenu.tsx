import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

export interface MoreMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  badge?: string | number;
}

interface MoreMenuProps {
  items: MoreMenuItem[];
  trigger?: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
  ariaLabel?: string;
}

export const MoreMenu: React.FC<MoreMenuProps> = ({
  items,
  trigger,
  className = '',
  align = 'left',
  ariaLabel = 'خيارات إضافية',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block text-right ${className}`} ref={menuRef}>
      {trigger ? (
        <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="p-1.5 rounded-xl border border-neutral-200 dark:border-emerald-900/60 bg-white/80 dark:bg-[#12231a] hover:bg-neutral-100 dark:hover:bg-emerald-950/80 text-neutral-600 dark:text-neutral-300 transition-colors shadow-2xs cursor-pointer flex items-center justify-center min-w-[32px] min-h-[32px]"
          aria-label={ariaLabel}
          title={ariaLabel}
        >
          <MoreVertical className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
        </button>
      )}

      {isOpen && (
        <div
          className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} mt-1.5 w-52 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-800 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs font-bold`}
          role="menu"
        >
          {items.map((item, idx) => (
            <button
              key={idx}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                setIsOpen(false);
                item.onClick();
              }}
              className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 text-right transition cursor-pointer ${
                item.danger
                  ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50'
                  : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-emerald-950/70 hover:text-[#145a3a] dark:hover:text-[#dfbd69]'
              } ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              role="menuitem"
            >
              <span className="flex items-center gap-2 truncate">
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                <span className="truncate">{item.label}</span>
              </span>
              {item.badge !== undefined && (
                <span className="px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-emerald-900 text-[10px] font-mono text-neutral-600 dark:text-emerald-300">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
