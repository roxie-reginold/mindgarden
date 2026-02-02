import React from 'react';
import { Grid, Map } from 'lucide-react';
import { AppView } from '../types';

interface HeaderProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, setView }) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-6 md:px-12 bg-paper/90 backdrop-blur-md border-b border-stone-200/50 shadow-sm transition-all duration-300">
      
      {/* Logo Section */}
      <div 
        onClick={() => setView(AppView.GARDEN)}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="relative w-8 h-8 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm transition-transform group-hover:scale-105">
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FCD34D" />
                <stop offset="50%" stopColor="#FCA5A5" />
                <stop offset="100%" stopColor="#818CF8" />
              </linearGradient>
            </defs>
            <path d="M50 5 C50 5, 90 40, 90 65 C90 85, 70 95, 50 95 C30 95, 10 85, 10 65 C10 40, 50 5, 50 5 Z" fill="url(#logoGradient)" className="opacity-90" />
            <circle cx="50" cy="65" r="15" fill="#fff" fillOpacity="0.4" filter="blur(4px)" />
          </svg>
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="text-xl font-serif font-bold text-stone-700 tracking-tight leading-none">
            MindGarden
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Navigation Pills */}
        <nav className="flex gap-1 bg-stone-100/50 p-1 rounded-full border border-stone-200/50">
          <button
            onClick={() => setView(AppView.GARDEN)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
              currentView === AppView.GARDEN
                ? 'bg-white text-stone-800 shadow-sm ring-1 ring-black/5'
                : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200/50'
            }`}
          >
            <Map size={14} />
            <span className="hidden sm:inline">Garden</span>
          </button>

          <button
            onClick={() => setView(AppView.LIST)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
              currentView === AppView.LIST
                ? 'bg-white text-stone-800 shadow-sm ring-1 ring-black/5'
                : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200/50'
            }`}
          >
            <Grid size={14} />
            <span className="hidden sm:inline">Collection</span>
          </button>
        </nav>

      </div>
    </header>
  );
};