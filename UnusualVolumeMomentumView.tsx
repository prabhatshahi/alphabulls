import React, { useState, useEffect, useMemo } from 'react';
import { StockScanStatus, UniverseType } from '../types';
import { UniverseSelector } from './UniverseSelector';
import { getNseStocksByUniverse } from '../constants/allNseStocks';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  Search,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  Gauge,
  BarChart2,
  ArrowUpDown,
  Compass,
  AlertTriangle,
  Info,
  ChevronRight,
  Filter,
  Eye,
  Layers
} from 'lucide-react';

export interface UnusualVolumeStock extends StockScanStatus {
  momentumScore: number; // 0 - 100
  momentumState: 'BULLISH_SURGE' | 'BEARISH_DUMP' | 'VOLUME_SQUEEZE' | 'REVERSAL_BOUNCE' | 'NEUTRAL_ACCUMULATION';
  latestBarRvol: number; // Current bar vol vs average bar vol
  priceAcceleration: number; // Rate of change intensity
  volClimaxRatio: number;
}

interface UnusualVolumeMomentumViewProps {
  timeframe: '5m' | '15m';
  setTimeframe?: (tf: '5m' | '15m') => void;
  universe: UniverseType;
  setUniverse?: (u: UniverseType) => void;
  onSelectSymbolForChart: (symbol: string) => void;
  onOpenChartModal?: (symbol: string) => void;
  initialSubTab?: 'ALL' | 'BULLISH' | 'BEARISH' | 'SQUEEZE' | 'EXTREME_RVOL';
}

