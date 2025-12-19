import { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  announceMessage: (message: string, priority?: 'polite' | 'assertive') => void;
  skipToContent: () => void;
  focusTrapActive: boolean;
  setFocusTrapActive: (active: boolean) => void;
  keyboardNavigation: boolean;
  setKeyboardNavigation: (enabled: boolean) => void;
  screenReaderMode: boolean;
  setScreenReaderMode: (enabled: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [focusTrapActive, setFocusTrapActive] = useState(false);
  const [keyboardNavigation, setKeyboardNavigation] = useState(true);
  const [screenReaderMode, setScreenReaderMode] = useState(false);

  // Create live region for screen reader announcements
  useEffect(() => {
    const politeRegion = document.createElement('div');
    politeRegion.id = 'a11y-announce-polite';
    politeRegion.setAttribute('aria-live', 'polite');
    politeRegion.setAttribute('aria-atomic', 'true');
    politeRegion.className = 'sr-only';
    document.body.appendChild(politeRegion);

    const assertiveRegion = document.createElement('div');
    assertiveRegion.id = 'a11y-announce-assertive';
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    assertiveRegion.className = 'sr-only';
    document.body.appendChild(assertiveRegion);

    return () => {
      politeRegion.remove();
      assertiveRegion.remove();
    };
  }, []);

  // Detect keyboard vs mouse navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setKeyboardNavigation(true);
        document.body.classList.add('keyboard-navigation');
      }
    };

    const handleMouseDown = () => {
      setKeyboardNavigation(false);
      document.body.classList.remove('keyboard-navigation');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const announceMessage = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const regionId = priority === 'assertive' ? 'a11y-announce-assertive' : 'a11y-announce-polite';
    const region = document.getElementById(regionId);
    
    if (region) {
      // Clear previous message
      region.textContent = '';
      
      // Announce new message after a small delay to ensure screen readers detect the change
      setTimeout(() => {
        region.textContent = message;
      }, 100);

      // Clear message after announcement
      setTimeout(() => {
        region.textContent = '';
      }, 3000);
    }
  };

  const skipToContent = () => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        announceMessage,
        skipToContent,
        focusTrapActive,
        setFocusTrapActive,
        keyboardNavigation,
        setKeyboardNavigation,
        screenReaderMode,
        setScreenReaderMode,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}
