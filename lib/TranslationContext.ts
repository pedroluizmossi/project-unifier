import { createContext } from 'react';

export type Locale = 'en' | 'pt';

export interface TranslationContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, defaultValue?: string) => string;
}

export const TranslationContext = createContext<TranslationContextType | undefined>(undefined);
