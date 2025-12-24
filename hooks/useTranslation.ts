import { useContext } from 'react';
import { TranslationContext, TranslationContextType } from '../lib/TranslationContext';

/**
 * Hook to access translation functionality in any component
 * 
 * Returns an object containing:
 * - t: Function to retrieve translated strings by key (supports dot-notation)
 * - locale: Current active locale ('en' or 'pt')
 * - setLocale: Function to change the active locale
 * 
 * Throws an error if used outside of TranslationProvider
 * 
 * @returns {TranslationContextType} Object with translation function, locale, and setLocale
 * @throws {Error} If used outside TranslationProvider
 * 
 * @example
 * const { t, locale, setLocale } = useTranslation();
 * console.log(t('hero.title')); // Returns translated title
 * setLocale('pt'); // Switch to Portuguese
 */
export const useTranslation = (): TranslationContextType => {
  const context = useContext(TranslationContext);

  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }

  return context;
};

export default useTranslation;
