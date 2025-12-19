import { useState, useRef, useEffect } from 'react';
import { Search, Mic, X, SlidersHorizontal, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface MobileSearchProps {
  language: 'ar' | 'en';
  onSearch?: (query: string) => void;
  onFilterClick?: () => void;
  placeholder?: string;
  initialQuery?: string;
}

/**
 * Enhanced Mobile Search Component
 * Phase 2: Mobile Search Experience
 * - Optimized search bar for mobile (larger touch targets)
 * - Voice search functionality using Web Speech API
 * - Mobile-friendly filter drawer/sheet
 * - Quick search suggestions for mobile
 */
export function MobileSearch({
  language,
  onSearch,
  onFilterClick,
  placeholder,
  initialQuery = '',
}: MobileSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  // Initialize voice recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language === 'ar' ? 'ar-EG' : 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        // Vibrate on start
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');

        setQuery(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // Auto-search when voice input ends
        if (query.trim()) {
          handleSearch();
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      setVoiceSupported(true);
    }
  }, [language]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (query.trim()) {
      if (onSearch) {
        onSearch(query);
      } else {
        navigate(`/search?q=${encodeURIComponent(query)}`);
      }
      setShowSuggestions(false);
    }
  };

  const startVoiceSearch = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start voice recognition:', error);
      }
    }
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Quick suggestions based on common searches
  const quickSuggestions = [
    t('مسكنات', 'Pain Relief'),
    t('فيتامينات', 'Vitamins'),
    t('عناية بالبشرة', 'Skin Care'),
    t('أدوية الزكام', 'Cold Medicine'),
    t('مكملات غذائية', 'Supplements'),
  ];

  return (
    <div className="relative w-full">
      <form onSubmit={handleSearch} className="w-full">
        <div className="relative flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(e.target.value.length > 0);
              }}
              onFocus={() => setShowSuggestions(query.length > 0)}
              placeholder={placeholder || t('ابحث عن المنتجات...', 'Search for products...')}
              className={`w-full h-12 ${
                language === 'ar' ? 'pr-12 pl-20' : 'pl-12 pr-20'
              } border-2 border-gray-300 rounded-full focus:outline-none focus:border-brand-blue-500 focus:ring-2 focus:ring-brand-blue-200 transition-all text-base bg-white shadow-sm`}
              style={{ minHeight: '48px' }} // Ensure 44px+ touch target
            />

            {/* Search Icon */}
            <button
              type="submit"
              className={`absolute top-1/2 -translate-y-1/2 ${
                language === 'ar' ? 'right-4' : 'left-4'
              } text-gray-400 hover:text-brand-blue-500 transition-colors touch-button`}
              aria-label={t('بحث', 'Search')}
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Action Buttons (Clear/Voice) */}
            <div className={`absolute top-1/2 -translate-y-1/2 ${
              language === 'ar' ? 'left-2' : 'right-2'
            } flex items-center gap-1`}>
              {/* Clear Button */}
              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors touch-button rounded-full hover:bg-gray-100"
                  aria-label={t('مسح', 'Clear')}
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Voice Search Button */}
              {voiceSupported && (
                <button
                  type="button"
                  onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                  className={`p-2 transition-colors touch-button rounded-full ${
                    isListening
                      ? 'text-red-500 bg-red-50 animate-pulse'
                      : 'text-brand-blue-500 hover:bg-blue-50'
                  }`}
                  aria-label={t('البحث الصوتي', 'Voice Search')}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>

          {/* Filter Button */}
          {onFilterClick && (
            <button
              type="button"
              onClick={onFilterClick}
              className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors touch-button shadow-sm"
              aria-label={t('الفلاتر', 'Filters')}
            >
              <SlidersHorizontal className="w-5 h-5 text-gray-700" />
            </button>
          )}
        </div>
      </form>

      {/* Quick Suggestions */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
          >
            <div className="p-2">
              <p className="text-xs text-gray-500 px-3 py-2 font-medium">
                {t('اقتراحات البحث', 'Quick Suggestions')}
              </p>
              {quickSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setQuery(suggestion);
                    setShowSuggestions(false);
                    if (onSearch) {
                      onSearch(suggestion);
                    } else {
                      navigate(`/search?q=${encodeURIComponent(suggestion)}`);
                    }
                  }}
                  className="w-full text-left px-3 py-3 hover:bg-gray-50 rounded transition-colors touch-button flex items-center gap-2"
                >
                  <Search className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{suggestion}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Recording Indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            onClick={stopVoiceSearch}
          >
            <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                <Mic className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {t('جارٍ الاستماع...', 'Listening...')}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {t('تحدث الآن للبحث', 'Speak now to search')}
              </p>
              {query && (
                <p className="text-base font-medium text-brand-blue-600 bg-blue-50 rounded-lg p-3">
                  "{query}"
                </p>
              )}
              <button
                onClick={stopVoiceSearch}
                className="mt-6 px-6 py-3 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-colors touch-button"
              >
                {t('إيقاف', 'Stop')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Mobile Filter Drawer Component
 * Part of Phase 2: Mobile Search Experience
 */
interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'ar' | 'en';
  children: React.ReactNode;
}

export function MobileFilterDrawer({ isOpen, onClose, language, children }: MobileFilterDrawerProps) {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[85vh] overflow-hidden flex flex-col"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            {/* Drawer Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {t('الفلاتر', 'Filters')}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors touch-button"
                aria-label={t('إغلاق', 'Close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
