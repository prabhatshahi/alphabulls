import React, { useState } from 'react';
import { 
  Activity, 
  Flame, 
  BarChart2, 
  FileText, 
  UploadCloud, 
  Code, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  Zap, 
  Grid, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Sun, 
  Moon, 
  Search, 
  SlidersHorizontal, 
  Sliders, 
  Compass, 
  Cpu, 
  Smartphone, 
  ArrowLeft, 
  PanelLeft, 
  Globe, 
  Bell,
  BellOff,
  Settings,
  Award
} from 'lucide-react';
import { TabType } from '../App';
import { AiAlphaAlertConfig, UniverseType, FetchUniverseType } from '../types';
import { UniverseSelector } from './UniverseSelector';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  timeframe: '5m' | '15m';
  setTimeframe: (tf: '5m' | '15m') => void;
  universe: UniverseType;
  setUniverse: (u: UniverseType) => void;
  fetchUniverse?: FetchUniverseType;
  setFetchUniverse?: (f: FetchUniverseType) => void;
  onOpenTestModal: () => void;
  onOpenApkModal?: () => void;
  theme?: 'dark' | 'light';
  toggleTheme?: () => void;
  onSelectSymbolForChart?: (symbol: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  onGoBack?: () => void;
  previousTabName?: string;
  onOpenAlertModal?: () => void;
  alertConfig?: AiAlphaAlertConfig;
  onToggleAlerts?: (forcedState?: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  timeframe,
  setTimeframe,
  universe,
  setUniverse,
  fetchUniverse,
  setFetchUniverse,
  onOpenTestModal,
  onOpenApkModal,
  theme = 'dark',
  toggleTheme,
  onSelectSymbolForChart,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  onGoBack,
  previousTabName,
  onOpenAlertModal,
  alertConfig,
  onToggleAlerts
}) => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    let formatted = searchQuery.trim().toUpperCase().replace(/\s+/g, '');
    if (!formatted.includes('.')) {
      const knownUs = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'GOOG', 'AMZN', 'META', 'TSLA', 'AMD', 'NFLX', 'SPY', 'QQQ', 'INTC', 'BA'];
      if (!knownUs.includes(formatted)) {
        formatted += '.NS';
      }
    }
    if (onSelectSymbolForChart) {
      onSelectSymbolForChart(formatted);
    }
    setSearchQuery('');
  };

  const navCategories = [
    {
      title: 'MASTER INTRADAY ENGINE',
      items: [
        { id: 'ai_perfect_confluence' as TabType, label: '🌟 AI Perfect Confluence', icon: <Award className="w-4 h-4 text-amber-400 animate-pulse" />, badge: 'A+++', desc: '10-Pillar 100% Perfect Setups' },
        { id: 'trending_radar' as TabType, label: 'Trending Radar', icon: <Activity className="w-4 h-4 text-orange-400 animate-pulse" />, badge: '5M TREND', desc: 'Real-time 5-Min Swing & Trend Radar' },
        { id: 'confluence' as TabType, label: 'Intraday Master Confluence', icon: <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />, badge: 'MASTER', desc: 'Conflate All Scanners & Signals' },
        { id: 'confluence_sector' as TabType, label: '🌐 Sector Aligned Stocks', icon: <Globe className="w-4 h-4 text-cyan-400" />, badge: 'ALIGNED', desc: 'Confluence Aligned with Sector Tide' },
        { id: 'scanner_bullish' as TabType, label: '🚀 Intraday Bullish Picks', icon: <TrendingUp className="w-4 h-4 text-emerald-400" />, badge: 'BULL', desc: 'ADR & Volume Breakouts' },
        { id: 'scanner_bearish' as TabType, label: '📉 Intraday Bearish Picks', icon: <TrendingDown className="w-4 h-4 text-rose-400" />, badge: 'BEAR', desc: 'Heavy Distribution & Breakdowns' },
      ]
    },
    {
      title: 'SCANNER & MARKETS',
      items: [
        { id: 'all_nse_stocks' as TabType, label: 'All NSE Stocks (2000+)', icon: <Globe className="w-4 h-4 text-emerald-400 animate-pulse" />, badge: 'NSE', desc: 'Complete NSE Equities Directory' },
        { id: 'scanner' as TabType, label: 'Live Stock Finder', icon: <Activity className="w-4 h-4 text-emerald-400" />, desc: 'ADR Breakout Radar' },
        { id: 'scanner_heatmap' as TabType, label: 'Sector Heatmap', icon: <Grid className="w-4 h-4 text-amber-400" />, desc: '27 Sectors Grid' },
        { id: 'aipov' as TabType, label: 'AI Alpha Signals', icon: <Sparkles className="w-4 h-4 text-indigo-400" />, badge: 'AI', desc: 'Quantitative Signals' },
      ]
    },
    {
      title: 'VOLUME INTELLIGENCE',
      items: [
        { id: 'unusual_volume' as TabType, label: 'Unusual Volume Radar', icon: <Zap className="w-4 h-4 text-amber-400 animate-pulse" />, badge: 'NEW', desc: 'RVOL & Momentum Detector' },
        { id: 'vol4types' as TabType, label: '4-Type Vol Candles', icon: <BarChart2 className="w-4 h-4 text-blue-400" />, desc: 'Lime/Maroon/Blue Candles' },
        { id: 'voltype5' as TabType, label: 'Type 5 Climax', icon: <Zap className="w-4 h-4 text-amber-400" />, badge: '15m', desc: 'ADR Volume Climax' },
        { id: 'hotstocks' as TabType, label: 'RVOL & CVD Hot Stocks', icon: <Flame className="w-4 h-4 text-orange-400" />, desc: 'High Vol Surge' },
      ]
    },
    {
      title: 'ANALYSIS & TOOLS',
      items: [
        { id: 'chart' as TabType, label: 'Volume Profile & Charts', icon: <Sliders className="w-4 h-4 text-amber-400" />, badge: 'VPVR', desc: 'Volume Profile & Support/Resistance' },
        { id: 'backtest' as TabType, label: 'Backtest Engine', icon: <Cpu className="w-4 h-4 text-sky-400" />, desc: 'Historical Performance' },
        { id: 'csv' as TabType, label: 'Upload Custom CSV', icon: <UploadCloud className="w-4 h-4 text-purple-400" />, desc: 'Custom Dataset' },
        { id: 'python' as TabType, label: 'Python Exporter', icon: <Code className="w-4 h-4 text-emerald-400" />, desc: 'Algo Script' },
      ]
    },
    {
      title: 'QUICK FILTER TABLES',
      items: [
        { id: 'scanner_volume' as TabType, label: 'Volume Surges', icon: <Zap className="w-4 h-4 text-amber-400" /> },
        { id: 'scanner_multiday' as TabType, label: 'Multi-Day & Reversals', icon: <Layers className="w-4 h-4 text-purple-400" /> },
        { id: 'scanner_watchlist' as TabType, label: 'Watchlist Matrix', icon: <Compass className="w-4 h-4 text-sky-400" /> },
      ]
    }
  ];

  const currentTabObj = navCategories.flatMap(c => c.items).find(i => i.id === activeTab) || navCategories[0].items[0];

  return (
    <>
      {/* LEFT TERMINAL SIDEBAR (Desktop) */}
      <aside className={`fixed top-0 left-0 bottom-0 z-40 hidden md:flex flex-col bg-slate-950/95 backdrop-blur-xl border-r border-slate-800/80 transition-all duration-300 shadow-2xl ${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        
        {/* BRAND & TOGGLE HEADER */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
          {!isSidebarCollapsed ? (
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="font-black text-sm text-slate-100 tracking-wider font-mono">ALPHA BULLS</h1>
                <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> PRO TERMINAL
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/30 text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
          )}

          <button
            onClick={() => setIsSidebarCollapsed(prev => !prev)}
            className="text-slate-400 hover:text-slate-100 p-1.5 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6 custom-scrollbar">
          {navCategories.map((cat, idx) => (
            <div key={idx} className="space-y-1">
              {!isSidebarCollapsed && (
                <div className="px-3 text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">
                  {cat.title}
                </div>
              )}
              {cat.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center transition-all cursor-pointer rounded-xl group relative ${
                      isSidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5 space-x-3'
                    } ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                    }`}
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    <div className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'scale-110' : ''}`}>
                      {item.icon}
                    </div>

                    {!isSidebarCollapsed && (
                      <div className="flex-1 text-left truncate">
                        <div className="text-xs font-semibold flex items-center justify-between">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1.5 py-0.2 rounded font-mono border border-amber-500/30 ml-1">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Active Bar Indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-400 rounded-r-full" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* BOTTOM SIDEBAR TOGGLE & VERIFICATION WIDGET */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950 shrink-0 space-y-2">
          <button
            onClick={() => setIsSidebarCollapsed(prev => !prev)}
            className="w-full bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-300 p-2 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-mono font-bold cursor-pointer"
            title={isSidebarCollapsed ? "Expand Left Sidebar" : "Collapse Left Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4 text-emerald-400" /> : <ChevronLeft className="w-4 h-4 text-emerald-400" />}
            {!isSidebarCollapsed && <span>Collapse Sidebar</span>}
          </button>

          {!isSidebarCollapsed ? (
            <button
              onClick={onOpenTestModal}
              className="w-full bg-slate-900/90 hover:bg-emerald-500/10 hover:border-emerald-500/40 border border-slate-800 text-slate-300 hover:text-emerald-300 p-2.5 rounded-xl transition-all flex items-center justify-between text-xs font-semibold cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Verification Audit</span>
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/30 font-mono">
                PASS
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenTestModal}
              className="w-full p-2 flex justify-center text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors"
              title="Verification Audit"
            >
              <ShieldCheck className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* TOP SMART HEADER BAR */}
      <header className={`sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 transition-all duration-300 ${
        isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
      }`}>
        <div className="px-2.5 sm:px-4 py-2 flex items-center justify-between gap-2 overflow-x-hidden">
          
          {/* Left: Back Button (if history exists), Mobile Drawer Trigger & Workspace Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {onGoBack && (
              <button
                onClick={onGoBack}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-2.5 sm:px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0 active:scale-95 transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.3)] text-xs font-mono"
                title={`Back to ${previousTabName || 'Previous Screen'}`}
              >
                <ArrowLeft className="w-4 h-4 stroke-[3]" />
                <span className="hidden xs:inline">Back{previousTabName ? ` to ${previousTabName}` : ''}</span>
                <span className="xs:hidden">Back</span>
              </button>
            )}

            {/* Mobile Drawer Trigger */}
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden text-slate-300 hover:text-slate-100 p-2 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer shrink-0 active:scale-95 transition-transform"
              aria-label="Open Mobile Menu"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Left Sidebar Toggle Button */}
            <button
              onClick={() => setIsSidebarCollapsed(prev => !prev)}
              className="hidden md:flex text-slate-300 hover:text-emerald-300 p-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 rounded-xl cursor-pointer shrink-0 active:scale-95 transition-all shadow-md items-center gap-1.5"
              aria-label="Toggle Left Sidebar"
              title={isSidebarCollapsed ? "Expand Left Sidebar Navigation" : "Collapse Left Sidebar Navigation"}
            >
              <PanelLeft className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-mono font-bold text-slate-300 hidden xl:inline">
                {isSidebarCollapsed ? 'Expand Side Menu' : 'Collapse Side Menu'}
              </span>
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <h2 className="font-bold text-slate-100 text-xs sm:text-sm md:text-base truncate flex items-center gap-1.5">
                  <span className="truncate">{currentTabObj.label}</span>
                </h2>
                <span className="bg-emerald-500/10 text-emerald-400 text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full border border-emerald-500/30 font-mono shrink-0">
                  LIVE
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 hidden lg:block truncate">
               Breakout Engine
              </p>
            </div>
          </div>

          {/* Center: Quick Symbol Search (Visible on Mobile & Desktop) */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-[140px] xs:max-w-[180px] sm:max-w-[240px] lg:max-w-xs relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search ticker (e.g. SBIN)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 text-[11px] sm:text-xs rounded-xl pl-7 pr-2.5 py-1.5 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 transition-all font-mono"
            />
          </form>

          {/* Right: Compact Responsive Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Global Stock Universe Dropdown & Fetch Universe Control */}
            <UniverseSelector
              universe={universe}
              setUniverse={setUniverse}
              fetchUniverse={fetchUniverse}
              setFetchUniverse={setFetchUniverse}
              variant="dropdown"
            />

            {/* Timeframe Pill Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 sm:p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTimeframe('5m')}
                className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                  timeframe === '5m'
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                5m
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('15m')}
                className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                  timeframe === '15m'
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                15m
              </button>
            </div>

            {/* AI Alpha Score Alert One-Click Toggle & Settings Pill */}
            <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl shadow-md">
              {/* Master 1-Click Toggle Button */}
              <button
                type="button"
                onClick={() => onToggleAlerts ? onToggleAlerts() : onOpenAlertModal?.()}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer select-none active:scale-95 ${
                  alertConfig?.enabled
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'bg-slate-950/80 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
                title={alertConfig?.enabled ? 'AI Alerts are ACTIVE. Click to Turn OFF' : 'AI Alerts are MUTED. Click to Turn ON'}
              >
                {alertConfig?.enabled ? (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <Bell className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline font-black text-[11px] text-emerald-300">
                      ON <span className="text-[10px] text-emerald-400 opacity-80">≥{alertConfig?.minScore || 80}%</span>
                    </span>
                    <span className="sm:hidden font-black text-[10px] text-emerald-300">ON</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                    <BellOff className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-bold text-[11px] text-slate-400">OFF</span>
                  </>
                )}
              </button>

              {/* Alert Settings Modal Trigger */}
              {onOpenAlertModal && (
                <button
                  type="button"
                  onClick={onOpenAlertModal}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer ml-0.5"
                  title="Configure Alert Threshold, Sounds & Position"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Android APK Button */}
            {onOpenApkModal && (
              <button
                onClick={onOpenApkModal}
                className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl transition-all flex items-center space-x-1.5 text-xs cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.15)] active:scale-95"
                title="Install Android App / Download APK"
              >
                <Smartphone className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="hidden md:inline font-mono text-[11px]">Android App</span>
              </button>
            )}

            {/* Theme Toggle */}
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className="p-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 rounded-xl transition-colors cursor-pointer active:scale-95"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
              </button>
            )}
          </div>
        </div>

        {/* PRIMARY TOP HORIZONTAL NAVIGATION TAB BAR */}
        <div className="px-2 sm:px-4 py-1.5 bg-slate-950/95 border-t border-slate-800/60 overflow-x-auto no-scrollbar flex items-center space-x-1.5 sm:space-x-2">
          <button
            onClick={() => setActiveTab('ai_perfect_confluence')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'ai_perfect_confluence' || activeTab.startsWith('ai_perfect')
                ? 'bg-amber-500/20 text-amber-300 border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-slate-900/90 text-amber-300/80 border border-amber-500/30 hover:bg-slate-800 hover:text-amber-200'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>🌟 AI PERFECT CONFLUENCE</span>
            <span className="bg-amber-500/30 text-amber-200 text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase">
              A+++
            </span>
          </button>

          <button
            onClick={() => setActiveTab('trending_radar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'trending_radar'
                ? 'bg-orange-500/25 text-orange-200 border-2 border-orange-400 shadow-[0_0_18px_rgba(249,115,22,0.4)] ring-1 ring-orange-400/50'
                : 'bg-slate-900/90 text-orange-300 border border-orange-500/40 hover:bg-slate-800 hover:text-orange-200 hover:border-orange-400'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            <span>⚡ 5M TRENDING RADAR</span>
            <span className="bg-orange-500/30 text-orange-200 text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase">
              5M
            </span>
          </button>

          <button
            onClick={() => setActiveTab('confluence')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'confluence'
                ? 'bg-amber-500/20 text-amber-300 border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-slate-900/90 text-amber-300/80 border border-amber-500/30 hover:bg-slate-800 hover:text-amber-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>✨ INTRADAY CONFLUENCE</span>
            <span className="bg-amber-500/30 text-amber-200 text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase">
              MASTER
            </span>
          </button>

          <button
            onClick={() => setActiveTab('confluence_sector')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'confluence_sector'
                ? 'bg-cyan-500/20 text-cyan-300 border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-slate-900/90 text-cyan-300/80 border border-cyan-500/30 hover:bg-slate-800 hover:text-cyan-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
            <span>🌐 SECTOR ALIGNED</span>
            <span className="bg-cyan-500/30 text-cyan-200 text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase">
              SECTOR
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all_nse_stocks')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'all_nse_stocks'
                ? 'bg-emerald-500/25 text-emerald-200 border-2 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'bg-slate-900/90 text-emerald-400/90 border border-emerald-500/30 hover:bg-slate-800 hover:text-emerald-300'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>🌐 ALL NSE STOCKS (2000+)</span>
            <span className="bg-emerald-500/30 text-emerald-200 text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase">
              NSE
            </span>
          </button>

          <button
            onClick={() => setActiveTab('scanner_bullish')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-semibold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'scanner_bullish'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400 shadow-sm'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-emerald-400'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>🚀 Bullish Picks</span>
          </button>

          <button
            onClick={() => setActiveTab('scanner_bearish')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-semibold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'scanner_bearish'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-400 shadow-sm'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-rose-400'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            <span>📉 Bearish Picks</span>
          </button>

          <button
            onClick={() => setActiveTab('unusual_volume')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-semibold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'unusual_volume'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400 shadow-sm'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-amber-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>⚡ Unusual Vol</span>
          </button>

          <button
            onClick={() => setActiveTab('hotstocks')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-semibold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'hotstocks'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-400 shadow-sm'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-orange-400'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>🔥 RVOL & CVD Hot</span>
          </button>

          <button
            onClick={() => setActiveTab('chart')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-semibold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'chart'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400 shadow-sm'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-sky-300'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <span>📊 Volume Profile & Charts</span>
          </button>

          <button
            onClick={() => setActiveTab('aipov')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-semibold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'aipov'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400 shadow-sm'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-indigo-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>🎯 AI Alpha Signals</span>
          </button>

          {onOpenAlertModal && (
            <button
              onClick={onOpenAlertModal}
              className="px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 hover:bg-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)] active:scale-95"
            >
              <Bell className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
              <span>🔔 SET SCORE ALERT</span>
              <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded">
                ≥{alertConfig?.minScore || 80}%
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('scanner_heatmap')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-semibold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'scanner_heatmap'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400 shadow-sm'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-amber-300'
            }`}
          >
            <Grid className="w-3.5 h-3.5 text-amber-400" />
            <span>🌐 Sectors</span>
          </button>
        </div>
      </header>

      {/* MOBILE OVERLAY DRAWER */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-950/85 backdrop-blur-md flex transition-opacity animate-fadeIn">
          <div className="w-[300px] max-w-[85vw] bg-slate-950 border-r border-slate-800 h-full flex flex-col p-4 space-y-4 overflow-y-auto shadow-2xl custom-scrollbar">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/30 text-emerald-400">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <span className="font-extrabold text-slate-100 font-mono text-sm block">ALPHA BULLS</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-semibold">PRO TERMINAL</span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-2 rounded-xl hover:bg-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Back Button inside Mobile Drawer */}
            {onGoBack && (
              <button
                onClick={() => {
                  onGoBack();
                  setIsMobileDrawerOpen(false);
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black p-2.5 rounded-xl transition-all flex items-center justify-between text-xs cursor-pointer shadow-md"
              >
                <div className="flex items-center space-x-2">
                  <ArrowLeft className="w-4 h-4 text-slate-950 stroke-[3]" />
                  <span>Back to {previousTabName || 'Previous Screen'}</span>
                </div>
                <span className="bg-slate-950/20 text-slate-950 text-[10px] px-2 py-0.5 rounded-full font-mono font-extrabold">RETURN</span>
              </button>
            )}

            {/* Mobile Search Bar */}
            <form onSubmit={(e) => { handleSearchSubmit(e); setIsMobileDrawerOpen(false); }} className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search symbol (e.g. RELIANCE)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-emerald-500/60 font-mono"
              />
            </form>

            {/* Mobile Universe Selector & Fetch Universe Controls */}
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase font-mono">Stock Universe & Fetch</div>
              <UniverseSelector
                universe={universe}
                setUniverse={(u) => {
                  setUniverse(u);
                  setIsMobileDrawerOpen(false);
                }}
                fetchUniverse={fetchUniverse}
                setFetchUniverse={setFetchUniverse}
                variant="dropdown"
                className="w-full"
              />
            </div>

            {/* Mobile Live Alert Switch & Status */}
            <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
              alertConfig?.enabled
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-lg ${alertConfig?.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                  {alertConfig?.enabled ? <Bell className="w-4 h-4 text-emerald-400 animate-pulse" /> : <BellOff className="w-4 h-4" />}
                </div>
                <div>
                  <div className="font-extrabold text-xs text-white">Live AI Signal Alerts</div>
                  <div className="text-[10px] text-slate-400">
                    {alertConfig?.enabled ? `Active: Triggering ≥ ${alertConfig.minScore}%` : 'Muted / Paused'}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => onToggleAlerts?.()}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    alertConfig?.enabled
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {alertConfig?.enabled ? 'ON' : 'OFF'}
                </button>
                {onOpenAlertModal && (
                  <button
                    onClick={() => { onOpenAlertModal(); setIsMobileDrawerOpen(false); }}
                    className="p-1.5 bg-slate-800 text-slate-300 rounded-lg hover:text-white"
                    title="Alert Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Android APK Button inside Mobile Drawer */}
            {onOpenApkModal && (
              <button
                onClick={() => { onOpenApkModal(); setIsMobileDrawerOpen(false); }}
                className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold p-2.5 rounded-xl transition-all flex items-center justify-between text-xs cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-emerald-400 animate-bounce" />
                  <span>Install Android App (APK)</span>
                </div>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-mono">INSTALL</span>
              </button>
            )}

            {/* Navigation Categories */}
            <div className="flex-1 space-y-5 pt-2">
              {navCategories.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="text-[10px] font-extrabold text-slate-500 tracking-widest uppercase px-1 mb-1 font-mono">
                    {cat.title}
                  </div>
                  {cat.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileDrawerOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                        activeTab === item.id
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-md'
                          : 'text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="shrink-0">{item.icon}</div>
                        <span className="text-xs font-semibold">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1.5 py-0.5 rounded font-mono border border-amber-500/30">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Mobile Footer Audit Link */}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => { onOpenTestModal(); setIsMobileDrawerOpen(false); }}
                className="w-full bg-slate-900 border border-slate-800 text-slate-300 p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Verification Audit</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">PASS</span>
              </button>
            </div>

          </div>
          <div className="flex-1" onClick={() => setIsMobileDrawerOpen(false)} />
        </div>
      )}
    </>
  );
};
