import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { translations, Language } from '../utils/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper: Check if item is a non-array object
const isObject = (item: any): boolean => {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Defensive Deep Merge logic to prevent runtime crashes when language keys are missing.
 * It strictly adheres to the structure defined in translations.en as the source of truth.
 */
const deepMerge = (target: any, source: any): any => {
  if (!source) return target;
  
  // Start with a shallow copy of target to ensure base structure exists
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(target).forEach(key => {
      const targetValue = target[key];
      const sourceValue = source[key];

      if (isObject(targetValue)) {
        // Recursively merge if the target expects an object
        output[key] = deepMerge(targetValue, sourceValue || {});
      } else if (sourceValue !== undefined) {
        // Direct value assignment if source has the key
        output[key] = sourceValue;
      }
      // If sourceValue is undefined, we keep the targetValue (English fallback)
    });
  }
  
  return output;
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
      try {
          const saved = localStorage.getItem('user_lang');
          return (saved === 'en' || saved === 'pt') ? saved : 'pt';
      } catch { return 'pt'; }
  });

  const t = useMemo(() => {
      try {
          if (language === 'en') return translations.en;
          
          // Safer merge: English is always the base template
          const merged = deepMerge(translations.en, translations[language] || {});
          
          // High-level safety guard for critical navigation and common keys
          if (!merged.common) merged.common = translations.en.common;
          if (!merged.nav) merged.nav = translations.en.nav;
          
          return merged;
      } catch (e) {
          console.error("Translation system failed to merge. Falling back to English.", e);
          return translations.en;
      }
  }, [language]);

  const handleSetLanguage = (lang: Language) => {
      setLanguage(lang);
      try {
          localStorage.setItem('user_lang', lang);
      } catch(e) {}
  };

  const value = {
    language,
    setLanguage: handleSetLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};