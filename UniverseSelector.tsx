import React, { useState } from 'react';
import { UniverseType, FetchUniverseType } from '../types';
import { ALL_NSE_STOCKS } from '../constants/allNseStocks';
import { 
  Globe, 
  Zap, 
  Layers, 
  Award, 
  SlidersHorizontal, 
  Building2, 
  Sparkles, 
  Flag,
  Check,
  ChevronDown
} from 'lucide-react';

export interface FetchUniverseToggleProps {
  fetchUniverse?: FetchUniverseType;
  setFetchUniverse?: (fetchUniverse: FetchUniverseType) => void;
  setUniverse?: (universe: UniverseType) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export const FetchUniverseToggle: React.FC<FetchUniverseToggleProps> = ({
  fetchUniverse = 'FNO',
  setFetchUniverse,
  setUniverse,
  className = ''
}) => {
  const handleSelect = (mode: FetchUniverseType) => {
    if (setFetchUniverse) {
      setFetchUniverse(mode);
    }
    if (setUniverse) {
      if (mode === 'FNO') {
        setUniverse('NIFTY_FNO');
      } else if (mode === 'ALL') {
        setUniverse('ALL_NSE');
      }
    }
  };

  return (
    <div className={`inline-flex items-center bg-slate-950/90 border border-slate-800 p-0.5 sm:p-1 rounded-xl shadow-inner ${className}`}>
      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider px-2 hidden sm:inline-block">
        Fetch:
      </span>
      <button
        type="button"
        onClick={() => handleSelect('FNO')}
        className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
          fetchUniverse === 'FNO'
            ? 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.35)] font-black'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
        }`}
        title="Fetch & process only NIFTY F&O active universe (180+ liquid stocks)"
      >
        <Zap className="w-3 h-3" />
        <span>NIFTY F&O</span>
      </button>
      <button
        type="button"
        onClick={() => handleSelect('ALL')}
        className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
          fetchUniverse === 'ALL'
            ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.35)] font-black'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
        }`}
        title="Fetch & process all available stocks (2000+ NSE Equities)"
      >
        <Globe className="w-3 h-3" />
        <span>ALL STOCKS</span>
      </button>
    </div>
  );
};

interface UniverseSelectorProps {
  universe: UniverseType;
  setUniverse: (universe: UniverseType) => void;
  fetchUniverse?: FetchUniverseType;
  setFetchUniverse?: (fetchUniverse: FetchUniverseType) => void;
  showFetchToggle?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'pills' | 'dropdown' | 'compact';
  customCount?: number;
  className?: string;
  onUniverseChanged?: (newUniverse: UniverseType) => void;
}

export interface UniverseOption {
  id: UniverseType;
  label: string;
  shortLabel: string;
  countText: string;
  icon: React.ReactNode;
  colorClass: string;
  badge?: string;
}

export const UNIVERSE_OPTIONS: UniverseOption[] = [
  {
    id: 'ALL_NSE',
    label: 'All NSE Stocks (2000+)',
    shortLabel: 'All NSE',
    countText: '2000+ Equities',
    icon: <Globe className="w-3.5 h-3.5 text-emerald-400" />,
    colorClass: 'emerald',
    badge: '2000+'
  },
  {
    id: 'NIFTY_FNO',
    label: 'NIFTY F&O Active (180+)',
    shortLabel: 'NIFTY F&O',
    countText: '182 Stocks',
    icon: <Zap className="w-3.5 h-3.5 text-amber-400" />,
    colorClass: 'amber',
    badge: 'F&O'
  },
  {
    id: 'NIFTY_50',
    label: 'NIFTY 50 (Mega Caps)',
    shortLabel: 'NIFTY 50',
    countText: '50 Mega Caps',
    icon: <Award className="w-3.5 h-3.5 text-cyan-400" />,
    colorClass: 'cyan',
    badge: 'Top 50'
  },
  {
    id: 'NIFTY_100',
    label: 'NIFTY 100 (Large Caps)',
    shortLabel: 'NIFTY 100',
    countText: '100 Large Caps',
    icon: <Building2 className="w-3.5 h-3.5 text-sky-400" />,
    colorClass: 'sky',
    badge: 'Top 100'
  },
  {
    id: 'NIFTY_200',
    label: 'NIFTY 200 (Broad Market)',
    shortLabel: 'NIFTY 200',
    countText: '200 Equities',
    icon: <Layers className="w-3.5 h-3.5 text-indigo-400" />,
    colorClass: 'indigo',
    badge: 'Top 200'
  },
  {
    id: 'NIFTY_500',
    label: 'NIFTY 500 (Comprehensive)',
    shortLabel: 'NIFTY 500',
    countText: '500 Equities',
    icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
    colorClass: 'purple',
    badge: 'Top 500'
  },
  {
    id: 'NIFTY_MIDCAP',
    label: 'NIFTY Midcap (150)',
    shortLabel: 'Midcap',
    countText: '150 Growth',
    icon: <Layers className="w-3.5 h-3.5 text-pink-400" />,
    colorClass: 'pink',
    badge: 'Midcap'
  },
  {
    id: 'NIFTY_SMALLCAP',
    label: 'NIFTY Smallcap (250)',
    shortLabel: 'Smallcap',
    countText: '250 High Beta',
    icon: <Layers className="w-3.5 h-3.5 text-rose-400" />,
    colorClass: 'rose',
    badge: 'Smallcap'
  },
  {
    id: 'US_TECH',
    label: 'US Tech Leaders (Nasdaq 100)',
    shortLabel: 'US Tech',
    countText: 'AAPL, NVDA, TSLA...',
    icon: <Flag className="w-3.5 h-3.5 text-blue-400" />,
    colorClass: 'blue',
    badge: 'US'
  },
  {
    id: 'CUSTOM',
    label: 'Custom Watchlist',
    shortLabel: 'Custom',
    countText: 'Custom Symbols',
    icon: <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />,
    colorClass: 'slate',
    badge: 'My List'
  }
];

