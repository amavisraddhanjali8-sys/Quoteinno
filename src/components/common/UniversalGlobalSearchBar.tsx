import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Search,
  X,
  ArrowUpRight,
  Clock,
  SlidersHorizontal,
  Compass,
  Zap,
  Sparkles,
  Database,
  FileText,
  Trash2
} from 'lucide-react';
import {
  universalSearchService,
  UniversalSearchResultItem,
  SearchGroupCategory,
  SearchRecordTypeFilter,
  SearchAccessContext
} from '../../services/universalSearchService';
import { cn } from '../../lib/utils';

interface UniversalGlobalSearchBarProps {
  allItems: UniversalSearchResultItem[];
  accessContext: SearchAccessContext;
  query: string;
  onQueryChange: (val: string) => void;
}

const GROUP_ORDER: SearchGroupCategory[] = [
  'Portals',
  'Features',
  'Actions',
  'Records',
  'Documents'
];

const GROUP_TABS: ('All' | SearchGroupCategory)[] = [
  'All',
  'Portals',
  'Features',
  'Actions',
  'Records',
  'Documents'
];

const RECORD_TYPE_FILTERS: SearchRecordTypeFilter[] = [
  'All',
  'Portal',
  'Feature',
  'Action',
  'Project',
  'Quote',
  'Invoice',
  'PO',
  'RFQ',
  'Customer',
  'Supplier',
  'Employee',
  'User',
  'Equipment',
  'Product',
  'BOQ',
  'Task',
  'Message',
  'Alert',
  'Document'
];

/**
 * Highlights matching text inside a single-line label without adding extra lines.
 */
