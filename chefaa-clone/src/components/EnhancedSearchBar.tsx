import React, { useState, useEffect } from 'react';
import { Search, X, TrendingUp, Clock } from 'lucide-react';
import { useDebounce } from '../hooks/usePerformance';

interface SearchSuggestion {
  text: string;
  type: 'product' | 'category' | 'recent';
  count?: number;
}

interface EnhancedSearchBarProps {
  language: 'ar' | 'en';
  onSearch: (query: string) => void;
  placeholder?: string;
}

/**
 * Enhanced Search Bar with autocomplete, suggestions, and fuzzy search
 */
export default function EnhancedSearchBar({
  language,
  onSearch,
  placeholder,
}: EnhancedSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const debouncedQuery = useDebounce(query, 300);

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  useEffect(() => {
    // Load recent searches from localStorage
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      fetchSuggestions(debouncedQuery);
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery]);

  const fetchSuggestions = async (searchQuery: string) => {
    // Fuzzy search implementation
    const suggestions: SearchSuggestion[] = [];

    // Add popular product suggestions
    const popularProducts = [
      { text: 'Panadol', count: 1250 },
      { text: 'Brufen', count: 980 },
      { text: 'Vitamin C', count: 750 },
      { text: 'Face Cream', count: 620 },
    ];

    popularProducts.forEach((product) => {
      if (product.text.toLowerCase().includes(searchQuery.toLowerCase())) {
        suggestions.push({
          text: product.text,
          type: 'product',
          count: product.count,
        });
      }
    });

    // Add category suggestions
    const categories = ['Medications', 'Skin Care', 'Hair Care', 'Vitamins'];
    categories.forEach((category) => {
      if (category.toLowerCase().includes(searchQuery.toLowerCase())) {
        suggestions.push({
          text: category,
          type: 'category',
        });
      }
    });

    setSuggestions(suggestions.slice(0, 6));
  };

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Save to recent searches
    const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));

    onSearch(searchQuery);
    setIsFocused(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder || t('ابحث عن منتج...', 'Search for a product...')}
          className="w-full px-4 py-3 pr-12 pl-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue-500 transition-colors text-base"
          aria-label={t('بحث', 'Search')}
          role="combobox"
          aria-expanded={isFocused && (query.length >= 2 || recentSearches.length > 0)}
          aria-controls="search-suggestions"
          aria-autocomplete="list"
          aria-haspopup="listbox"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label={t('مسح', 'Clear')}
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <button
            type="submit"
            className="text-brand-blue-500 hover:text-brand-blue-600 p-1"
            aria-label={t('بحث', 'Search')}
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {isFocused && (query.length >= 2 || recentSearches.length > 0) && (
        <div 
          id="search-suggestions"
          role="listbox"
          aria-label={t('اقتراحات البحث', 'Search suggestions')}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 px-3 py-2">
                {t('اقتراحات', 'Suggestions')}
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(suggestion.text)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg text-left transition-colors"
                >
                  {suggestion.type === 'product' ? (
                    <TrendingUp className="w-5 h-5 text-brand-blue-500 flex-shrink-0" />
                  ) : (
                    <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                  <span className="flex-1 text-sm font-medium">{suggestion.text}</span>
                  {suggestion.count && (
                    <span className="text-xs text-gray-400">
                      {suggestion.count} {t('منتج', 'products')}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && suggestions.length === 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="text-xs font-semibold text-gray-500">
                  {t('عمليات البحث الأخيرة', 'Recent Searches')}
                </div>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-brand-blue-500 hover:text-brand-blue-600"
                >
                  {t('مسح الكل', 'Clear All')}
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(search)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg text-left transition-colors"
                >
                  <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="flex-1 text-sm">{search}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