export const UnusualVolumeMomentumView: React.FC<UnusualVolumeMomentumViewProps> = ({
  timeframe,
  setTimeframe,
  universe,
  setUniverse,
  onSelectSymbolForChart,
  onOpenChartModal,
  initialSubTab = 'ALL'
}) => {
  const [rawStocks, setRawStocks] = useState<StockScanStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'BULLISH' | 'BEARISH' | 'SQUEEZE' | 'EXTREME_RVOL'>(initialSubTab);
  const [minRvol, setMinRvol] = useState<number>(1.2);
  const [sortBy, setSortBy] = useState<'RVOL' | 'SCORE' | 'CHANGE' | 'CVD' | 'VOLUME' | 'SYMBOL'>('RVOL');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  const fetchScanData = async () => {
    setLoading(true);
    setError(null);
    try {
      let symbols: string[] = [];
      if (universe === 'CUSTOM') {
        symbols = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'AAPL', 'NVDA', 'TSLA'];
      } else {
        symbols = getNseStocksByUniverse(universe);
      }

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols, timeframe, universe }),
      });
      if (!res.ok) throw new Error('Failed to fetch stock volume and momentum metrics');
      const data = await res.json();
      setRawStocks(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Error loading stock volume scanner data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScanData();
  }, [timeframe, universe]);

  // Transform raw stock scan data to evaluate Unusual Volume & Momentum metrics
  const processedStocks: UnusualVolumeStock[] = useMemo(() => {
    return rawStocks.map((stock) => {
      const rvol = stock.rvol || 1.0;
      const priceChangePct = stock.priceChangePct || 0;
      const cvdRatio = stock.cvdRatio || 0;
      const cvd = stock.cvd || 0;

      // Classify momentum state
      let momentumState: UnusualVolumeStock['momentumState'] = 'NEUTRAL_ACCUMULATION';
      
      const absChange = Math.abs(priceChangePct);
      const isHighVol = rvol >= 1.5;

      if (priceChangePct >= 0.8 && (rvol >= 1.3 || cvdRatio > 0.15)) {
        momentumState = 'BULLISH_SURGE';
      } else if (priceChangePct <= -0.8 && (rvol >= 1.3 || cvdRatio < -0.15)) {
        momentumState = 'BEARISH_DUMP';
      } else if (rvol >= 1.8 && absChange < 0.6) {
        // High volume, small price movement = Volume Squeeze / Absorption
        momentumState = 'VOLUME_SQUEEZE';
      } else if (stock.reversalType && stock.reversalType !== 'NONE' && rvol >= 1.4) {
        momentumState = 'REVERSAL_BOUNCE';
      } else if (priceChangePct > 0) {
        momentumState = 'BULLISH_SURGE';
      } else if (priceChangePct < 0) {
        momentumState = 'BEARISH_DUMP';
      }

      // Compute composite Momentum-Volume Score (0 to 100)
      // Factors: RVOL weight (40%), Price Change magnitude (30%), CVD Buy/Sell alignment (20%), Signal/Breakout bonus (10%)
      const rvolComponent = Math.min(40, (rvol / 4.0) * 40);
      const priceComponent = Math.min(30, (absChange / 4.0) * 30);
      const cvdComponent = Math.min(20, Math.abs(cvdRatio) * 20);
      const signalBonus = stock.status !== 'NEUTRAL' ? 10 : 0;

      const rawScore = Math.round(rvolComponent + priceComponent + cvdComponent + signalBonus);
      const momentumScore = Math.min(100, Math.max(10, rawScore));

      const latestBarRvol = Number((rvol * (1 + (Math.abs(cvdRatio) * 0.5))).toFixed(2));
      const priceAcceleration = Number((priceChangePct * (rvol >= 1 ? rvol : 1)).toFixed(2));
      const volClimaxRatio = Number((rvol * 1.2).toFixed(2));

      return {
        ...stock,
        momentumState,
        momentumScore,
        latestBarRvol,
        priceAcceleration,
        volClimaxRatio,
      };
    });
  }, [rawStocks]);

  // Filter and Sort
  const filteredStocks = useMemo(() => {
    return processedStocks
      .filter((s) => {
        const matchesSearch = s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase()));
        if (!matchesSearch) return false;

        const rvol = s.rvol || 1.0;
        if (rvol < minRvol) return false;

        if (activeCategory === 'BULLISH') return s.momentumState === 'BULLISH_SURGE' || s.priceChangePct > 0;
        if (activeCategory === 'BEARISH') return s.momentumState === 'BEARISH_DUMP' || s.priceChangePct < 0;
        if (activeCategory === 'SQUEEZE') return s.momentumState === 'VOLUME_SQUEEZE' || (rvol >= 1.5 && Math.abs(s.priceChangePct) < 0.8);
        if (activeCategory === 'EXTREME_RVOL') return rvol >= 2.0;

        return true;
      })
      .sort((a, b) => {
        let valA: number | string = 0;
        let valB: number | string = 0;

        switch (sortBy) {
          case 'RVOL':
            valA = a.rvol || 0;
            valB = b.rvol || 0;
            break;
          case 'SCORE':
            valA = a.momentumScore;
            valB = b.momentumScore;
            break;
          case 'CHANGE':
            valA = a.priceChangePct || 0;
            valB = b.priceChangePct || 0;
            break;
          case 'CVD':
            valA = a.cvd || 0;
            valB = b.cvd || 0;
            break;
          case 'VOLUME':
            valA = a.volume || 0;
            valB = b.volume || 0;
            break;
          case 'SYMBOL':
            valA = a.symbol;
            valB = b.symbol;
            break;
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortOrder === 'ASC' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortOrder === 'ASC' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [processedStocks, searchQuery, activeCategory, minRvol, sortBy, sortOrder]);

  // Aggregate Stats
  const totalUnusual = processedStocks.filter(s => (s.rvol || 1.0) >= 1.2).length;
  const bullishCount = processedStocks.filter(s => s.momentumState === 'BULLISH_SURGE').length;
  const bearishCount = processedStocks.filter(s => s.momentumState === 'BEARISH_DUMP').length;
  const squeezeCount = processedStocks.filter(s => s.momentumState === 'VOLUME_SQUEEZE').length;
  const extremeRvolCount = processedStocks.filter(s => (s.rvol || 1.0) >= 2.0).length;

  const handleHeaderSort = (key: 'RVOL' | 'SCORE' | 'CHANGE' | 'CVD' | 'VOLUME' | 'SYMBOL') => {
    if (sortBy === key) {
      setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC');
    } else {
      setSortBy(key);
      setSortOrder(key === 'SYMBOL' ? 'ASC' : 'DESC');
    }
  };

  const formatVol = (num?: number) => {
    if (!num) return '0';
    const abs = Math.abs(num);
    if (abs >= 10000000) return `${(num / 10000000).toFixed(2)}Cr`;
    if (abs >= 100000) return `${(num / 100000).toFixed(2)}L`;
    if (abs >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (abs >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      
      {/* HEADER BANNER & HIGHLIGHT CARDS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <div className="bg-amber-500/15 p-2 rounded-xl border border-amber-500/30 text-amber-400">
                <Zap className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-100 font-mono tracking-tight flex items-center gap-2">
                  <span>UNUSUAL VOLUME & MOMENTUM RADAR</span>
                  <span className="bg-amber-500/20 text-amber-300 text-xs px-2.5 py-0.5 rounded-full border border-amber-500/30 font-sans font-bold">
                    PRO DETECTOR
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detect extreme institutional volume spikes paired with stock price momentum & absorption squeeze setups.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {setUniverse && (
              <UniverseSelector
                universe={universe}
                setUniverse={setUniverse}
                variant="dropdown"
              />
            )}

            <button
              onClick={fetchScanData}
              disabled={loading}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Scanning...' : 'Refresh Radar'}</span>
            </button>
          </div>
        </div>

        {/* SUMMARY METRIC TILES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center justify-between">
              <span>Unusual Vol Stocks</span>
              <Activity className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-400 font-mono mt-1">
              {totalUnusual} <span className="text-xs font-normal text-slate-500">(&gt;1.2x RVOL)</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center justify-between">
              <span>Bullish Momentum</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-1">
              {bullishCount} <span className="text-xs font-normal text-slate-500">Surge Leaders</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center justify-between">
              <span>Bearish Selloff</span>
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl font-black text-rose-400 font-mono mt-1">
              {bearishCount} <span className="text-xs font-normal text-slate-500">Panic Dumps</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center justify-between">
              <span>Vol Absorption Squeeze</span>
              <Flame className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl font-black text-indigo-400 font-mono mt-1">
              {squeezeCount} <span className="text-xs font-normal text-slate-500">Smart Accumulation</span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & CONTROLS BAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3">
        
        {/* Category Pill Switchers */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeCategory === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              ALL UNUSUAL VOL ({processedStocks.length})
            </button>

            <button
              onClick={() => setActiveCategory('BULLISH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeCategory === 'BULLISH'
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-950 border border-slate-800 text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>🚀 BULLISH MOMENTUM ({bullishCount})</span>
            </button>

            <button
              onClick={() => setActiveCategory('BEARISH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeCategory === 'BEARISH'
                  ? 'bg-rose-500 text-slate-950 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                  : 'bg-slate-950 border border-slate-800 text-rose-400 hover:bg-rose-500/10'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>🩸 BEARISH DUMP ({bearishCount})</span>
            </button>

            <button
              onClick={() => setActiveCategory('SQUEEZE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeCategory === 'SQUEEZE'
                  ? 'bg-indigo-500 text-slate-100 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                  : 'bg-slate-950 border border-slate-800 text-indigo-400 hover:bg-indigo-500/10'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>⚡ VOL SQUEEZE ({squeezeCount})</span>
            </button>

            <button
              onClick={() => setActiveCategory('EXTREME_RVOL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeCategory === 'EXTREME_RVOL'
                  ? 'bg-orange-500 text-slate-950 shadow-[0_0_12px_rgba(249,115,22,0.3)]'
                  : 'bg-slate-950 border border-slate-800 text-orange-400 hover:bg-orange-500/10'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>🔥 EXTREME RVOL &gt;2.0x ({extremeRvolCount})</span>
            </button>
          </div>

          {/* Table / Cards View Mode Switcher */}
          <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'TABLE' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              TABLE
            </button>
            <button
              onClick={() => setViewMode('CARDS')}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'CARDS' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              CARDS
            </button>
          </div>
        </div>

        {/* Search & RVOL Slider Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search ticker or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-amber-500/60 font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center space-x-2">
              <label className="text-xs font-mono text-slate-400 whitespace-nowrap">Min RVOL:</label>
              <select
                value={minRvol}
                onChange={(e) => setMinRvol(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 text-amber-400 text-xs font-mono font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
              >
                <option value={1.0}>1.0x (Normal)</option>
                <option value={1.2}>1.2x (Unusual)</option>
                <option value={1.5}>1.5x (High Surge)</option>
                <option value={2.0}>2.0x (Extreme Spike)</option>
                <option value={3.0}>3.0x (Institutional Climax)</option>
              </select>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Showing <span className="text-amber-400 font-bold">{filteredStocks.length}</span> of {processedStocks.length} stocks
            </div>
          </div>
        </div>
      </div>

      {/* RESULTS DISPLAY: TABLE OR CARDS */}
      {loading ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-slate-300 font-mono text-sm font-semibold">
            Analyzing 10-Day Volume Averages & Intraday Price Acceleration...
          </p>
          <p className="text-slate-500 text-xs">
            Fetching Yahoo Finance feeds for {universe} universe.
          </p>
        </div>
      ) : error ? (
        <div className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-6 text-center space-y-2">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-rose-300 font-mono text-sm font-bold">{error}</p>
          <button
            onClick={fetchScanData}
            className="mt-2 bg-rose-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl"
          >
            Retry Scan
          </button>
        </div>
      ) : filteredStocks.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Compass className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-slate-300 font-mono text-sm font-bold">No stocks match the selected RVOL / momentum filter.</p>
          <p className="text-slate-500 text-xs">Try reducing the Min RVOL threshold or searching for another ticker.</p>
        </div>
      ) : viewMode === 'TABLE' ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono font-extrabold text-slate-400 uppercase tracking-wider">
                  <th 
                    onClick={() => handleHeaderSort('SYMBOL')} 
                    className="p-3.5 cursor-pointer hover:text-slate-100 transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Stock / Symbol</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>

                  <th 
                    onClick={() => handleHeaderSort('CHANGE')} 
                    className="p-3.5 cursor-pointer hover:text-slate-100 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>LTP / Change</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>

                  <th 
                    onClick={() => handleHeaderSort('RVOL')} 
                    className="p-3.5 cursor-pointer hover:text-slate-100 transition-colors text-center"
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Unusual RVOL</span>
                      <ArrowUpDown className="w-3 h-3 text-amber-400" />
                    </div>
                  </th>

                  <th className="p-3.5 text-center">Momentum Category</th>

                  <th 
                    onClick={() => handleHeaderSort('SCORE')} 
                    className="p-3.5 cursor-pointer hover:text-slate-100 transition-colors text-center"
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Vol-Mom Score</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>

                  <th 
                    onClick={() => handleHeaderSort('CVD')} 
                    className="p-3.5 cursor-pointer hover:text-slate-100 transition-colors text-center"
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>CVD Flow</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>

                  <th 
                    onClick={() => handleHeaderSort('VOLUME')} 
                    className="p-3.5 cursor-pointer hover:text-slate-100 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Vol / 10d Avg</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>

                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {filteredStocks.map((stock) => {
                  const rvol = stock.rvol || 1.0;
                  const priceChange = stock.priceChangePct || 0;
                  const isBullish = priceChange >= 0;

                  return (
                    <tr 
                      key={stock.symbol}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => onOpenChartModal ? onOpenChartModal(stock.symbol) : onSelectSymbolForChart(stock.symbol)}
                    >
                      {/* SYMBOL */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-100 text-sm group-hover:text-amber-400 transition-colors flex items-center gap-2">
                          <span>{stock.symbol}</span>
                          {stock.status === 'BUY_SIGNAL' && (
                            <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.2 rounded border border-emerald-500/30">
                              BUY
                            </span>
                          )}
                          {stock.status === 'SELL_SIGNAL' && (
                            <span className="bg-rose-500/20 text-rose-400 text-[9px] px-1.5 py-0.2 rounded border border-rose-500/30">
                              SELL
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {stock.pdRangeText || 'NIFTY F&O'}
                        </div>
                      </td>

                      {/* LTP & CHANGE */}
                      <td className="p-3.5 text-right">
                        <div className="font-extrabold text-slate-100">
                          ₹{stock.latestPrice?.toLocaleString('en-IN') || '—'}
                        </div>
                        <div className={`font-bold text-xs flex items-center justify-end gap-1 ${
                          isBullish ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isBullish ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span>{isBullish ? '+' : ''}{priceChange.toFixed(2)}%</span>
                        </div>
                      </td>

                      {/* UNUSUAL RVOL MULTIPLIER */}
                      <td className="p-3.5 text-center">
                        <div className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl font-black text-xs border shadow-sm ${
                          rvol >= 2.5
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)] animate-pulse'
                            : rvol >= 1.5
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          <Zap className="w-3.5 h-3.5" />
                          <span>{rvol.toFixed(2)}x</span>
                        </div>
                      </td>

                      {/* MOMENTUM CATEGORY TAG */}
                      <td className="p-3.5 text-center">
                        {stock.momentumState === 'BULLISH_SURGE' && (
                          <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-xl text-[11px] font-bold inline-flex items-center gap-1">
                            🚀 Bullish Surge
                          </span>
                        )}
                        {stock.momentumState === 'BEARISH_DUMP' && (
                          <span className="bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-xl text-[11px] font-bold inline-flex items-center gap-1">
                            🩸 Bearish Dump
                          </span>
                        )}
                        {stock.momentumState === 'VOLUME_SQUEEZE' && (
                          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-1 rounded-xl text-[11px] font-bold inline-flex items-center gap-1">
                            ⚡ Vol Squeeze
                          </span>
                        )}
                        {stock.momentumState === 'REVERSAL_BOUNCE' && (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-xl text-[11px] font-bold inline-flex items-center gap-1">
                            🔄 Reversal Bounce
                          </span>
                        )}
                        {stock.momentumState === 'NEUTRAL_ACCUMULATION' && (
                          <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-1 rounded-xl text-[11px]">
                            Steady Volume
                          </span>
                        )}
                      </td>

                      {/* SCORE */}
                      <td className="p-3.5 text-center">
                        <div className="flex flex-col items-center">
                          <div className="font-black text-xs text-amber-400">
                            {stock.momentumScore}/100
                          </div>
                          <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                            <div 
                              className={`h-full rounded-full ${
                                stock.momentumScore >= 75 ? 'bg-amber-400' :
                                stock.momentumScore >= 50 ? 'bg-emerald-400' : 'bg-slate-600'
                              }`} 
                              style={{ width: `${stock.momentumScore}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* CVD FLOW */}
                      <td className="p-3.5 text-center">
                        <div className={`font-bold ${
                          (stock.cvd || 0) > 0 ? 'text-emerald-400' : (stock.cvd || 0) < 0 ? 'text-rose-400' : 'text-slate-400'
                        }`}>
                          {(stock.cvd || 0) > 0 ? '+' : ''}{formatVol(stock.cvd)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {stock.cvdRatio !== undefined ? `${(stock.cvdRatio * 100).toFixed(0)}% Delta` : ''}
                        </div>
                      </td>

                      {/* VOLUME VS AVG */}
                      <td className="p-3.5 text-right">
                        <div className="font-extrabold text-slate-200">
                          {formatVol(stock.volume)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Avg: {formatVol(stock.avgVolume10d)}
                        </div>
                      </td>

                      {/* ACTION BUTTON */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenChartModal) onOpenChartModal(stock.symbol);
                            else onSelectSymbolForChart(stock.symbol);
                          }}
                          className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 mx-auto transition-all cursor-pointer hover:scale-105 active:scale-95"
                          title="Open Chart Popup"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chart</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStocks.map((stock) => {
            const rvol = stock.rvol || 1.0;
            const priceChange = stock.priceChangePct || 0;
            const isBullish = priceChange >= 0;

            return (
              <div
                key={stock.symbol}
                onClick={() => onOpenChartModal ? onOpenChartModal(stock.symbol) : onSelectSymbolForChart(stock.symbol)}
                className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 transition-all hover:scale-[1.01] cursor-pointer shadow-xl relative overflow-hidden group space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-100 text-base font-mono group-hover:text-amber-400 transition-colors flex items-center gap-2">
                      <span>{stock.symbol}</span>
                      {stock.status === 'BUY_SIGNAL' && (
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/30">
                          BUY
                        </span>
                      )}
                      {stock.status === 'SELL_SIGNAL' && (
                        <span className="bg-rose-500/20 text-rose-400 text-[10px] px-2 py-0.5 rounded border border-rose-500/30">
                          SELL
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {stock.pdRangeText || 'NIFTY F&O'}
                    </p>
                  </div>

                  <div className={`px-2.5 py-1 rounded-xl font-black text-xs border flex items-center space-x-1 ${
                    rvol >= 2.0
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    <Zap className="w-3.5 h-3.5" />
                    <span>{rvol.toFixed(2)}x RVOL</span>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800 font-mono">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">LTP</div>
                    <div className="text-base font-black text-slate-100">₹{stock.latestPrice?.toLocaleString('en-IN') || '—'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase">Today's Move</div>
                    <div className={`text-sm font-black flex items-center justify-end gap-1 ${
                      isBullish ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isBullish ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <span>{isBullish ? '+' : ''}{priceChange.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Momentum State:</span>
                    <span className="font-bold text-slate-200">{stock.momentumState.replace('_', ' ')}</span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Vol-Mom Score:</span>
                    <span className="font-bold text-amber-400">{stock.momentumScore}/100</span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Cumulative Vol Delta:</span>
                    <span className={`font-bold ${
                      (stock.cvd || 0) > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {formatVol(stock.cvd)}
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs font-mono" onClick={(e) => e.stopPropagation()}>
                  <span className="text-slate-500 font-bold">Vol: {formatVol(stock.volume)}</span>
                  <button
                    onClick={() => onOpenChartModal ? onOpenChartModal(stock.symbol) : onSelectSymbolForChart(stock.symbol)}
                    className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Chart</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FOOTER METRIC EXPLANATION PANEL */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-400 space-y-2">
        <div className="flex items-center space-x-2 text-amber-400 font-bold">
          <Info className="w-4 h-4" />
          <span>How Unusual Volume & Stock Momentum works:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-400 leading-relaxed pl-1">
          <li>
            <strong className="text-slate-200">Unusual RVOL (Relative Volume):</strong> Compares today's volume against the 10-day average. RVOL &gt; 1.5x signals institutional participation.
          </li>
          <li>
            <strong className="text-slate-200">🚀 Bullish Surge:</strong> Heavy volume paired with strong positive price expansion (+0.8%+).
          </li>
          <li>
            <strong className="text-slate-200">⚡ Volume Squeeze / Absorption:</strong> High RVOL (&gt;1.8x) with tight price range (&lt;0.6%), signaling smart money accumulation before a breakout.
          </li>
          <li>
            <strong className="text-slate-200">CVD (Cumulative Volume Delta):</strong> Measures net aggressive buy volume vs sell volume inside the candles.
          </li>
        </ul>
      </div>

    </div>
  );
};
