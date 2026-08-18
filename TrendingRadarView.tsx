import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TrendingStockItem, Candle, StockScanStatus, UniverseType } from '../types';
import { analyze5mTrendingRadar } from '../utils/trendingRadarEngine';
import { UniverseSelector } from './UniverseSelector';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Flame,
  Zap,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ExternalLink,
  BarChart2,
  Layers,
  ArrowUpDown,
  Compass,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Filter,
  Eye
} from 'lucide-react';

interface TrendingRadarViewProps {
  timeframe?: '5m' | '15m';
  setTimeframe?: (tf: '5m' | '15m') => void;
  universe: UniverseType;
  setUniverse?: (u: UniverseType) => void;
  onSelectSymbolForChart: (symbol: string) => void;
  onOpenChartModal?: (symbol: string) => void;
  initialFilter?: string;
}

const safeToFixed = (val: number | undefined | null, digits = 2, fallback = '--'): string => {
  if (val === undefined || val === null || isNaN(Number(val))) return fallback;
  return Number(val).toFixed(digits);
};

export const TrendingRadarView: React.FC<TrendingRadarViewProps> = ({
  universe,
  setUniverse,
  onSelectSymbolForChart,
  onOpenChartModal,
  initialFilter = 'ALL'
}) => {
  const [trendingStocks, setTrendingStocks] = useState<TrendingStockItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>(initialFilter);
  const [sortBy, setSortBy] = useState<'DEFAULT' | 'SCORE' | 'SYMBOL' | 'PRICE' | 'CHANGE' | 'RVOL' | 'STAGE'>('DEFAULT');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');
  const [customTickerInput, setCustomTickerInput] = useState<string>('RELIANCE.NS, TCS.NS, INFY.NS, TMPV.NS');

  const fetchAndComputeTrendingRadar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch current Radar stocks from the primary scan API on 5m timeframe
      const scanRes = await fetch('/api/stock-scanner-data?universe=' + universe + '&interval=5m');
      
      let rawItems: any[] = [];
      if (scanRes.ok) {
        const data = await scanRes.json();
        rawItems = data.items || [];
      }

      // Fallback to /api/scan if stock-scanner-data is empty or failed
      if (rawItems.length === 0) {
        const fallbackRes = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timeframe: '5m' })
        });
        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          rawItems = (fbData.results || []).map((r: StockScanStatus) => ({
            symbol: r.symbol,
            name: r.name || r.symbol.replace('.NS', ''),
            latestPrice: r.latestPrice,
            todaysOpen: r.todaysOpen,
            priceChangePct: r.priceChangePct,
            rvol: r.rvol || 1.0,
            intradayCandles: [] // Will fetch or compute
          }));
        }
      }

      // 2. Compute 5-minute trending radar indicators for each stock
      const computedList: TrendingStockItem[] = [];

      for (const item of rawItems) {
        try {
          const sym = item.symbol;
          const name = item.name || sym.replace('.NS', '');
          const intradayCandles: Candle[] = item.intradayCandles || [];

          // If candles are already attached, analyze directly
          if (intradayCandles.length >= 5) {
            const analyzed = analyze5mTrendingRadar(
              sym,
              name,
              intradayCandles,
              item.latestPrice,
              item.todaysOpen,
              item.rvol
            );
            computedList.push(analyzed);
          } else {
            // Fetch individual 5m stock data if needed
            const itemRes = await fetch(`/api/stock-data?symbol=${encodeURIComponent(sym)}&interval=5m`);
            if (itemRes.ok) {
              const itemData = await itemRes.json();
              const candles5m = itemData.intradayCandles || [];
              const analyzed = analyze5mTrendingRadar(
                sym,
                name,
                candles5m,
                item.latestPrice,
                item.todaysOpen,
                item.rvol
              );
              computedList.push(analyzed);
            } else {
              // Fallback with available item metrics
              const analyzed = analyze5mTrendingRadar(
                sym,
                name,
                [],
                item.latestPrice,
                item.todaysOpen,
                item.rvol
              );
              computedList.push(analyzed);
            }
          }
        } catch {
          // Guard each individual stock parsing failure
        }
      }

      setTrendingStocks(computedList);
      setLastRefreshedAt(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err?.message || 'Failed to load 5-minute trending radar data');
    } finally {
      setLoading(false);
    }
  }, [universe]);

  useEffect(() => {
    fetchAndComputeTrendingRadar();
    const intervalId = setInterval(() => {
      fetchAndComputeTrendingRadar();
    }, 60000); // 60 seconds refresh
    return () => clearInterval(intervalId);
  }, [fetchAndComputeTrendingRadar]);

  // Handle header sorting click
  const handleSortClick = (key: typeof sortBy) => {
    if (sortBy === key) {
      setSortOrder(prev => (prev === 'DESC' ? 'ASC' : 'DESC'));
    } else {
      setSortBy(key);
      setSortOrder(key === 'SYMBOL' ? 'ASC' : 'DESC');
    }
  };

  // Filter and Sort Processing
  const processedStocks = useMemo(() => {
    let list = [...trendingStocks];

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        s => (s.symbol && s.symbol.toLowerCase().includes(q)) || (s.name && s.name.toLowerCase().includes(q))
      );
    }

    // 2. Category Filter
    if (activeFilter === 'STRONG_BULLISH') {
      list = list.filter(s => s.classification === 'STRONG_BULLISH');
    } else if (activeFilter === 'BULLISH') {
      list = list.filter(s => s.direction === 'UP' && (s.classification === 'BULLISH' || s.classification === 'STRONG_BULLISH'));
    } else if (activeFilter === 'NEW_BULLISH') {
      list = list.filter(s => s.direction === 'UP' && s.stage === 'NEW');
    } else if (activeFilter === 'NEW_BEARISH') {
      list = list.filter(s => s.direction === 'DOWN' && s.stage === 'NEW');
    } else if (activeFilter === 'NEW') {
      list = list.filter(s => s.stage === 'NEW');
    } else if (activeFilter === 'RUNNING') {
      list = list.filter(s => s.stage === 'RUNNING');
    } else if (activeFilter === 'WEAKENING') {
      list = list.filter(s => s.stage === 'WEAKENING');
    } else if (activeFilter === 'CHOPPY') {
      list = list.filter(s => s.stage === 'CHOPPY' || s.classification === 'NEUTRAL_CHOPPY');
    } else if (activeFilter === 'BEARISH') {
      list = list.filter(s => s.direction === 'DOWN' && (s.classification === 'BEARISH' || s.classification === 'STRONG_BEARISH'));
    } else if (activeFilter === 'STRONG_BEARISH') {
      list = list.filter(s => s.classification === 'STRONG_BEARISH');
    }

    // 3. Sorting
    list.sort((a, b) => {
      if (sortBy === 'DEFAULT') {
        // Primary: Sort by Rank (1: New Strong -> 2: Strong -> 3: Running -> 4: Weakening -> 5: Choppy)
        if (a.sortRank !== b.sortRank) {
          return a.sortRank - b.sortRank;
        }
        // Secondary: Trend Score Descending
        if (b.trendScore !== a.trendScore) {
          return b.trendScore - a.trendScore;
        }
        // Tertiary: Price Change % magnitude
        return Math.abs(b.priceChangePct || 0) - Math.abs(a.priceChangePct || 0);
      }

      if (sortBy === 'SCORE') {
        return sortOrder === 'DESC' ? (b.trendScore || 0) - (a.trendScore || 0) : (a.trendScore || 0) - (b.trendScore || 0);
      }
      if (sortBy === 'SYMBOL') {
        return sortOrder === 'ASC' ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
      }
      if (sortBy === 'PRICE') {
        return sortOrder === 'DESC' ? (b.price || 0) - (a.price || 0) : (a.price || 0) - (b.price || 0);
      }
      if (sortBy === 'CHANGE') {
        return sortOrder === 'DESC' ? (b.priceChangePct || 0) - (a.priceChangePct || 0) : (a.priceChangePct || 0) - (b.priceChangePct || 0);
      }
      if (sortBy === 'RVOL') {
        return sortOrder === 'DESC' ? (b.rvol || 0) - (a.rvol || 0) : (a.rvol || 0) - (b.rvol || 0);
      }
      if (sortBy === 'STAGE') {
        return sortOrder === 'DESC' ? a.sortRank - b.sortRank : b.sortRank - a.sortRank;
      }
      return 0;
    });

    return list;
  }, [trendingStocks, searchQuery, activeFilter, sortBy, sortOrder]);

  // Metrics summary counts
  const summaryCounts = useMemo(() => {
    const total = trendingStocks.length;
    const newBullish = trendingStocks.filter(s => s.direction === 'UP' && s.stage === 'NEW').length;
    const newBearish = trendingStocks.filter(s => s.direction === 'DOWN' && s.stage === 'NEW').length;
    const strongBull = trendingStocks.filter(s => s.classification === 'STRONG_BULLISH').length;
    const strongBear = trendingStocks.filter(s => s.classification === 'STRONG_BEARISH').length;
    const running = trendingStocks.filter(s => s.stage === 'RUNNING').length;
    const weakening = trendingStocks.filter(s => s.stage === 'WEAKENING').length;
    const choppy = trendingStocks.filter(s => s.stage === 'CHOPPY' || s.classification === 'NEUTRAL_CHOPPY').length;
    return { total, newBullish, newBearish, strongBull, strongBear, running, weakening, choppy };
  }, [trendingStocks]);

  const openExternalTradingView = (symbol: string) => {
    const cleanSym = symbol.replace('.NS', '').replace('.BO', '');
    const tvSymbol = symbol.endsWith('.NS') ? `NSE:${cleanSym}` : cleanSym;
    window.open(`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight font-mono">
                    ADVANCED TRENDING RADAR
                  </h2>
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> 5-MIN TIMEFRAME
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Institutional 5M market structure swing detection, 8/21 EMA dynamic alignment & slope, volume surge, and breakout tracking.
                </p>
              </div>
            </div>
          </div>

          {/* Universe Selector & Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {setUniverse && (
              <UniverseSelector
                universe={universe}
                setUniverse={setUniverse}
                variant="dropdown"
              />
            )}

            <button
              onClick={fetchAndComputeTrendingRadar}
              disabled={loading}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-mono font-bold border border-slate-700 transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Analyzing...' : 'Refresh 5M'}</span>
            </button>

            {lastRefreshedAt && (
              <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                <span>Updated:</span>
                <span className="text-slate-300">{lastRefreshedAt}</span>
              </div>
            )}
          </div>
        </div>

        {/* SUMMARY KPI CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          <div
            onClick={() => setActiveFilter('NEW_BULLISH')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeFilter === 'NEW_BULLISH'
                ? 'bg-emerald-500/20 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-emerald-500/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>⚡ New Bullish</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
              {summaryCounts.newBullish}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Fresh 8/21 breakout</div>
          </div>

          <div
            onClick={() => setActiveFilter('NEW_BEARISH')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeFilter === 'NEW_BEARISH'
                ? 'bg-rose-500/20 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-rose-500/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>⚡ New Bearish</span>
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            </div>
            <div className="text-2xl font-black text-rose-400 font-mono mt-1">
              {summaryCounts.newBearish}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Fresh 8/21 breakdown</div>
          </div>

          <div
            onClick={() => setActiveFilter('STRONG_BULLISH')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeFilter === 'STRONG_BULLISH'
                ? 'bg-emerald-500/20 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-emerald-500/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>🔥 Strong Bull</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
              {summaryCounts.strongBull}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Score ≥ 6/7</div>
          </div>

          <div
            onClick={() => setActiveFilter('STRONG_BEARISH')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeFilter === 'STRONG_BEARISH'
                ? 'bg-rose-500/20 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-rose-500/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>🔥 Strong Bear</span>
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400 font-mono mt-1">
              {summaryCounts.strongBear}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Score ≥ 6/7</div>
          </div>

          <div
            onClick={() => setActiveFilter('RUNNING')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeFilter === 'RUNNING'
                ? 'bg-cyan-500/20 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-cyan-500/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>🔥 Running</span>
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-cyan-400 font-mono mt-1">
              {summaryCounts.running}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Established trend</div>
          </div>

          <div
            onClick={() => setActiveFilter('WEAKENING')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeFilter === 'WEAKENING'
                ? 'bg-amber-500/20 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-amber-500/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>⚠️ Weakening</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">
              {summaryCounts.weakening}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Losing EMA 8</div>
          </div>
        </div>
      </div>

      {/* FILTER BUTTONS & SEARCH BAR */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-slate-100 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              ALL ({trendingStocks.length})
            </button>

            <button
              onClick={() => setActiveFilter('NEW_BULLISH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                activeFilter === 'NEW_BULLISH'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                  : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60 hover:bg-emerald-900/50'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>⚡ NEW BULLISH</span>
            </button>

            <button
              onClick={() => setActiveFilter('NEW_BEARISH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                activeFilter === 'NEW_BEARISH'
                  ? 'bg-rose-500 text-slate-950 border-rose-400 shadow-md'
                  : 'bg-rose-950/40 text-rose-400 border-rose-800/60 hover:bg-rose-900/50'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>⚡ NEW BEARISH</span>
            </button>

            <button
              onClick={() => setActiveFilter('STRONG_BULLISH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeFilter === 'STRONG_BULLISH'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-950 text-emerald-400 hover:text-emerald-300 border border-slate-800'
              }`}
            >
              🔥 STRONG BULLISH
            </button>

            <button
              onClick={() => setActiveFilter('BULLISH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeFilter === 'BULLISH'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'bg-slate-950 text-emerald-500 hover:text-emerald-400 border border-slate-800'
              }`}
            >
              🟢 BULLISH
            </button>

            <button
              onClick={() => setActiveFilter('RUNNING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeFilter === 'RUNNING'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-slate-950 text-cyan-400 hover:text-cyan-300 border border-slate-800'
              }`}
            >
              🔥 RUNNING
            </button>

            <button
              onClick={() => setActiveFilter('WEAKENING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeFilter === 'WEAKENING'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-950 text-amber-400 hover:text-amber-300 border border-slate-800'
              }`}
            >
              ⚠️ WEAKENING
            </button>

            <button
              onClick={() => setActiveFilter('CHOPPY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeFilter === 'CHOPPY'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-300 border border-slate-800'
              }`}
            >
              ⚪ CHOPPY
            </button>

            <button
              onClick={() => setActiveFilter('BEARISH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeFilter === 'BEARISH'
                  ? 'bg-rose-700 text-white shadow-md'
                  : 'bg-slate-950 text-rose-500 hover:text-rose-400 border border-slate-800'
              }`}
            >
              🔴 BEARISH
            </button>

            <button
              onClick={() => setActiveFilter('STRONG_BEARISH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeFilter === 'STRONG_BEARISH'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-950 text-rose-400 hover:text-rose-300 border border-slate-800'
              }`}
            >
              🔥 STRONG BEARISH
            </button>
          </div>

          {/* Search Input & Reset Sort */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search symbol (e.g. RELIANCE)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {sortBy !== 'DEFAULT' && (
              <button
                onClick={() => setSortBy('DEFAULT')}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-mono rounded-xl border border-slate-700 transition-all cursor-pointer"
                title="Reset to Prioritized Trend Ranking (New Strong Trend -> Strong Trend -> Running -> Weakening -> Choppy)"
              >
                Reset Sort
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="bg-rose-950/50 border border-rose-800 text-rose-300 p-4 rounded-xl flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchAndComputeTrendingRadar}
            className="px-3 py-1 bg-rose-900/60 hover:bg-rose-800 rounded-lg text-rose-200 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* TRENDING RADAR DATA TABLE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-200 font-mono tracking-wider">
              5-MINUTE INTRADAY TREND CLASSIFICATION MATRIX ({processedStocks.length})
            </h3>
          </div>
          <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <span>Sorting Priority:</span>
            <span className="text-emerald-400 font-bold">
              {sortBy === 'DEFAULT' ? '1. New Strong → 2. Strong → 3. Running → 4. Weakening → 5. Choppy' : `${sortBy} (${sortOrder})`}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 select-none">
                <th
                  onClick={() => handleSortClick('SYMBOL')}
                  className="py-3 px-4 font-bold tracking-wider cursor-pointer hover:text-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>STOCK</span>
                    {sortBy === 'SYMBOL' && <span className="text-emerald-400 font-extrabold">{sortOrder === 'ASC' ? '▲' : '▼'}</span>}
                  </div>
                </th>

                <th className="py-3 px-3 font-bold tracking-wider">
                  DIRECTION
                </th>

                <th
                  onClick={() => handleSortClick('SCORE')}
                  className="py-3 px-3 font-bold tracking-wider cursor-pointer hover:text-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>TREND SCORE</span>
                    {sortBy === 'SCORE' && <span className="text-emerald-400 font-extrabold">{sortOrder === 'ASC' ? '▲' : '▼'}</span>}
                  </div>
                </th>

                <th className="py-3 px-3 font-bold tracking-wider">
                  STRUCTURE
                </th>

                <th className="py-3 px-3 font-bold tracking-wider">
                  EMA ALIGNMENT
                </th>

                <th className="py-3 px-3 font-bold tracking-wider">
                  EMA SLOPE
                </th>

                <th
                  onClick={() => handleSortClick('RVOL')}
                  className="py-3 px-3 font-bold tracking-wider cursor-pointer hover:text-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>VOLUME</span>
                    {sortBy === 'RVOL' && <span className="text-emerald-400 font-extrabold">{sortOrder === 'ASC' ? '▲' : '▼'}</span>}
                  </div>
                </th>

                <th className="py-3 px-3 font-bold tracking-wider">
                  BREAKOUT
                </th>

                <th
                  onClick={() => handleSortClick('STAGE')}
                  className="py-3 px-3 font-bold tracking-wider cursor-pointer hover:text-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>TREND STAGE</span>
                    {sortBy === 'STAGE' && <span className="text-emerald-400 font-extrabold">{sortOrder === 'ASC' ? '▲' : '▼'}</span>}
                  </div>
                </th>

                <th
                  onClick={() => handleSortClick('PRICE')}
                  className="py-3 px-3 font-bold tracking-wider cursor-pointer hover:text-slate-100 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>LTP (₹)</span>
                    {sortBy === 'PRICE' && <span className="text-emerald-400 font-extrabold">{sortOrder === 'ASC' ? '▲' : '▼'}</span>}
                  </div>
                </th>

                <th className="py-3 px-3 font-bold tracking-wider text-right">
                  EMA 8
                </th>

                <th className="py-3 px-3 font-bold tracking-wider text-right">
                  EMA 21
                </th>

                <th className="py-3 px-4 font-bold tracking-wider text-center">
                  ACTIONS
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/50">
              {loading && processedStocks.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                      <span className="text-sm font-semibold">Analyzing 5-Minute Market Structure, EMAs & Trends...</span>
                    </div>
                  </td>
                </tr>
              ) : processedStocks.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Search className="w-6 h-6 text-slate-600" />
                      <span>No stocks match the selected trend criteria or search filter.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                processedStocks.map((stock) => {
                  const isUp = stock.direction === 'UP';
                  const isDown = stock.direction === 'DOWN';
                  const isChoppy = stock.direction === 'CHOPPY';

                  return (
                    <tr
                      key={stock.symbol}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Stock Symbol & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <button
                            onClick={() => onOpenChartModal ? onOpenChartModal(stock.symbol) : onSelectSymbolForChart(stock.symbol)}
                            className="font-black text-slate-100 hover:text-emerald-400 transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{stock.symbol.replace('.NS', '')}</span>
                            {stock.stage === 'NEW' && (
                              <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1 py-0.2 rounded font-bold border border-amber-500/40">
                                ⚡ NEW
                              </span>
                            )}
                          </button>
                          <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                            {stock.name || stock.symbol}
                          </span>
                        </div>
                      </td>

                      {/* Direction */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {isUp && (
                          <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1 w-fit">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            <span>🟢 UP</span>
                          </span>
                        )}
                        {isDown && (
                          <span className="bg-rose-500/20 text-rose-300 font-bold px-2.5 py-1 rounded-lg border border-rose-500/30 flex items-center gap-1 w-fit">
                            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                            <span>🔴 DOWN</span>
                          </span>
                        )}
                        {isChoppy && (
                          <span className="bg-slate-800 text-slate-400 font-bold px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1 w-fit">
                            <span>⚪ CHOPPY</span>
                          </span>
                        )}
                      </td>

                      {/* Trend Score */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`px-2.5 py-0.5 rounded-md font-black text-xs border ${
                              stock.trendScore >= 6
                                ? isUp
                                  ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50'
                                  : 'bg-rose-500/30 text-rose-300 border-rose-500/50'
                                : stock.trendScore >= 4
                                ? isUp
                                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                                  : 'bg-rose-950/60 text-rose-400 border-rose-800/40'
                                : 'bg-slate-950 text-slate-400 border-slate-800'
                            }`}
                          >
                            {stock.scoreDisplay}
                          </div>

                          {/* Mini Progress Bar */}
                          <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className={`h-full rounded-full ${
                                stock.trendScore >= 6
                                  ? isUp ? 'bg-emerald-400' : 'bg-rose-400'
                                  : stock.trendScore >= 4
                                  ? isUp ? 'bg-emerald-500' : 'bg-rose-500'
                                  : 'bg-slate-600'
                              }`}
                              style={{ width: `${(stock.trendScore / 7) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Structure */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {stock.structure === 'HH_HL' ? (
                          <span className="text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded">
                            HH + HL
                          </span>
                        ) : stock.structure === 'LH_LL' ? (
                          <span className="text-rose-400 font-bold bg-rose-950/40 border border-rose-800/50 px-2 py-0.5 rounded">
                            LH + LL
                          </span>
                        ) : (
                          <span className="text-slate-500 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                            MIXED
                          </span>
                        )}
                      </td>

                      {/* EMA Alignment */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {stock.emaAlignment === 'BULLISH_8_21' ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <span>8 &gt; 21</span>
                          </span>
                        ) : stock.emaAlignment === 'BEARISH_8_21' ? (
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            <span>8 &lt; 21</span>
                          </span>
                        ) : (
                          <span className="text-slate-500">MIXED</span>
                        )}
                      </td>

                      {/* EMA Slope */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {stock.emaSlope === 'RISING' ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <span>↑ Rising</span>
                          </span>
                        ) : stock.emaSlope === 'FALLING' ? (
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            <span>↓ Falling</span>
                          </span>
                        ) : (
                          <span className="text-slate-500">→ Flat</span>
                        )}
                      </td>

                      {/* Volume */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {stock.volumeStatus === 'HIGH' ? (
                          <span className="bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1 w-fit">
                            <span>🔥 High</span>
                            <span className="text-[10px] text-amber-400/80">({safeToFixed(stock.rvol, 1)}x)</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">Normal</span>
                        )}
                      </td>

                      {/* Breakout */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {stock.breakout === 'BREAKOUT' ? (
                          <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30 animate-pulse">
                            🚀 Breakout
                          </span>
                        ) : stock.breakout === 'BREAKDOWN' ? (
                          <span className="bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded border border-rose-500/30 animate-pulse">
                            Breakdown
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Trend Stage */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {stock.stage === 'NEW' && (
                          <span className="bg-amber-500/20 text-amber-300 font-bold px-2.5 py-1 rounded-lg border border-amber-500/40 flex items-center gap-1 w-fit shadow-[0_0_10px_rgba(245,158,11,0.15)]">
                            <span>🆕 NEW</span>
                          </span>
                        )}
                        {stock.stage === 'RUNNING' && (
                          <span className="bg-cyan-500/20 text-cyan-300 font-bold px-2.5 py-1 rounded-lg border border-cyan-500/40 flex items-center gap-1 w-fit">
                            <span>🔥 RUNNING</span>
                          </span>
                        )}
                        {stock.stage === 'WEAKENING' && (
                          <span className="bg-amber-500/15 text-amber-400 font-bold px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1 w-fit">
                            <span>⚠️ WEAKENING</span>
                          </span>
                        )}
                        {stock.stage === 'CHOPPY' && (
                          <span className="bg-slate-950 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1 w-fit">
                            <span>⚪ CHOPPY</span>
                          </span>
                        )}
                      </td>

                      {/* LTP */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-right">
                        <div className="font-bold text-slate-100">
                          ₹{safeToFixed(stock.price, 2)}
                        </div>
                        <div
                          className={`text-[10px] ${
                            (stock.priceChangePct || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {(stock.priceChangePct || 0) >= 0 ? '+' : ''}
                          {safeToFixed(stock.priceChangePct, 2)}%
                        </div>
                      </td>

                      {/* EMA 8 */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-right text-slate-300">
                        ₹{safeToFixed(stock.ema8, 2)}
                      </td>

                      {/* EMA 21 */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-right text-slate-400">
                        ₹{safeToFixed(stock.ema21, 2)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => onOpenChartModal ? onOpenChartModal(stock.symbol) : onSelectSymbolForChart(stock.symbol)}
                            className="p-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
                            title="Open In-App Chart"
                          >
                            <BarChart2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openExternalTradingView(stock.symbol)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 rounded-lg transition-all cursor-pointer"
                            title="Open TradingView Chart in New Tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER INFO BAR */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 font-mono">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Confirmed swing pivots (HH/HL/LH/LL), 8/21 EMA slope, and volume confirmation are calculated on closed 5-minute candles.
            </span>
          </div>
          <div className="text-slate-500 text-[11px]">
            Max Score: 7 Points (+2 Structure, +2 EMA Alignment, +1 EMA Slope, +1 Volume, +1 Breakout)
          </div>
        </div>
      </div>
    </div>
  );
};
