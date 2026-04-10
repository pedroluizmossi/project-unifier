import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const LanguageSwitcher: React.FC = () => {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div className="flex items-center gap-1 bg-slate-800/60 rounded-lg p-0.5">
      <button
        onClick={() => setLocale('en')}
        className={`px-1.5 py-1 rounded text-base leading-none transition-all ${
          locale === 'en'
            ? 'bg-indigo-600 shadow-sm scale-110'
            : 'opacity-60 hover:opacity-100'
        }`}
        aria-label={t('language.english')}
        title={t('language.english')}
      >
        🇺🇸
      </button>
      <button
        onClick={() => setLocale('pt')}
        className={`px-1.5 py-1 rounded text-base leading-none transition-all ${
          locale === 'pt'
            ? 'bg-indigo-600 shadow-sm scale-110'
            : 'opacity-60 hover:opacity-100'
        }`}
        aria-label={t('language.portuguese')}
        title={t('language.portuguese')}
      >
        🇧🇷
      </button>
    </div>
  );
};

export default LanguageSwitcher;
