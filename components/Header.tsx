import React from 'https://esm.sh/react@19.1.0';

const Header = () => (
    <header className="w-full py-3 px-0 mb-8 rounded-b-2xl bg-[rgba(15,23,42,0.65)] backdrop-blur-xl border-b border-sky-800/40 header-banner-glow">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#header-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400 drop-shadow-lg">
                    <defs>
                        <linearGradient id="header-gradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#38bdf8"/>
                            <stop offset="50%" stopColor="#818cf8"/>
                            <stop offset="100%" stopColor="#c084fc"/>
                        </linearGradient>
                    </defs>
                    <rect x="3" y="3" width="18" height="18" rx="4" />
                    <path d="M7 7h10v10H7z" />
                </svg>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight gradient-text drop-shadow-lg">Project Unifier</h1>
            </div>
            <p className="text-base md:text-lg text-slate-300 font-medium mt-1 max-w-2xl text-center drop-shadow">
                Select a local directory to generate a single, context-rich file for LLMs.
            </p>
        </div>
    </header>
);

export default Header;
