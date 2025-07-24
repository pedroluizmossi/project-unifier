import React from 'https://esm.sh/react@19.1.0';

const Footer = () => (
    <footer className="w-full py-3 px-0 mt-12 rounded-t-2xl bg-[rgba(15,23,42,0.80)] backdrop-blur-xl border-t border-slate-800/60 header-banner-glow">
        <div className="max-w-4xl mx-auto px-6 text-center text-slate-400">
            <p>
                Designed and built with <span role="img" aria-label="love">❤️</span> by{' '}
                <a
                    href="https://github.com/pedroluizmossi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gradient-text font-semibold hover:brightness-125 transition"
                >
                    Pedro Mossi
                </a>
            </p>
            <a
                href="https://github.com/pedroluizmossi/project-unifier"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:underline mt-1 inline-block text-sm"
            >
                View Project on GitHub
            </a>
        </div>
    </footer>
);

export default Footer;
