import React, { useState, useEffect } from 'react';
import { StockScanStatus, UniverseType } from '../types';
import { UniverseSelector } from './UniverseSelector';
import { getNseStocksByUniverse } from '../constants/allNseStocks';
import {
  Flame,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  BarChart3,
  Search,
  RefreshCw,
  ArrowUpDown,
  SlidersHorizontal,
  Activity,
  Sparkles,
  Info
} from 'lucide-react';

interface HotStocksViewProps {
  timeframe: '5m' | '15m';
  setTimeframe?: (tf: '5m' | '15m') => void;
  universe: UniverseType;
  setUniverse?: (u: UniverseType) => void;
  onSelectSymbolForChart: (symbol: string) => void;
  onOpenChartModal?: (symbol: string) => void;
}

export const HotStocksView: React.FC<HotStocksViewProps> = ({
  timeframe,
  setTimeframe,
  universe,
  setUniverse,
  onSelectSymbolForChart,
  onOpenChartModal,
}) => {
  const [stocks, setStocks] = useState<StockScanStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<'HOT' | 'BUY_CVD' | 'SELL_CVD' | 'RVOL_SURGE' | 'WATCHLIST'>('HOT');
  const [sortBy, setSortBy] = useState<'RVOL' | 'CVD' | 'CHANGE' | 'PROXIMITY' | 'SYMBOL' | 'LTP' | 'VOLUME'>('RVOL');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [minRvol, setMinRvol] = useState<number>(1.0);

  const handleHeaderClick = (key: 'RVOL' | 'CVD' | 'CHANGE' | 'PROXIMITY' | 'SYMBOL' | 'LTP' | 'VOLUME') => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === 'DESC' ? 'ASC' : 'DESC'));
    } else {
      setSortBy(key);
      setSortOrder(key === 'SYMBOL' ? 'ASC' : 'DESC');
    }
  };

  const renderSortArrow = (key: string) => {
    if (sortBy !== key) return null;
    return <span className="ml-1 text-amber-400 font-extrabold">{sortOrder === 'ASC' ? '▲' : '▼'}</span>;
  };

  const fetchHotData = async () => {
    setLoading(true);
    setError(null);
    try {
      let symbols: string[] = [];
      if (universe === 'CUSTOM') {
        symbols = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS'];
      } else {
        symbols = getNseStocksByUniverse(universe);
      }

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols, timeframe, universe }),
      });
      if (!res.ok) throw new Error('Failed to analyze stock volume data');
      const data = await res.json();
      setStocks(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching hot stocks data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotData();
  }, [timeframe, universe]);

  // Format volume numbers (e.g. 1.2M, 450K)
  const formatVol = (num?: number) => {
    if (!num) return '0';
    const abs = Math.abs(num);
    if (abs >= 10000000) return `${(num / 10000000).toFixed(2)}Cr`;
    if (abs >= 100000) return `${(num / 100000).toFixed(2)}L`;
    if (abs >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (abs >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Filter & Categorize
  const filtered = stocks.filter((s) => {
    const matchesSearch = s.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const rvol = s.rvol || 1.0;
    if (!matchesSearch) return false;
    if (rvol < minRvol) return false;

    if (activeCategory === 'HOT') {
      // High RVOL (>1.2) OR Active Signal OR close to levels (<1.0%)
      const isCloseRes = (s.distToResistancePct !== undefined && Math.abs(s.distToResistancePct) <= 1.0);
      const isCloseSupp = (s.distToSupportPct !== undefined && Math.abs(s.distToSupportPct) <= 1.0);
      return (rvol >= 1.2) || s.status !== 'NEUTRAL' || isCloseRes || isCloseSupp;
    }

    if (activeCategory === 'BUY_CVD') {
      return (s.cvd || 0) > 0;
    }

    if (activeCategory === 'SELL_CVD') {
      return (s.cvd || 0) < 0;
    }

    if (activeCategory === 'RVOL_SURGE') {
      return (s.rvol || 0) >= 1.4;
    }

    if (activeCategory === 'WATCHLIST') {
      // Within 1% of Resistance or Support
      const isCloseRes = (s.distToResistancePct !== undefined && Math.abs(s.distToResistancePct) <= 1.2);
      const isCloseSupp = (s.distToSupportPct !== undefined && Math.abs(s.distToSupportPct) <= 1.2);
      return isCloseRes || isCloseSupp;
    }

    return true;
  });

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    if (sortBy === 'SYMBOL') {
      diff = a.symbol.localeCompare(b.symbol);
    } else if (sortBy === 'RVOL') {
      diff = (a.rvol || 0) - (b.rvol || 0);
    } else if (sortBy === 'CVD') {
      diff = Math.abs(a.cvd || 0) - Math.abs(b.cvd || 0);
    } else if (sortBy === 'CHANGE') {
      diff = (a.priceChangePct || 0) - (b.priceChangePct || 0);
    } else if (sortBy === 'LTP') {
      diff = (a.latestPrice || 0) - (b.latestPrice || 0);
    } else if (sortBy === 'VOLUME') {
      diff = (a.todayVolume || 0) - (b.todayVolume || 0);
    } else if (sortBy === 'PROXIMITY') {
      const minA = Math.min(Math.abs(a.distToResistancePct || 99), Math.abs(a.distToSupportPct || 99));
      const minB = Math.min(Math.abs(b.distToResistancePct || 99), Math.abs(b.distToSupportPct || 99));
      diff = minA - minB;
    }
    return sortOrder === 'DESC' ? -diff : diff;
  });

  // Summary Metrics
  const totalAnalyzed = stocks.length;
  const highRvolCount = stocks.filter((s) => (s.rvol || 0) >= 1.3).length;
  const buyCvdCount = stocks.filter((s) => (s.cvd || 0) > 0).length;
  const sellCvdCount = stocks.filter((s) => (s.cvd || 0) < 0).length;
  const nearLevelCount = stocks.filter((s) => {
    const minD = Math.min(Math.abs(s.distToResistancePct || 99), Math.abs(s.distToSupportPct || 99));
    return minD <= 1.0;
  }).length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-400">
                <Flame className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-100">
                Volume, RVOL & Order Flow (CVD) Watchlist
              </h2>
              <span className="text-xs bg-amber-500/20 text-amber-300 font-mono font-bold px-2.5 py-0.5 rounded-md border border-amber-500/30">
                Tomorrow's Hot Picks
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Institutional activity scanner analyzing Relative Volume (RVOL) and Cumulative Volume Delta (CVD) across NIFTY F&O stocks.
            </p>
          </div>

          <div className="flex items-center space-x-3 flex-wrap gap-2">
            {setUniverse && (
              <UniverseSelector
                universe={universe}
                setUniverse={setUniverse}
                variant="dropdown"
              />
            )}

            {/* Timeframe Selector */}
            {setTimeframe && (
              <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 px-2 flex items-center gap-1">
                  Timeframe:
                </span>
                <button
                  onClick={() => setTimeframe('5m')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                    timeframe === '5m'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  5-Min
                </button>
                <button
                  onClick={() => setTimeframe('15m')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                    timeframe === '15m'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  15-Min
                </button>
              </div>
            )}

            <button
              onClick={fetchHotData}
              disabled={loading}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              <span>Refresh Volume Data</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
          <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-lg">
            <div className="text-[11px] text-slate-400">Total Analyzed</div>
            <div className="text-lg font-extrabold text-slate-100 font-mono mt-0.5">
              {totalAnalyzed} <span className="text-xs text-slate-500 font-normal">Stocks</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-amber-500/20 p-3 rounded-lg">
            <div className="text-[11px] text-amber-400 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Volume Surge (RVOL &gt;1.3x)
            </div>
            <div className="text-lg font-extrabold text-amber-300 font-mono mt-0.5">
              {highRvolCount} <span className="text-xs text-slate-500 font-normal">Stocks</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-emerald-500/20 p-3 rounded-lg">
            <div className="text-[11px] text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Buying Delta (+CVD)
            </div>
            <div className="text-lg font-extrabold text-emerald-400 font-mono mt-0.5">
              {buyCvdCount} <span className="text-xs text-slate-500 font-normal">Stocks</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-rose-500/20 p-3 rounded-lg">
            <div className="text-[11px] text-rose-400 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> Selling Delta (-CVD)
            </div>
            <div className="text-lg font-extrabold text-rose-400 font-mono mt-0.5">
              {sellCvdCount} <span className="text-xs text-slate-500 font-normal">Stocks</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-700/80 p-3 rounded-lg col-span-2 md:col-span-1">
            <div className="text-[11px] text-sky-400 flex items-center gap-1">
              <Target className="w-3 h-3" /> Near ADR Level (&lt;1%)
            </div>
            <div className="text-lg font-extrabold text-sky-300 font-mono mt-0.5">
              {nearLevelCount} <span className="text-xs text-slate-500 font-normal">Watchlist</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Category Tabs & Search Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-4">
        
        {/* Category Buttons */}
        <div className="flex space-x-1.5 overflow-x-auto pb-1 border-b border-slate-800/80">
          <button
            onClick={() => setActiveCategory('HOT')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeCategory === 'HOT'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>🔥 Tomorrow's Hot Picks</span>
          </button>

          <button
            onClick={() => setActiveCategory('BUY_CVD')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeCategory === 'BUY_CVD'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>🟢 Accumulation (+CVD)</span>
          </button>

          <button
            onClick={() => setActiveCategory('SELL_CVD')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeCategory === 'SELL_CVD'
                ? 'bg-rose-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>🔴 Distribution (-CVD)</span>
          </button>

          <button
            onClick={() => setActiveCategory('RVOL_SURGE')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeCategory === 'RVOL_SURGE'
                ? 'bg-purple-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>⚡ Volume Surge (RVOL &gt;1.4)</span>
          </button>

          <button
            onClick={() => setActiveCategory('WATCHLIST')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeCategory === 'WATCHLIST'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>🎯 Near ADR Level Watchlist</span>
          </button>
        </div>

        {/* Filter Controls: Search, Sort & RVOL Slider */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ticker symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* RVOL Filter Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Min RVOL:</span>
              <select
                value={minRvol}
                onChange={(e) => setMinRvol(Number(e.target.value))}
                className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
              >
                <option value={0.5} className="bg-slate-900 text-slate-200">All Volumes (0.5x+)</option>
                <option value={1.0} className="bg-slate-900 text-slate-200">Above Average (1.0x+)</option>
                <option value={1.3} className="bg-slate-900 text-slate-200">High Volume (1.3x+)</option>
                <option value={1.8} className="bg-slate-900 text-slate-200">Massive Surge (1.8x+)</option>
              </select>
            </div>

            {/* Sort Dropdown & Ascending/Descending Toggle */}
            <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
              >
                <option value="RVOL" className="bg-slate-900 text-slate-200">RVOL Multiplier</option>
                <option value="CVD" className="bg-slate-900 text-slate-200">Order Flow Delta (|CVD|)</option>
                <option value="CHANGE" className="bg-slate-900 text-slate-200">Today's Price % Change</option>
                <option value="PROXIMITY" className="bg-slate-900 text-slate-200">Closest to Breakout Level</option>
                <option value="SYMBOL" className="bg-slate-900 text-slate-200">Symbol Name (A-Z)</option>
                <option value="LTP" className="bg-slate-900 text-slate-200">LTP Price</option>
                <option value="VOLUME" className="bg-slate-900 text-slate-200">Total Volume</option>
              </select>
            </div>

            {/* Ascending / Descending Buttons */}
            <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setSortOrder('ASC')}
                className={`px-2.5 py-1 rounded font-extrabold text-[11px] transition-colors cursor-pointer ${
                  sortOrder === 'ASC'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Sort Ascending (Low to High)"
              >
                Ascending (Low → High ↑)
              </button>
              <button
                onClick={() => setSortOrder('DESC')}
                className={`px-2.5 py-1 rounded font-extrabold text-[11px] transition-colors cursor-pointer ${
                  sortOrder === 'DESC'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Sort Descending (High to Low)"
              >
                Descending (High → Low ↓)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stock List Table / Grid */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center shadow-lg">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-200">Analyzing Market Volume & Order Flow...</h3>
          <p className="text-xs text-slate-400 mt-1">Calculating RVOL and Cumulative Volume Delta (CVD) across NIFTY F&O universe.</p>
        </div>
      ) : error ? (
        <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-6 text-center text-rose-300 text-xs">
          {error}
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 text-xs shadow-lg">
          No stocks match the selected volume or order flow filter criteria. Try lowering the Min RVOL filter.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-auto max-h-[65vh] relative">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-20 bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800 shadow-md">
                <tr>
                  <th 
                    className="py-3 px-4 cursor-pointer select-none hover:text-slate-100 transition-colors"
                    onClick={() => handleHeaderClick('SYMBOL')}
                    title="Click to sort by Symbol"
                  >
                    Symbol {renderSortArrow('SYMBOL')}
                  </th>
                  <th 
                    className="py-3 px-3 cursor-pointer select-none hover:text-slate-100 transition-colors"
                    onClick={() => handleHeaderClick('CHANGE')}
                    title="Click to sort by Price / Chg %"
                  >
                    LTP & Chg % {renderSortArrow('CHANGE')}
                  </th>
                  <th className="py-3 px-3 text-emerald-300">Multi-Day / PD Range</th>
                  <th 
                    className="py-3 px-3 cursor-pointer select-none hover:text-amber-300 transition-colors"
                    onClick={() => handleHeaderClick('RVOL')}
                    title="Click to sort by Relative Volume"
                  >
                    RVOL Multiplier {renderSortArrow('RVOL')}
                  </th>
                  <th 
                    className="py-3 px-3 cursor-pointer select-none hover:text-sky-300 transition-colors"
                    onClick={() => handleHeaderClick('CVD')}
                    title="Click to sort by Order Flow (CVD)"
                  >
                    Order Flow (CVD) {renderSortArrow('CVD')}
                  </th>
                  <th 
                    className="py-3 px-3 cursor-pointer select-none hover:text-slate-100 transition-colors"
                    onClick={() => handleHeaderClick('VOLUME')}
                    title="Click to sort by Session Volume"
                  >
                    Session Volume {renderSortArrow('VOLUME')}
                  </th>
                  <th className="py-3 px-3">Resistance / Support</th>
                  <th 
                    className="py-3 px-3 cursor-pointer select-none hover:text-slate-100 transition-colors"
                    onClick={() => handleHeaderClick('PROXIMITY')}
                    title="Click to sort by Breakout Distance"
                  >
                    Breakout Distance {renderSortArrow('PROXIMITY')}
                  </th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Chart</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {sorted.map((s, idx) => {
                  const rvol = s.rvol || 1.0;
                  const cvd = s.cvd || 0;
                  const chgPct = s.priceChangePct || 0;
                  const distRes = s.distToResistancePct || 0;
                  const distSupp = s.distToSupportPct || 0;

                  const isHighRvol = rvol >= 1.4;
                  const isModerateRvol = rvol >= 1.1;

                  return (
                    <tr key={`${s.symbol}_${idx}`} className="hover:bg-slate-800/40 transition-colors">
                      
                      {/* Symbol */}
                      <td className="py-3.5 px-4 font-sans font-extrabold text-slate-100">
                        <button
                          onClick={() => onOpenChartModal ? onOpenChartModal(s.symbol) : onSelectSymbolForChart(s.symbol)}
                          className="flex items-center space-x-2 hover:text-amber-400 cursor-pointer transition-colors text-left"
                          title={`Click to open quick popup chart for ${s.symbol}`}
                        >
                          <span className="text-sm font-extrabold hover:underline">{s.symbol}</span>
                          {isHighRvol && (
                            <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30 font-bold flex items-center gap-0.5" title="Volume Expansion Surge">
                              <Zap className="w-2.5 h-2.5" /> HOT
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Price & % Change */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-200">₹{s.latestPrice.toFixed(2)}</div>
                        <div className={`text-[11px] font-semibold ${chgPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {chgPct >= 0 ? `+${chgPct.toFixed(2)}%` : `${chgPct.toFixed(2)}%`}
                        </div>
                      </td>

                      {/* Multi-Day & Previous Day Range */}
                      <td className="py-3.5 px-3 font-sans">
                        {s.daysHighBroken && s.daysHighBroken >= 2 ? (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded inline-flex items-center gap-1 whitespace-nowrap" title={`Broke ${s.daysHighBroken} consecutive daily highs`}>
                            <Flame className="w-3 h-3 text-emerald-400" />
                            {s.daysHighBroken}-Day High
                          </span>
                        ) : s.daysLowBroken && s.daysLowBroken >= 2 ? (
                          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded inline-flex items-center gap-1 whitespace-nowrap" title={`Broke ${s.daysLowBroken} consecutive daily lows`}>
                            <TrendingDown className="w-3 h-3 text-rose-400" />
                            {s.daysLowBroken}-Day Low
                          </span>
                        ) : s.pdRangeStatus === 'ABOVE_PDH' ? (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap" title={`Above Yesterday's High ₹${s.pdh}`}>
                            Broke PDH (₹{s.pdh})
                          </span>
                        ) : s.pdRangeStatus === 'BELOW_PDL' ? (
                          <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap" title={`Below Yesterday's Low ₹${s.pdl}`}>
                            Broke PDL (₹{s.pdl})
                          </span>
                        ) : (
                          <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded whitespace-nowrap">
                            Inside PD Range
                          </span>
                        )}
                      </td>

                      {/* RVOL Multiplier */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center space-x-1.5">
                          <span className={`px-2 py-0.5 rounded text-xs font-black font-mono border ${
                            isHighRvol
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : isModerateRvol
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {rvol.toFixed(2)}x
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">vs 10-Day Avg</div>
                      </td>

                      {/* CVD Order Flow Delta */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center space-x-1.5">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono border flex items-center gap-1 ${
                            cvd > 0
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : cvd < 0
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {cvd > 0 ? <TrendingUp className="w-3 h-3" /> : cvd < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                            <span>{cvd > 0 ? `+${formatVol(cvd)}` : formatVol(cvd)}</span>
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-sans">
                          {cvd > 0 ? 'Buyer Dominance' : cvd < 0 ? 'Seller Dominance' : 'Balanced'}
                        </div>
                      </td>

                      {/* Total Volume vs Avg */}
                      <td className="py-3.5 px-3 text-slate-300">
                        <div className="font-bold">{formatVol(s.volume)}</div>
                        <div className="text-[10px] text-slate-500">Avg: {formatVol(s.avgVolume10d)}</div>
                      </td>

                      {/* Resistance & Support */}
                      <td className="py-3.5 px-3 font-medium">
                        <div className="text-emerald-400">Res: ₹{s.resistance.toFixed(2)}</div>
                        <div className="text-rose-400">Sup: ₹{s.support.toFixed(2)}</div>
                      </td>

                      {/* Proximity Distance */}
                      <td className="py-3.5 px-3">
                        {distRes <= 0 ? (
                          <span className="text-xs text-emerald-400 font-bold">Res Broken (+{Math.abs(distRes).toFixed(2)}%)</span>
                        ) : distSupp <= 0 ? (
                          <span className="text-xs text-rose-400 font-bold">Supp Broken (-{Math.abs(distSupp).toFixed(2)}%)</span>
                        ) : (
                          <div className="text-[11px] text-slate-300">
                            <div>To Res: <span className="font-bold text-emerald-400">{distRes.toFixed(2)}%</span></div>
                            <div>To Sup: <span className="font-bold text-rose-400">{distSupp.toFixed(2)}%</span></div>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        {s.status === 'BUY_SIGNAL' ? (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                            BUY SIGNAL
                          </span>
                        ) : s.status === 'SELL_SIGNAL' ? (
                          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                            SELL SIGNAL
                          </span>
                        ) : (
                          <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-medium px-2 py-1 rounded-full">
                            NEUTRAL
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => onSelectSymbolForChart(s.symbol)}
                          className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-lg text-xs font-bold border border-amber-500/30 transition-colors inline-flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
                          title="View Chart"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
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
      )}

      {/* Methodology Guide Footer */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 space-y-2">
        <div className="flex items-center space-x-2 text-slate-200 font-bold">
          <Info className="w-4 h-4 text-amber-400" />
          <span>Understanding Relative Volume (RVOL) & Cumulative Volume Delta (CVD)</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
          <li><strong>RVOL (Relative Volume)</strong>: Compares today's session volume against the stock's 10-day moving average volume. An RVOL &gt; 1.3x signifies heavy institutional participation.</li>
          <li><strong>CVD (Cumulative Volume Delta)</strong>: Estimates net aggressive buying vs selling pressure across completed intraday candles. Positive CVD indicates strong accumulation; negative CVD indicates distribution.</li>
          <li><strong>Hot Stock Selection Rule</strong>: Stocks combining high RVOL (&gt;1.3x) with directional CVD and trading near fixed ADR Resistance/Support are high-probability watchlist candidates for tomorrow's market open.</li>
        </ul>
      </div>

    </div>
  );
};
