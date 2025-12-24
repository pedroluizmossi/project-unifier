import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TranslationContext, Locale, TranslationContextType } from '../lib/TranslationContext';
import en from '../lib/translations/en.json';
import pt from '../lib/translations/pt.json';

interface TranslationProviderProps {
  children: React.ReactNode;
}

const translations: Record<Locale, Record<string, any>> = {
  en,
  pt,
};

const LOCALE_STORAGE_KEY = 'app-locale';

/**
 * Detects the browser's language preference
 * Returns 'pt' if browser language is Portuguese, otherwise 'en'
 */
const detectBrowserLanguage = (): Locale => {
  const browserLang = navigator.language.toLowerCase();
  if (browserLang === 'pt' || browserLang.startsWith('pt-')) {
    return 'pt';
  }
  return 'en';
};

/**
 * Retrieves a translation value using dot-notation key lookup
 * Falls back to English if key not found in current locale
 */
const getTranslation = (key: string, locale: Locale): string => {
  const keys = key.split('.');
  let value: any = translations[locale];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Key not found in current locale, try English fallback
      if (locale !== 'en') {
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            // Key not found in English either, return the key itself
            return key;
          }
        }
        return String(value);
      }
      // Key not found in English, return the key itself
      return key;
    }
  }

  return String(value);
};

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize locale on mount
  useEffect(() => {
    // Try to restore from localStorage first
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'pt')) {
      setLocaleState(savedLocale);
    } else {
      // Fall back to browser language detection
      const detectedLocale = detectBrowserLanguage();
      setLocaleState(detectedLocale);
    }
    setIsInitialized(true);
  }, []);

  // Handle locale changes
  const setLocale = useCallback((newLocale: Locale) => {
    if (newLocale === 'en' || newLocale === 'pt') {
      setLocaleState(newLocale);
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    }
  }, []);

  // Translation function with dot-notation support
  const t = useCallback((key: string, defaultValue?: string): string => {
    const translation = getTranslation(key, locale);
    return translation !== key ? translation : (defaultValue || key);
  }, [locale]);

  const value: TranslationContextType = useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t]
  );

  // Don't render children until initialization is complete
  if (!isInitialized) {
    return null;
  }

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export default TranslationProvider;
