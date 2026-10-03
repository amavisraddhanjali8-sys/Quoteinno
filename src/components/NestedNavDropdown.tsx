import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Search, 
  X, 
  ArrowRight, 
  Layers
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface NavDropdownItem {
  id?: string;
  name: string; // STRICTLY ONE LINE
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string; // Optional single word badge
  onClick?: () => void;
  isActive?: boolean;
  children?: NavDropdownItem[];
}

interface NestedNavDropdownProps {
  label: string; // Tab Name
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isActive?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  items: NavDropdownItem[];
  align?: 'left' | 'right';
  onMouseEnter?: () => void;
  onDirectClick?: () => void;
}

interface FlattenedItem {
  id: string;
  name: string;
  path: string[];
  pathString: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  onClick?: () => void;
}

// Flatten all actionable leaf nodes for quick search
function flattenLeaves(items: NavDropdownItem[], parentPath: string[] = []): FlattenedItem[] {
  const result: FlattenedItem[] = [];
  items.forEach((item, idx) => {
    const currentPath = [...parentPath, item.name];
    if (item.children && item.children.length > 0) {
      result.push(...flattenLeaves(item.children, currentPath));
    } else {
      result.push({
        id: item.id || `${currentPath.join('-')}-${idx}`,
        name: item.name,
        path: currentPath,
        pathString: currentPath.join(' › '),
        icon: item.icon,
        badge: item.badge,
        onClick: item.onClick
      });
    }
  });
  return result;
}

interface CascadingMenuItemProps {
  item: NavDropdownItem;
  onClose: () => void;
  direction?: 'left' | 'right';
  level?: number;
}

