import React, { useState, useEffect } from 'react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  type: 'checkbox' | 'radio' | 'range';
  min?: number;
  max?: number;
}

interface EnhancedFiltersProps {
  language: 'ar' | 'en';
  filterGroups: FilterGroup[];
  selectedFilters: Record<string, string[]>;
  onFilterChange: (groupId: string, values: string[]) => void;
  onClearAll: () => void;
  sortOptions: Array<{ value: string; label: string }>;
  selectedSort: string;
  onSortChange: (value: string) => void;
}

/**
 * Enhanced filters with mobile-friendly bottom sheet
 */
export default function EnhancedFilters({
  language,
  filterGroups,
  selectedFilters,
  onFilterChange,
  onClearAll,
  sortOptions,
  selectedSort,
  onSortChange,
}: EnhancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleCheckboxChange = (groupId: string, optionId: string) => {
    const current = selectedFilters[groupId] || [];
    const newValues = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId];
    onFilterChange(groupId, newValues);
  };

  const handleRadioChange = (groupId: string, optionId: string) => {
    onFilterChange(groupId, [optionId]);
  };

  const totalFiltersCount = Object.values(selectedFilters).reduce(
    (sum, filters) => sum + filters.length,
    0
  );

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Filter Trigger Button */}
      <div className="flex gap-3 items-center">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg hover:border-brand-blue-500 transition-colors"
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="font-medium">
            {t('فلتر', 'Filters')}
            {totalFiltersCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-brand-blue-500 text-white text-xs rounded-full">
                {totalFiltersCount}
              </span>
            )}
          </span>
        </button>

        {/* Sort Dropdown */}
        <select
          value={selectedSort}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg hover:border-brand-blue-500 transition-colors font-medium"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Mobile Bottom Sheet / Desktop Sidebar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center"
          onClick={() => setIsOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Filter Panel */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full md:w-2/3 lg:w-1/2 max-w-2xl bg-white rounded-t-2xl md:rounded-2xl max-h-[85vh] md:max-h-[90vh] flex flex-col animate-slide-up"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="w-5 h-5 text-brand-blue-500" />
                <h2 className="text-lg font-bold">
                  {t('الفلاتر والترتيب', 'Filters & Sort')}
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={t('إغلاق', 'Close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Sort Section */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">{t('ترتيب حسب', 'Sort By')}</h3>
                <div className="space-y-2">
                  {sortOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name="sort"
                        value={option.value}
                        checked={selectedSort === option.value}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="w-4 h-4 text-brand-blue-500 focus:ring-brand-blue-500"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filter Groups */}
              {filterGroups.map((group) => (
                <div key={group.id} className="mb-6">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-semibold">{group.label}</span>
                    <ChevronDown
                      className={`w-5 h-5 transition-transform ${
                        expandedGroups.has(group.id) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {expandedGroups.has(group.id) && (
                    <div className="mt-2 space-y-2">
                      {group.type === 'checkbox' &&
                        group.options.map((option) => (
                          <label
                            key={option.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={(selectedFilters[group.id] || []).includes(option.id)}
                              onChange={() => handleCheckboxChange(group.id, option.id)}
                              className="w-4 h-4 text-brand-blue-500 focus:ring-brand-blue-500 rounded"
                            />
                            <span className="flex-1">{option.label}</span>
                            {option.count !== undefined && (
                              <span className="text-sm text-gray-500">({option.count})</span>
                            )}
                          </label>
                        ))}

                      {group.type === 'radio' &&
                        group.options.map((option) => (
                          <label
                            key={option.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="radio"
                              name={group.id}
                              checked={(selectedFilters[group.id] || [])[0] === option.id}
                              onChange={() => handleRadioChange(group.id, option.id)}
                              className="w-4 h-4 text-brand-blue-500 focus:ring-brand-blue-500"
                            />
                            <span className="flex-1">{option.label}</span>
                          </label>
                        ))}

                      {group.type === 'range' && (
                        <div className="p-2">
                          <input
                            type="range"
                            min={group.min}
                            max={group.max}
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm text-gray-600 mt-2">
                            <span>{group.min}</span>
                            <span>{group.max}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  onClearAll();
                  setIsOpen(false);
                }}
                className="flex-1 py-3 px-4 border-2 border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                {t('مسح الكل', 'Clear All')}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 px-4 bg-brand-blue-500 text-white rounded-lg font-semibold hover:bg-brand-blue-600 transition-colors"
              >
                {t('تطبيق', 'Apply')} ({totalFiltersCount})
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