export const UniverseSelector: React.FC<UniverseSelectorProps> = ({
  universe,
  setUniverse,
  fetchUniverse = 'FNO',
  setFetchUniverse,
  showFetchToggle = true,
  variant = 'pills',
  className = '',
  onUniverseChanged
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedOpt = UNIVERSE_OPTIONS.find(o => o.id === universe) || UNIVERSE_OPTIONS[0];

  const handleSelect = (id: UniverseType) => {
    setUniverse(id);
    if (setFetchUniverse) {
      if (id === 'NIFTY_FNO') setFetchUniverse('FNO');
      else if (id === 'ALL_NSE') setFetchUniverse('ALL');
    }
    if (onUniverseChanged) {
      onUniverseChanged(id);
    }
    setIsDropdownOpen(false);
  };

  if (variant === 'dropdown') {
    return (
      <div className={`inline-flex items-center gap-1.5 sm:gap-2 ${className}`}>
        {/* Compact Fetch Universe Toggle (F&O | ALL) */}
        {showFetchToggle && setFetchUniverse && (
          <FetchUniverseToggle
            fetchUniverse={fetchUniverse}
            setFetchUniverse={setFetchUniverse}
            setUniverse={setUniverse}
          />
        )}

        <div className="relative inline-block text-left">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(prev => !prev)}
            className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-mono font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
          >
            {selectedOpt.icon}
            <span>{selectedOpt.shortLabel}</span>
            <span className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.2 rounded border border-slate-700 font-normal">
              {selectedOpt.badge}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-1.5 w-64 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 shadow-2xl z-50 py-1.5 overflow-hidden animate-fadeIn">
                <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800/80 flex items-center justify-between">
                  <span>Stock Universe</span>
                  <span className="text-emerald-400 font-normal">All Indices</span>
                </div>

                {/* Quick Toggle Inside Dropdown */}
                {setFetchUniverse && (
                  <div className="p-2 border-b border-slate-800/60 bg-slate-900/40">
                    <div className="text-[10px] font-mono text-slate-400 mb-1 font-semibold">Base Fetch Universe:</div>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFetchUniverse('FNO');
                          setUniverse('NIFTY_FNO');
                          setIsDropdownOpen(false);
                        }}
                        className={`px-2 py-1 text-xs font-mono font-bold rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          fetchUniverse === 'FNO'
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Zap className="w-3 h-3" />
                        <span>F&O Active</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFetchUniverse('ALL');
                          setUniverse('ALL_NSE');
                          setIsDropdownOpen(false);
                        }}
                        className={`px-2 py-1 text-xs font-mono font-bold rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          fetchUniverse === 'ALL'
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Globe className="w-3 h-3" />
                        <span>All Stocks</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="max-h-72 overflow-y-auto custom-scrollbar">
                  {UNIVERSE_OPTIONS.map(opt => {
                    const isSelected = opt.id === universe;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelect(opt.id)}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors cursor-pointer text-xs font-mono ${
                          isSelected 
                            ? 'bg-emerald-500/15 text-emerald-300 font-bold' 
                            : 'text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {opt.icon}
                          <div>
                            <div className="text-slate-200">{opt.label}</div>
                            <div className="text-[10px] text-slate-500">{opt.countText}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Horizontal Pills Bar (Default)
  return (
    <div className={`flex items-center flex-wrap gap-1.5 ${className}`}>
      {/* Fetch Universe Toggle */}
      {showFetchToggle && setFetchUniverse && (
        <FetchUniverseToggle
          fetchUniverse={fetchUniverse}
          setFetchUniverse={setFetchUniverse}
          setUniverse={setUniverse}
          className="mr-1"
        />
      )}

      <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
        <Globe className="w-3.5 h-3.5 text-emerald-400" />
        Universe:
      </span>

      {UNIVERSE_OPTIONS.map((opt) => {
        const isSelected = opt.id === universe;
        return (
          <button
            key={opt.id}
            onClick={() => handleSelect(opt.id)}
            className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              isSelected
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)] font-black'
                : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800 hover:border-slate-700'
            }`}
            title={`${opt.label} (${opt.countText})`}
          >
            <span className={isSelected ? 'text-slate-950' : ''}>{opt.icon}</span>
            <span>{opt.shortLabel}</span>
            <span className={`text-[9px] px-1 py-0.2 rounded font-normal ${
              isSelected 
                ? 'bg-slate-950/20 text-slate-950 font-bold' 
                : 'bg-slate-800 text-slate-400'
            }`}>
              {opt.badge}
            </span>
          </button>
        );
      })}
    </div>
  );
};
