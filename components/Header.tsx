import React from 'https://esm.sh/react@19.1.0';

const Header = () => (
    <header className="text-center w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-3">
             <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
             <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Project Unifier</h1>
        </div>
        <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
            Select a local directory to generate a single, context-rich file for LLMs.
        </p>
    </header>
);

export default Header;
