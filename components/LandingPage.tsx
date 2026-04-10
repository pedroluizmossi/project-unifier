import React from 'react';
import { motion } from 'motion/react';
import { useTranslation } from '../hooks/useTranslation';
import { detectBrowserCapability } from '../lib/utils';

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

interface LandingPageProps {
  onSelectDirectory: () => void;
  isLoading?: boolean;
}

// ============================================================================
// Animation Variants
// ============================================================================

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

// ============================================================================
// Sub-Components
// ============================================================================

const BrowserCompatibilityBadge: React.FC = () => {
  const { t } = useTranslation();
  const capability = detectBrowserCapability();

  const badgeConfig = {
    native: { color: 'bg-green-500/20 border-green-500/50', icon: '✓', label: t('browserCompat.native') },
    fallback: { color: 'bg-yellow-500/20 border-yellow-500/50', icon: '⚠', label: t('browserCompat.fallback') },
    unsupported: { color: 'bg-red-500/20 border-red-500/50', icon: '✕', label: t('browserCompat.unsupported') },
  };

  const config = badgeConfig[capability];

  return (
    <motion.div
      variants={scaleIn}
      className={`inline-flex items-center gap-2 px-3 py-1.5 ${config.color} border rounded-full text-xs font-medium`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </motion.div>
  );
};

const HeroSection: React.FC<{ onSelectDirectory: () => void; isLoading?: boolean }> = ({
  onSelectDirectory,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-4 py-20 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        className="max-w-4xl w-full space-y-8 text-center relative z-10"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Browser Compatibility Badge */}
        <div className="flex justify-center">
          <BrowserCompatibilityBadge />
        </div>

        {/* Badge */}
        <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
          <span className="text-indigo-400 text-sm font-medium">{t('hero.badge')}</span>
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={fadeInUp} transition={{ duration: 0.6 }} className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-tight">
          {t('hero.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">{t('hero.titleHighlight')}</span>
        </motion.h1>

        {/* Description */}
        <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {t('hero.description')}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div variants={fadeInUp} className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            onClick={onSelectDirectory}
            disabled={isLoading}
            whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4)' }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="inline-block mr-2">⚙️</motion.span>
                {t('output.generating')}
              </>
            ) : (
              <>
                <span className="mr-2">🚀</span>
                {t('hero.ctaPrimary')}
              </>
            )}
          </motion.button>
          <motion.button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-indigo-400 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800 hover:border-indigo-500/50 transition-colors"
          >
            {t('hero.ctaSecondary')}
          </motion.button>
        </motion.div>

        {/* Trust Badges */}
        <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-800/50 max-w-md mx-auto">
          {[
            { icon: '🔒', label: t('hero.trustBadges.local') },
            { icon: '⚡', label: t('hero.trustBadges.fast') },
            { icon: '🤖', label: t('hero.trustBadges.ai') },
          ].map((badge, i) => (
            <motion.div
              key={i}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.15 }}
            >
              <span className="text-2xl mb-2">{badge.icon}</span>
              <span className="text-slate-400 text-xs font-medium">{badge.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

const FeatureCard: React.FC<Feature & { t: (key: string) => string; index: number }> = ({ icon, titleKey, descriptionKey, t, index }) => {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-6 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/0 to-indigo-600/0 group-hover:from-indigo-600/5 group-hover:to-indigo-600/0 rounded-xl transition-all duration-300 pointer-events-none" />
      <div className="relative z-10">
        <motion.div
          className="text-5xl mb-4"
          whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.4 }}
        >
          {icon}
        </motion.div>
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">{t(titleKey)}</h3>
        <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">{t(descriptionKey)}</p>
      </div>
    </motion.div>
  );
};

const FeaturesSection: React.FC = () => {
  const { t } = useTranslation();

  const features: Feature[] = [
    { id: 'local-processing', icon: '🔒', titleKey: 'features.localProcessing.title', descriptionKey: 'features.localProcessing.description' },
    { id: 'flexible-filtering', icon: '🎯', titleKey: 'features.flexibleFiltering.title', descriptionKey: 'features.flexibleFiltering.description' },
    { id: 'multiple-formats', icon: '📄', titleKey: 'features.multipleFormats.title', descriptionKey: 'features.multipleFormats.description' },
    { id: 'fast-processing', icon: '⚡', titleKey: 'features.fastProcessing.title', descriptionKey: 'features.fastProcessing.description' },
  ];

  return (
    <section id="features" className="w-full bg-slate-950 px-4 py-20 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.h2 variants={fadeInUp} className="text-4xl font-bold text-white mb-4">{t('features.title')}</motion.h2>
          <motion.p variants={fadeInUp} className="text-slate-400 text-lg max-w-2xl mx-auto">{t('features.description')}</motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          {features.map((feature, i) => (
            <FeatureCard key={feature.id} {...feature} t={t} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const UseCaseCard: React.FC<UseCase & { t: (key: string) => string; index: number }> = ({ emoji, titleKey, descriptionKey, t, index }) => {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group relative bg-gradient-to-br from-indigo-900/20 to-slate-900/20 border border-slate-700/50 rounded-xl p-6 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/0 to-indigo-600/0 group-hover:from-indigo-600/5 group-hover:to-indigo-600/0 rounded-xl transition-all duration-300 pointer-events-none" />
      <div className="relative z-10">
        <motion.div
          className="text-5xl mb-4"
          whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.4 }}
        >
          {emoji}
        </motion.div>
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">{t(titleKey)}</h3>
        <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">{t(descriptionKey)}</p>
      </div>
    </motion.div>
  );
};

const UseCasesSection: React.FC = () => {
  const { t } = useTranslation();

  const useCases: UseCase[] = [
    { id: 'ai-analysis', emoji: '🤖', titleKey: 'useCases.aiAnalysis.title', descriptionKey: 'useCases.aiAnalysis.description' },
    { id: 'documentation', emoji: '📚', titleKey: 'useCases.documentation.title', descriptionKey: 'useCases.documentation.description' },
    { id: 'code-review', emoji: '👀', titleKey: 'useCases.codeReview.title', descriptionKey: 'useCases.codeReview.description' },
    { id: 'onboarding', emoji: '🚀', titleKey: 'useCases.onboarding.title', descriptionKey: 'useCases.onboarding.description' },
  ];

  return (
    <section className="w-full bg-gradient-to-b from-slate-900 to-slate-950 px-4 py-20 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.h2 variants={fadeInUp} className="text-4xl font-bold text-white mb-4">{t('useCases.title')}</motion.h2>
          <motion.p variants={fadeInUp} className="text-slate-400 text-lg max-w-2xl mx-auto">{t('useCases.description')}</motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          {useCases.map((useCase, i) => (
            <UseCaseCard key={useCase.id} {...useCase} t={t} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// ============================================================================
// Main LandingPage Component
// ============================================================================

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
