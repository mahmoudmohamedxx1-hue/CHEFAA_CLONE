import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAccessibility } from '../contexts/AccessibilityContext';
import useVoiceCommands from '../hooks/useVoiceCommands';
import { usePWA } from '../hooks/usePWA';

const SettingsPage: React.FC = () => {
  const {
    theme,
    setTheme,
    fontSize,
    setFontSize,
    reduceMotion,
    setReduceMotion,
    enhanceContrast,
    setEnhanceContrast,
  } = useTheme();

  const {
    screenReaderMode,
    setScreenReaderMode,
    keyboardNavigation,
    setKeyboardNavigation,
  } = useAccessibility();

  const [voiceLanguage, setVoiceLanguage] = useState<'ar' | 'en'>('en');
  const { isListening, startListening, stopListening } = useVoiceCommands(voiceLanguage);
  const { isInstalled, isInstallable, install } = usePWA();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-teal-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white">Settings & Accessibility</h1>
            <p className="text-blue-100 mt-2">
              Customize your experience to suit your preferences
            </p>
          </div>

          <div className="p-8 space-y-8">
            {/* Theme Settings */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                Appearance
              </h2>

              <div className="space-y-4 bg-gray-50 rounded-xl p-6">
                {/* Theme Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Color Theme
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(['light', 'dark', 'highContrast', 'system'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        role="radio"
                        aria-checked={theme === t}
                        aria-label={`Set theme to ${t === 'highContrast' ? 'High Contrast' : t}`}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          theme === t
                            ? 'border-blue-600 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-sm font-semibold text-gray-900 capitalize">
                          {t === 'highContrast' ? 'High Contrast' : t}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Font Size
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['small', 'medium', 'large'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setFontSize(size)}
                        role="radio"
                        aria-checked={fontSize === size}
                        aria-label={`Set font size to ${size}`}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          fontSize === size
                            ? 'border-blue-600 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div
                          className={`font-semibold text-gray-900 capitalize ${
                            size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'
                          }`}
                        >
                          {size}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Options */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <label className="flex items-center justify-between p-4 bg-white rounded-lg cursor-pointer hover:bg-gray-50">
                    <span className="text-sm font-semibold text-gray-900">Reduce Motion</span>
                    <input
                      type="checkbox"
                      checked={reduceMotion}
                      onChange={(e) => setReduceMotion(e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-white rounded-lg cursor-pointer hover:bg-gray-50">
                    <span className="text-sm font-semibold text-gray-900">Enhance Contrast</span>
                    <input
                      type="checkbox"
                      checked={enhanceContrast}
                      onChange={(e) => setEnhanceContrast(e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>
            </section>

            {/* Accessibility Settings */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Accessibility
              </h2>

              <div className="space-y-3 bg-gray-50 rounded-xl p-6">
                <label className="flex items-center justify-between p-4 bg-white rounded-lg cursor-pointer hover:bg-gray-50">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Screen Reader Mode</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Optimize for screen reader users
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={screenReaderMode}
                    onChange={(e) => setScreenReaderMode(e.target.checked)}
                    className="w-5 h-5 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-white rounded-lg cursor-pointer hover:bg-gray-50">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Enhanced Keyboard Navigation</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Show visible focus indicators
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={keyboardNavigation}
                    onChange={(e) => setKeyboardNavigation(e.target.checked)}
                    className="w-5 h-5 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
                  />
                </label>
              </div>
            </section>

            {/* Voice Commands */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Voice Commands
              </h2>

              <div className="space-y-4 bg-gray-50 rounded-xl p-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Voice Language
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['en', 'ar'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setVoiceLanguage(lang)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          voiceLanguage === lang
                            ? 'border-purple-600 bg-purple-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-sm font-semibold text-gray-900">
                          {lang === 'en' ? 'English' : 'Arabic'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      isListening
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {isListening ? 'Stop Listening' : 'Start Voice Commands'}
                  </button>
                </div>

                <div className="text-xs text-gray-600 text-center mt-2">
                  Commands: "search [medicine]", "cart", "home", "login", "logout", "help"
                </div>
              </div>
            </section>

            {/* PWA Installation */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Progressive Web App
              </h2>

              <div className="bg-gray-50 rounded-xl p-6">
                {isInstalled ? (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">App Installed!</p>
                    <p className="text-sm text-gray-600 mt-2">
                      You can now use this app offline
                    </p>
                  </div>
                ) : isInstallable ? (
                  <div className="text-center py-4">
                    <button
                      onClick={install}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
                    >
                      Install App
                    </button>
                    <p className="text-sm text-gray-600 mt-2">
                      Install for offline access and better performance
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Install on iOS:
                    </p>
                    <ol className="text-sm text-gray-700 space-y-2 text-left max-w-sm mx-auto">
                      <li>1. Tap the Share button in Safari</li>
                      <li>2. Scroll down and tap "Add to Home Screen"</li>
                      <li>3. Tap "Add" to confirm</li>
                    </ol>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
