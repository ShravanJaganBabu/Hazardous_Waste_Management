import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  SUPPORTED_LANGUAGES,
  LanguageCode,
  LanguageOption,
  TranslationKey,
  getTranslation,
} from '../i18n';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (
    key: TranslationKey,
    paramsOrFallback?: Record<string, string | number> | string,
    fallback?: string
  ) => string;
  languages: LanguageOption[];
  currentLanguage: LanguageOption;
}

const STORAGE_KEY = 'haztrack_preferred_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (saved && (saved === 'en' || saved === 'ta' || saved === 'hi')) {
        return saved;
      }
    }
    return 'en';
  });

  const setLanguage = useCallback((newLang: LanguageCode) => {
    setLanguageState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = useCallback(
    (
      key: TranslationKey,
      paramsOrFallback?: Record<string, string | number> | string,
      fallback?: string
    ): string => {
      return getTranslation(language, key, paramsOrFallback, fallback);
    },
    [language]
  );

  const currentLanguage =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
        currentLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