const CascadingMenuItem: React.FC<CascadingMenuItemProps> = ({
  item,
  onClose,
  direction = 'right',
  level = 1
}) => {
  const [isSubOpen, setIsSubOpen] = useState(false);
  const [effectiveDirection, setEffectiveDirection] = useState<'left' | 'right'>(direction);
  const [verticalAlign, setVerticalAlign] = useState<'top' | 'bottom'>('top');
  const timeoutRef = useRef<any>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  const hasChildren = Boolean(item.children && item.children.length > 0);
  const ItemIcon = item.icon || Layers;

  // Check if any child item has further sub-children
  const hasSubChildren = useMemo(() => {
    return item.children?.some(c => c.children && c.children.length > 0) ?? false;
  }, [item.children]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (hasChildren) {
      if (itemRef.current) {
        const rect = itemRef.current.getBoundingClientRect();
        // Smart Viewport Collision Detection
        // If opening to the right would go off-screen, flip left
        if (rect.right + 260 > window.innerWidth) {
          setEffectiveDirection('left');
        } else if (rect.left - 260 < 0) {
          setEffectiveDirection('right');
        } else {
          setEffectiveDirection(direction);
        }

        // Vertical collision: if sub-menu would go below viewport bottom, align to bottom
        if (rect.top + 280 > window.innerHeight) {
          setVerticalAlign('bottom');
        } else {
          setVerticalAlign('top');
        }
      }
      setIsSubOpen(true);
    }
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsSubOpen(false);
    }, 200);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasChildren) {
      if (item.onClick) {
        item.onClick();
      }
      onClose();
    } else {
      setIsSubOpen(!isSubOpen);
    }
  };

  return (
    <div
      ref={itemRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between gap-2 transition-all cursor-pointer group select-none",
          item.isActive
            ? "bg-orange-50 text-orange-600 font-semibold"
            : isSubOpen
            ? "bg-slate-100 text-orange-600 font-medium"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <ItemIcon
            size={14}
            className={cn(
              "shrink-0 transition-colors",
              item.isActive || isSubOpen ? "text-orange-500" : "text-slate-400 group-hover:text-orange-500"
            )}
          />
          <span className="truncate leading-tight font-medium">{item.name}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {item.badge && (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold uppercase group-hover:bg-orange-100 group-hover:text-orange-700 font-mono">
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <ChevronRight
              size={12}
              className={cn(
                "transition-transform",
                isSubOpen ? "text-orange-500 translate-x-0.5" : "text-slate-400 group-hover:text-slate-700"
              )}
            />
          )}
        </div>
      </button>

      {/* Cascading Submenu (Exact 3-Level Cascading Architecture from Reference Screenshot) */}
      {hasChildren && isSubOpen && (
        <div
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
          onMouseLeave={handleMouseLeave}
          className={cn(
            "absolute w-60 md:w-64 bg-white border border-slate-200/90 rounded-xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-100 select-none",
            verticalAlign === 'top' ? "-top-1" : "-bottom-1",
            effectiveDirection === 'right' ? "left-full ml-1" : "right-full mr-1",
            // If it has sub-children, MUST be overflow-visible so next level can cascade freely
            hasSubChildren ? "overflow-visible" : "max-h-80 overflow-y-auto custom-scrollbar"
          )}
          style={{ zIndex: 120 + level * 10 }}
        >
          {/* Invisible Hover Bridge to prevent pointer loss during diagonal mouse motion */}
          <div 
            className={cn(
              "absolute top-0 h-full w-2.5 pointer-events-auto",
              effectiveDirection === 'right' ? "-left-2.5" : "-right-2.5"
            )} 
          />

          <div className="px-2.5 py-1 mb-1 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="truncate">{item.name}</span>
            <span className="font-mono text-slate-400">{item.children?.length}</span>
          </div>

          <div className="space-y-0.5 relative">
            {item.children!.map((child, cIdx) => (
              <CascadingMenuItem
                key={child.id || `${child.name}-${cIdx}`}
                item={child}
                onClose={onClose}
                direction={effectiveDirection}
                level={level + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const NestedNavDropdown: React.FC<NestedNavDropdownProps> = ({
  label,
  icon: Icon,
  isActive = false,
  isOpen,
  onToggle,
  onClose,
  items,
  align = 'left',
  onMouseEnter,
  onDirectClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // Reset search when opening/closing
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Focus search input when menu opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const allLeaves = useMemo(() => flattenLeaves(items), [items]);

  const filteredLeaves = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allLeaves.filter(leaf => 
      leaf.name.toLowerCase().includes(q) ||
      leaf.pathString.toLowerCase().includes(q) ||
      (leaf.badge && leaf.badge.toLowerCase().includes(q))
    );
  }, [searchQuery, allLeaves]);

  // Check if items have any child sub-menus
  const hasAnyChildren = useMemo(() => {
    return items.some(it => it.children && it.children.length > 0);
  }, [items]);

  const flyoutDirection = align === 'right' ? 'left' : 'right';

  return (
    <div ref={containerRef} className="relative nav-dropdown-wrapper">
      {/* Navbar Tab Button Trigger */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (onDirectClick) {
            onDirectClick();
            onClose();
          } else {
            onToggle();
          }
        }}
        onMouseEnter={onMouseEnter}
        className={cn(
          "px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap select-none cursor-pointer group",
          isActive
            ? "bg-white text-orange-600 shadow-xs border border-slate-200/90 font-semibold"
            : isOpen
            ? "bg-white text-slate-900 border border-slate-300 font-semibold shadow-xs"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        )}
      >
        <span 
          className="flex items-center gap-1.5"
          onClick={(e) => {
            if (onDirectClick) {
              e.stopPropagation();
              onDirectClick();
              onClose();
            }
          }}
        >
          <Icon size={14} className={isActive ? "text-orange-500" : "text-slate-400 group-hover:text-slate-700"} />
          <span>{label}</span>
        </span>
        <span
          className="p-0.5 -mr-1 hover:bg-slate-200/50 rounded flex items-center justify-center cursor-pointer transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          title={`Expand ${label} menu`}
        >
          <ChevronDown
            size={12}
            className={cn("transition-transform duration-150 text-slate-400 group-hover:text-slate-600", isOpen && "rotate-180")}
          />
        </span>
      </button>

      {/* Floating Multi-Level Cascading Dropdown Menu with Pure White Background */}
      {isOpen && (
        <div
          className={cn(
            "absolute top-full mt-1.5 w-60 md:w-64 bg-white rounded-xl shadow-2xl border border-slate-200/90 p-1.5 z-[100] animate-in fade-in zoom-in-95 duration-100 select-none",
            align === 'right' ? "right-0" : "left-0",
            // CRITICAL: MUST be overflow-visible so sub-menus can fly out without clipping
            hasAnyChildren ? "overflow-visible" : "max-h-80 overflow-y-auto custom-scrollbar"
          )}
        >
          {/* Quick Search Header */}
          {items.length > 2 && (
            <div className="relative mb-1.5 px-1 pt-0.5">
              <Search size={12} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={`Search ${label}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-6 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 transition-all text-slate-800"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          )}

          {/* Search Results Mode */}
          {searchQuery.trim().length > 0 ? (
            <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-0.5">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Matches ({filteredLeaves.length})
              </div>

              {filteredLeaves.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No matching portals found
                </div>
              ) : (
                filteredLeaves.map((leaf) => {
                  const LeafIcon = leaf.icon || Layers;
                  return (
                    <button
                      key={leaf.id}
                      type="button"
                      onClick={() => {
                        if (leaf.onClick) {
                          leaf.onClick();
                        }
                        onClose();
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-orange-50/70 border border-transparent hover:border-orange-200 transition-colors flex items-center justify-between gap-2 group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <LeafIcon size={14} className="text-slate-400 group-hover:text-orange-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 group-hover:text-orange-950 truncate leading-tight">
                            {leaf.name}
                          </p>
                          <p className="text-[10px] text-slate-400 group-hover:text-orange-700 truncate leading-tight mt-0.5">
                            {leaf.pathString}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {leaf.badge && (
                          <span className="text-[9px] px-1 py-0.2 bg-slate-100 text-slate-600 rounded uppercase font-semibold font-mono">
                            {leaf.badge}
                          </span>
                        )}
                        <ArrowRight size={11} className="text-slate-300 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            /* Normal Cascading Multi-Level Menu List */
            <div className="space-y-0.5 relative">
              {items.map((item, idx) => (
                <CascadingMenuItem
                  key={item.id || `${item.name}-${idx}`}
                  item={item}
                  onClose={onClose}
                  direction={flyoutDirection}
                  level={1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
