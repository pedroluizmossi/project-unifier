import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const LanguageSwitcher: React.FC = () => {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-400">{t('language.switcher')}:</span>
      <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
        <button
          onClick={() => setLocale('en')}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            locale === 'en'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:text-white'
          }`}
          aria-label={t('language.english')}
          title={t('language.english')}
        >
          {t('language.english')}
        </button>
        <button
          onClick={() => setLocale('pt')}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            locale === 'pt'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:text-white'
          }`}
          aria-label={t('language.portuguese')}
          title={t('language.portuguese')}
        >
          {t('language.portuguese')}
        </button>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