function HighlightedSingleLineText({
  text,
  query
}: {
  text: string;
  query: string;
}) {
  const clean = query.trim();
  if (!clean) return <>{text}</>;

  const tokens = clean
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .split(/\s+/)
    .filter(t => t.length >= 1);

  if (tokens.length === 0) return <>{text}</>;

  try {
    const regex = new RegExp(`(${tokens.join('|')})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark
              key={i}
              className="bg-orange-100 text-orange-800 font-semibold rounded-xs px-0.5"
            >
              {part}
            </mark>
          ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
          )
        )}
      </>
    );
  } catch {
    return <>{text}</>;
  }
}

export const UniversalGlobalSearchBar: React.FC<UniversalGlobalSearchBarProps> = ({
  allItems,
  accessContext,
  query,
  onQueryChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileOverlayOpen, setMobileOverlayOpen] = useState(false);
  const [groupFilter, setGroupFilter] = useState<'All' | SearchGroupCategory>('All');
  const [typeFilter, setTypeFilter] = useState<SearchRecordTypeFilter>('All');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const userId = accessContext.user?.id;

  useEffect(() => {
    setRecentSearches(universalSearchService.getRecentSearches(userId));
  }, [userId, isOpen, mobileOverlayOpen]);

  const searchResults = useMemo(() => {
    return universalSearchService.executeSearch(allItems, accessContext, {
      query,
      groupFilter,
      typeFilter,
      limitPerGroup: groupFilter === 'All' ? 5 : 18,
      maxTotalResults: 28
    });
  }, [allItems, accessContext, query, groupFilter, typeFilter]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, groupFilter, typeFilter]);

  const handleSelectResult = useCallback(
    (item: UniversalSearchResultItem) => {
      if (query.trim().length >= 2) {
        const updated = universalSearchService.addRecentSearch(query.trim(), userId);
        setRecentSearches(updated);
      }
      item.onSelect();
      setIsOpen(false);
      setMobileOverlayOpen(false);
      onQueryChange('');
    },
    [query, userId, onQueryChange]
  );

  // Global keyboard shortcuts: Cmd/Ctrl + K or '/' (when not typing in another field)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (window.innerWidth < 640) {
          setMobileOverlayOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 40);
        } else {
          setIsOpen(true);
          desktopInputRef.current?.focus();
          desktopInputRef.current?.select();
        }
        return;
      }

      const tag = (e.target as HTMLElement)?.tagName;
      const isEditing =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        (e.target as HTMLElement)?.isContentEditable;

      if (!isEditing && e.key === '/') {
        e.preventDefault();
        if (window.innerWidth < 640) {
          setMobileOverlayOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 40);
        } else {
          setIsOpen(true);
          desktopInputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const flat = searchResults.flatList;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      if (flat.length > 0) {
        setActiveIndex(prev => (prev + 1) % flat.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      if (flat.length > 0) {
        setActiveIndex(prev => (prev - 1 + flat.length) % flat.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flat.length > 0 && flat[activeIndex]) {
        handleSelectResult(flat[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setMobileOverlayOpen(false);
      desktopInputRef.current?.blur();
    } else if (e.key === 'Tab' && isOpen) {
      e.preventDefault();
      const idx = GROUP_TABS.indexOf(groupFilter);
      const nextIdx = e.shiftKey
        ? (idx - 1 + GROUP_TABS.length) % GROUP_TABS.length
        : (idx + 1) % GROUP_TABS.length;
      setGroupFilter(GROUP_TABS[nextIdx]);
    }
  };

  const getGroupIcon = (group: SearchGroupCategory) => {
    switch (group) {
      case 'Portals':
        return <Compass size={12} className="text-orange-500 shrink-0" />;
      case 'Features':
        return <Sparkles size={12} className="text-blue-500 shrink-0" />;
      case 'Actions':
        return <Zap size={12} className="text-emerald-500 shrink-0" />;
      case 'Records':
        return <Database size={12} className="text-indigo-500 shrink-0" />;
      case 'Documents':
        return <FileText size={12} className="text-amber-500 shrink-0" />;
    }
  };

  const renderDropdownContent = () => {
    const flatList = searchResults.flatList;
    const hasQuery = query.trim().length > 0;

    return (
      <div className="flex flex-col max-h-[420px]">
        {/* Row 1: Single-line Category Filter Tabs + Filter Toggle */}
        <div className="px-2.5 py-1.5 border-b border-slate-100 flex items-center justify-between gap-1 bg-slate-50/70">
          <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
            {GROUP_TABS.map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setGroupFilter(tab)}
                className={cn(
                  'px-2 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer',
                  groupFilter === tab
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowAdvancedFilter(prev => !prev)}
            title="Filter by Record Type"
            className={cn(
              'p-1 rounded text-[11px] flex items-center gap-1 shrink-0 transition-colors cursor-pointer',
              showAdvancedFilter || typeFilter !== 'All'
                ? 'bg-orange-100 text-orange-700 font-semibold'
                : 'text-slate-500 hover:bg-slate-200/60'
            )}
          >
            <SlidersHorizontal size={12} />
            <span className="hidden md:inline">{typeFilter === 'All' ? 'Type' : typeFilter}</span>
          </button>
        </div>

        {/* Optional Single-Line Record Type Filter Bar */}
        {showAdvancedFilter && (
          <div className="px-2.5 py-1.5 border-b border-slate-100 flex items-center gap-1 overflow-x-auto bg-white">
            {RECORD_TYPE_FILTERS.map(tf => (
              <button
                key={tf}
                type="button"
                onClick={() => setTypeFilter(tf)}
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap transition-colors cursor-pointer',
                  typeFilter === tf
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        )}

        {/* Recent Searches (only when input is empty and user has recent searches) */}
        {!hasQuery && recentSearches.length > 0 && (
          <div className="px-2.5 py-1.5 border-b border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Recent
              </span>
              <button
                type="button"
                onClick={() => {
                  universalSearchService.clearRecentSearches(userId);
                  setRecentSearches([]);
                }}
                className="text-[10px] text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={10} />
                <span>Clear</span>
              </button>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {recentSearches.map(term => (
                <div
                  key={term}
                  className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded px-2 py-0.5 text-[11px] shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => onQueryChange(term)}
                    className="flex items-center gap-1 cursor-pointer"
                  >
                    <Clock size={10} className="text-slate-400" />
                    <span className="truncate max-w-[120px]">{term}</span>
                  </button>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      const next = universalSearchService.removeRecentSearch(term, userId);
                      setRecentSearches(next);
                    }}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results List — STRICTLY ONE LINE PER RESULT, NO DESCRIPTIONS */}
        <div className="overflow-y-auto py-1 divide-y divide-slate-100">
          {flatList.length === 0 ? (
            <div className="px-3 py-2.5">
              <p className="text-xs text-slate-500 mb-2">
                No match for <span className="font-semibold text-slate-800">"{query}"</span>. Try:
              </p>
              <div className="space-y-0.5">
                {searchResults.suggestions.map(sug => (
                  <button
                    key={sug.id}
                    type="button"
                    onClick={() => handleSelectResult(sug)}
                    className="w-full h-7 px-2 rounded hover:bg-slate-100 flex items-center justify-between gap-2 text-xs text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                      {getGroupIcon(sug.group)}
                      <span className="font-medium text-slate-800 truncate">{sug.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
                      <span>{sug.recordType}</span>
                      <ArrowUpRight size={12} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            GROUP_ORDER.map(groupName => {
              const groupItems = searchResults.groups[groupName];
              if (!groupItems || groupItems.length === 0) return null;

              return (
                <div key={groupName} className="px-2 py-1">
                  <div className="px-1.5 py-0.5 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {groupName}
                    </span>
                    <span className="text-[10px] text-slate-400">{groupItems.length}</span>
                  </div>

                  {groupItems.map(item => {
                    const flatIdx = flatList.findIndex(f => f.id === item.id);
                    const isSelected = flatIdx === activeIndex;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onMouseEnter={() => setActiveIndex(flatIdx)}
                        onClick={() => handleSelectResult(item)}
                        className={cn(
                          'w-full h-8 px-2 rounded-md flex items-center justify-between gap-2 text-xs text-left transition-colors cursor-pointer',
                          isSelected
                            ? 'bg-orange-50 text-slate-900'
                            : 'hover:bg-slate-50 text-slate-700'
                        )}
                      >
                        {/* Left side: Icon + Optional Short Code + Single-line Title */}
                        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                          {getGroupIcon(item.group)}
                          {item.code && (
                            <span className="font-mono text-[11px] text-slate-500 shrink-0">
                              <HighlightedSingleLineText text={item.code} query={query} />
                            </span>
                          )}
                          <span className="font-medium text-slate-800 truncate">
                            <HighlightedSingleLineText text={item.title} query={query} />
                          </span>
                        </div>

                        {/* Right side: Simple Record Type · Context + Direct Open Arrow */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0 whitespace-nowrap">
                          <span>{item.recordType}</span>
                          {item.contextLabel && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-slate-500 max-w-[110px] truncate">
                                {item.contextLabel}
                              </span>
                            </>
                          )}
                          <ArrowUpRight
                            size={12}
                            className={cn(
                              'transition-transform',
                              isSelected ? 'text-orange-600 translate-x-0.5' : 'text-slate-300'
                            )}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Single-line Footer Keyboard Hints */}
        <div className="px-3 py-1 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[10px] text-slate-400">
          <span>↑↓ Navigate · Enter Open · Tab Filter · Esc Close</span>
          <span>{searchResults.totalCount} authorized</span>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop & Tablet Universal Search Bar */}
      <div ref={wrapperRef} className="relative flex-1 max-w-lg hidden sm:block">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          size={14}
        />
        <input
          ref={desktopInputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={e => {
            onQueryChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder="Search portals, features, actions, records, docs..."
          className="w-full pl-8 pr-14 py-1.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              onQueryChange('');
              desktopInputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        ) : (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-medium text-slate-400 pointer-events-none">
            ⌘K
          </span>
        )}

        {isOpen && (
          <div className="absolute left-0 top-full mt-1.5 w-full min-w-[440px] lg:min-w-[540px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-[160]">
            {renderDropdownContent()}
          </div>
        )}
      </div>

      {/* Mobile Header Search Button */}
      <button
        type="button"
        onClick={() => {
          setMobileOverlayOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 40);
        }}
        className="sm:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label="Open universal search"
      >
        <Search size={18} />
      </button>

      {/* Mobile Full-Width Search Overlay */}
      {mobileOverlayOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 sm:hidden flex flex-col">
          <div className="bg-white border-b border-slate-200 p-2.5 flex items-center gap-2">
            <Search size={15} className="text-slate-400 shrink-0 ml-1" />
            <input
              ref={mobileInputRef}
              type="text"
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search portals, actions, records..."
              className="flex-1 text-xs bg-transparent focus:outline-none text-slate-800"
            />
            {query && (
              <button
                type="button"
                onClick={() => onQueryChange('')}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setMobileOverlayOpen(false)}
              className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Close
            </button>
          </div>
          <div className="bg-white flex-1 overflow-y-auto">{renderDropdownContent()}</div>
        </div>
      )}
    </>
  );
};
