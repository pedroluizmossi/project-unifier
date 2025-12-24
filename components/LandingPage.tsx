import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

// ============================================================================
// Data Models and Interfaces
// ============================================================================

interface Feature {
  id: string;
  icon: string;
  titleKey: string;
  descriptionKey: string;
}

interface UseCase {
  id: string;
  emoji: string;
  titleKey: string;
  descriptionKey: string;
}

// ============================================================================
// Component Props
// ============================================================================

interface LandingPageProps {
  onSelectDirectory: () => void;
  isLoading?: boolean;
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * HeroSection Component
 * Displays the main headline, description, and call-to-action button
 */
const HeroSection: React.FC<{ onSelectDirectory: () => void; isLoading?: boolean }> = ({
  onSelectDirectory,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-4 py-20 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl w-full space-y-8 text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
          <span className="text-indigo-400 text-sm font-medium">{t('hero.badge')}</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-tight">
          {t('hero.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">{t('hero.titleHighlight')}</span>
        </h1>

        {/* Description */}
        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {t('hero.description')}
        </p>

        {/* Primary CTA Button */}
        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onSelectDirectory}
            disabled={isLoading}
            className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg hover:from-indigo-700 hover:to-indigo-800 hover:shadow-2xl hover:shadow-indigo-500/50 hover:scale-105 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
          >
            {isLoading ? (
              <>
                <span className="inline-block animate-spin mr-2">⚙️</span>
                {t('output.generating')}
              </>
            ) : (
              <>
                <span className="mr-2">🚀</span>
                {t('hero.ctaPrimary')}
              </>
            )}
          </button>
          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-indigo-400 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800 hover:border-indigo-500/50 transition-all duration-300"
          >
            {t('hero.ctaSecondary')}
          </button>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-800/50 max-w-md mx-auto">
          <div className="flex flex-col items-center">
            <span className="text-2xl mb-2">🔒</span>
            <span className="text-slate-400 text-xs font-medium">{t('hero.trustBadges.local')}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl mb-2">⚡</span>
            <span className="text-slate-400 text-xs font-medium">{t('hero.trustBadges.fast')}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl mb-2">🤖</span>
            <span className="text-slate-400 text-xs font-medium">{t('hero.trustBadges.ai')}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * FeatureCard Component
 * Displays a single feature with icon, title, and description
 */
const FeatureCard: React.FC<Feature & { t: (key: string) => string }> = ({ icon, titleKey, descriptionKey, t }) => {
  return (
    <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-6 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 hover:scale-105 hover:from-slate-800 hover:to-slate-800/50">
      {/* Gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/0 to-indigo-600/0 group-hover:from-indigo-600/5 group-hover:to-indigo-600/0 rounded-xl transition-all duration-300 pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{icon}</div>
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">{t(titleKey)}</h3>
        <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">{t(descriptionKey)}</p>
      </div>
    </div>
  );
};

/**
 * FeaturesSection Component
 * Displays a responsive grid of feature cards
 */
const FeaturesSection: React.FC = () => {
  const { t } = useTranslation();

  const features: Feature[] = [
    {
      id: 'local-processing',
      icon: '🔒',
      titleKey: 'features.localProcessing.title',
      descriptionKey: 'features.localProcessing.description',
    },
    {
      id: 'flexible-filtering',
      icon: '🎯',
      titleKey: 'features.flexibleFiltering.title',
      descriptionKey: 'features.flexibleFiltering.description',
    },
    {
      id: 'multiple-formats',
      icon: '📄',
      titleKey: 'features.multipleFormats.title',
      descriptionKey: 'features.multipleFormats.description',
    },
    {
      id: 'fast-processing',
      icon: '⚡',
      titleKey: 'features.fastProcessing.title',
      descriptionKey: 'features.fastProcessing.description',
    },
  ];

  return (
    <section id="features" className="w-full bg-slate-950 px-4 py-20 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">{t('features.title')}</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">{t('features.description')}</p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <FeatureCard key={feature.id} {...feature} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
};

/**
 * UseCaseCard Component
 * Displays a single use case with emoji and description
 */
const UseCaseCard: React.FC<UseCase & { t: (key: string) => string }> = ({ emoji, titleKey, descriptionKey, t }) => {
  return (
    <div className="group relative bg-gradient-to-br from-indigo-900/20 to-slate-900/20 border border-slate-700/50 rounded-xl p-6 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 hover:scale-105 hover:from-indigo-900/30 hover:to-slate-900/30">
      {/* Gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/0 to-indigo-600/0 group-hover:from-indigo-600/5 group-hover:to-indigo-600/0 rounded-xl transition-all duration-300 pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{emoji}</div>
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">{t(titleKey)}</h3>
        <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">{t(descriptionKey)}</p>
      </div>
    </div>
  );
};

/**
 * UseCasesSection Component
 * Displays use case cards in a responsive layout
 */
const UseCasesSection: React.FC = () => {
  const { t } = useTranslation();

  const useCases: UseCase[] = [
    {
      id: 'ai-analysis',
      emoji: '🤖',
      titleKey: 'useCases.aiAnalysis.title',
      descriptionKey: 'useCases.aiAnalysis.description',
    },
    {
      id: 'documentation',
      emoji: '📚',
      titleKey: 'useCases.documentation.title',
      descriptionKey: 'useCases.documentation.description',
    },
    {
      id: 'code-review',
      emoji: '👀',
      titleKey: 'useCases.codeReview.title',
      descriptionKey: 'useCases.codeReview.description',
    },
    {
      id: 'onboarding',
      emoji: '🚀',
      titleKey: 'useCases.onboarding.title',
      descriptionKey: 'useCases.onboarding.description',
    },
  ];

  return (
    <section className="w-full bg-gradient-to-b from-slate-900 to-slate-950 px-4 py-20 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">{t('useCases.title')}</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">{t('useCases.description')}</p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((useCase) => (
            <UseCaseCard key={useCase.id} {...useCase} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
};



// ============================================================================
// Main LandingPage Component
// ============================================================================

/**
 * LandingPage Component
 * Main landing page that composes all sections
 */
const LandingPage: React.FC<LandingPageProps> = ({ onSelectDirectory, isLoading = false }) => {
  return (
    <div className="w-full bg-slate-950">
      <HeroSection onSelectDirectory={onSelectDirectory} isLoading={isLoading} />
      <FeaturesSection />
      <UseCasesSection />
    </div>
  );
};

export default LandingPage;
