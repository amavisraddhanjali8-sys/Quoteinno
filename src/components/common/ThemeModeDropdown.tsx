import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Palette, Check, ChevronDown } from 'lucide-react';
import { useTheme, THEME_MODE_OPTIONS, ThemeMode } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

interface ThemeModeDropdownProps {
  align?: 'left' | 'right';
  compact?: boolean;
  className?: string;
}

export const ThemeModeDropdown: React.FC<ThemeModeDropdownProps> = ({
  align = 'right',
  compact = false,
  className
}) => {
  const { theme, currentThemeOption, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const renderModeIcon = (mode: ThemeMode) => {
    if (mode === 'light') return <Sun size={14} className="text-amber-500 shrink-0" />;
    if (mode === 'cream') return <Palette size={14} className="text-amber-600 shrink-0" />;
    if (mode === 'night-blue') return <Moon size={14} className="text-sky-400 shrink-0" />;
    if (mode === 'forest') return <Moon size={14} className="text-emerald-400 shrink-0" />;
    if (mode === 'charcoal') return <Moon size={14} className="text-slate-400 shrink-0" />;
    return <Moon size={14} className="text-orange-500 shrink-0" />;
  };

  return (
    <div ref={dropdownRef} className={cn('relative inline-block', className)}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        title={`Theme Mode: ${currentThemeOption.label}`}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 shadow-xs cursor-pointer select-none"
      >
        {renderModeIcon(theme)}
        <span className={cn(compact ? 'hidden xl:inline' : 'inline')}>
          {currentThemeOption.shortLabel}
        </span>
        <ChevronDown
          size={12}
          className={cn('text-slate-400 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          className={cn(
            'absolute top-full mt-1.5 w-48 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-[180]',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          <div className="px-3 py-1 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Display Mode
            </span>
          </div>

          <div className="py-1">
            {THEME_MODE_OPTIONS.map(option => {
              const isSelected = option.id === theme;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setTheme(option.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full px-3 py-1.5 text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-orange-50 text-orange-600 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center shadow-2xs"
                      style={{
                        backgroundColor: option.swatchBg,
                        boxShadow: 'inset 0 0 0 1px rgba(128,128,128,0.35)'
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: option.swatchAccent }}
                      />
                    </span>
                    <span className="truncate">{option.label}</span>
                  </div>
                  {isSelected && <Check size={13} className="text-orange-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
