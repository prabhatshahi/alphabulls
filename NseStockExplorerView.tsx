import React, { useState, useEffect, useMemo } from 'react';
import { ALL_NSE_STOCKS, NseStockMaster, getNseStocksByUniverse } from '../constants/allNseStocks';
import { NseStockItem, StockScanStatus, UniverseType } from '../types';
import { openTradingViewChart } from '../utils/tradingView';
import { NSE_SECTOR_ICONS } from '../constants/sectors';
import { UniverseSelector } from './UniverseSelector';
import { 
  Search, 
  RefreshCw, 
  Download, 
  Copy, 
  Check, 
  SlidersHorizontal, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Layers, 
  Zap, 
  Globe, 
  Table as TableIcon, 
  LayoutGrid, 
  Activity, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  CheckCircle2,
  ChevronRight,
  BarChart2
} from 'lucide-react';

interface NseStockExplorerViewProps {
  universe?: UniverseType;
  setUniverse?: (u: UniverseType) => void;
  onSelectSymbolForChart: (symbol: string) => void;
  onOpenChartModal?: (symbol: string) => void;
}

type CapFilter = 'ALL' | 'FNO_ONLY' | 'NIFTY_50' | 'NIFTY_100' | 'NIFTY_200' | 'NIFTY_500' | 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP';
type ViewMode = 'TABLE' | 'GRID';

export const NseStockExplorerView: React.FC<NseStockExplorerViewProps> = ({
  universe = 'ALL_NSE',
  setUniverse,
  onSelectSymbolForChart,
  onOpenChartModal
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [capFilter, setCapFilter] = useState<CapFilter>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE');
  const [copiedSymbols, setCopiedSymbols] = useState<boolean>(false);
  const [copiedSingle, setCopiedSingle] = useState<string | null>(null);

  // Live Scanned Quotes / ADR levels state
  const [liveScanData, setLiveScanData] = useState<Record<string, StockScanStatus>>({});
  const [isFetchingLiveQuotes, setIsFetchingLiveQuotes] = useState<boolean>(false);
  const [fetchProgress, setFetchProgress] = useState<{ current: number; total: number } | null>(null);

  // Get unique sectors
  const allSectors = useMemo(() => {
    return Array.from(new Set(ALL_NSE_STOCKS.map(s => s.sector))).sort();
  }, []);

  // Filtered stocks list
  const filteredStocks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    
    // Symbols in active universe
    const activeUniverseSymbols = universe !== 'ALL_NSE' && universe !== 'CUSTOM'
      ? new Set(getNseStocksByUniverse(universe))
      : null;

    return ALL_NSE_STOCKS.filter(stock => {
      // If a specific universe is active (and capFilter is ALL), filter by universe
      if (activeUniverseSymbols && capFilter === 'ALL' && !activeUniverseSymbols.has(stock.symbol)) {
        return false;
      }

      // Search query filter
      if (query) {
        const matchesSymbol = stock.cleanSymbol.toLowerCase().includes(query) || stock.symbol.toLowerCase().includes(query);
        const matchesName = stock.name.toLowerCase().includes(query);
        const matchesSector = stock.sector.toLowerCase().includes(query);
        if (!matchesSymbol && !matchesName && !matchesSector) return false;
      }

      // Sector filter
      if (selectedSector !== 'ALL' && stock.sector !== selectedSector) {
        return false;
      }

      // Cap Tier & F&O filter
      if (capFilter === 'LARGE_CAP' && stock.capTier !== 'LARGE_CAP') return false;
      if (capFilter === 'MID_CAP' && stock.capTier !== 'MID_CAP') return false;
      if (capFilter === 'SMALL_CAP' && stock.capTier !== 'SMALL_CAP') return false;
      if (capFilter === 'FNO_ONLY' && !stock.isFno) return false;
      if (capFilter === 'NIFTY_50' && !getNseStocksByUniverse('NIFTY_50').includes(stock.symbol)) return false;
      if (capFilter === 'NIFTY_100' && !getNseStocksByUniverse('NIFTY_100').includes(stock.symbol)) return false;
      if (capFilter === 'NIFTY_200' && !getNseStocksByUniverse('NIFTY_200').includes(stock.symbol)) return false;
      if (capFilter === 'NIFTY_500' && !getNseStocksByUniverse('NIFTY_500').includes(stock.symbol)) return false;

      return true;
    });
  }, [searchQuery, selectedSector, capFilter, universe]);

  // Statistics Summary
  const stats = useMemo(() => {
    const total = ALL_NSE_STOCKS.length;
    const fnoCount = ALL_NSE_STOCKS.filter(s => s.isFno).length;
    const largeCount = ALL_NSE_STOCKS.filter(s => s.capTier === 'LARGE_CAP').length;
    const midCount = ALL_NSE_STOCKS.filter(s => s.capTier === 'MID_CAP').length;
    const smallCount = ALL_NSE_STOCKS.filter(s => s.capTier === 'SMALL_CAP').length;
    return { total, fnoCount, largeCount, midCount, smallCount };
  }, []);

  // Fetch live market ADR and quotes for visible / filtered stocks
  const handleFetchLiveMarketQuotes = async () => {
    if (isFetchingLiveQuotes || filteredStocks.length === 0) return;

    setIsFetchingLiveQuotes(true);
    const targetSymbols = filteredStocks.slice(0, 80).map(s => s.symbol);
    setFetchProgress({ current: 0, total: targetSymbols.length });

    try {
      const BATCH_SIZE = 10;
      const newQuotes: Record<string, StockScanStatus> = { ...liveScanData };

      for (let i = 0; i < targetSymbols.length; i += BATCH_SIZE) {
        const batch = targetSymbols.slice(i, i + BATCH_SIZE);
        try {
          const res = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbols: batch, timeframe: '15m' })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.results && Array.isArray(data.results)) {
              data.results.forEach((r: StockScanStatus) => {
                if (r && r.symbol) {
                  newQuotes[r.symbol] = r;
                }
              });
            }
          }
        } catch (e) {
          console.warn('Batch fetch error:', e);
        }
        setFetchProgress({ current: Math.min(i + BATCH_SIZE, targetSymbols.length), total: targetSymbols.length });
      }

      setLiveScanData(newQuotes);
    } catch (err) {
      console.error('Failed to fetch live quotes:', err);
    } finally {
      setIsFetchingLiveQuotes(false);
      setFetchProgress(null);
    }
  };

  // Copy Symbols
  const handleCopySymbolList = () => {
    const list = filteredStocks.map(s => s.symbol).join(', ');
    navigator.clipboard.writeText(list);
    setCopiedSymbols(true);
    setTimeout(() => setCopiedSymbols(false), 2500);
  };

  const handleCopySingle = (sym: string) => {
    navigator.clipboard.writeText(sym);
    setCopiedSingle(sym);
    setTimeout(() => setCopiedSingle(null), 1800);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Symbol', 'NSE Clean Symbol', 'Company Name', 'Sector', 'Market Cap Tier', 'Series', 'F&O Eligible', 'Latest Price (₹)', 'Change (%)', 'ADR (14) Resistance', 'ADR (14) Support', 'Status'];
    const rows = filteredStocks.map(s => {
      const q = liveScanData[s.symbol];
      return [
        s.symbol,
        s.cleanSymbol,
        `"${s.name.replace(/"/g, '""')}"`,
        s.sector,
        s.capTier,
        s.series,
        s.isFno ? 'YES' : 'NO',
        q ? q.latestPrice.toFixed(2) : 'N/A',
        q ? `${q.priceChangePct >= 0 ? '+' : ''}${q.priceChangePct}%` : 'N/A',
        q ? q.resistance.toFixed(2) : 'N/A',
        q ? q.support.toFixed(2) : 'N/A',
        q ? q.status : 'NEUTRAL'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NSE_All_Stocks_Master_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn pb-12">
      
      {/* MASTER TOP BANNER & METRICS */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                NSE INDIA MASTER DIRECTORY
              </span>
              <span className="bg-slate-800 text-slate-300 text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded-md border border-slate-700">
                EQ SERIES
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
              All NSE Listed Stocks
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Complete universe of National Stock Exchange of India equities with live price feeds, 14-day ADR levels, F&O derivatives tagging, and sector taxonomy.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {setUniverse && (
              <UniverseSelector
                universe={universe}
                setUniverse={setUniverse}
                variant="dropdown"
              />
            )}

            <button
              onClick={handleFetchLiveMarketQuotes}
              disabled={isFetchingLiveQuotes}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                isFetchingLiveQuotes
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isFetchingLiveQuotes ? 'animate-spin' : ''}`} />
              <span>
                {isFetchingLiveQuotes
                  ? `Fetching Quotes (${fetchProgress?.current}/${fetchProgress?.total})...`
                  : 'Fetch Live Quotes & ADR'}
              </span>
            </button>

            <button
              onClick={handleCopySymbolList}
              className="px-3 py-2 bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-md hover:border-slate-600"
              title="Copy filtered symbols to clipboard"
            >
              {copiedSymbols ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSymbols ? 'Copied!' : 'Copy Symbols'}</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3 py-2 bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-md hover:border-slate-600"
              title="Download full dataset as CSV"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* QUICK STATS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-center">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Total Tracked</span>
            <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">{stats.total}</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-center">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">F&O Active</span>
            <span className="text-base sm:text-lg font-black text-amber-400 font-mono">{stats.fnoCount}</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-center">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Large Caps</span>
            <span className="text-base sm:text-lg font-black text-cyan-400 font-mono">{stats.largeCount}</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-center">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Mid Caps</span>
            <span className="text-base sm:text-lg font-black text-indigo-400 font-mono">{stats.midCount}</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Small / Micro</span>
            <span className="text-base sm:text-lg font-black text-purple-400 font-mono">{stats.smallCount}</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Symbol (e.g. RELIANCE, TCS), Company Name, or Sector..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 transition-all font-mono"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs font-mono px-1 py-0.5 bg-slate-800 rounded"
              >
                Clear
              </button>
            )}
          </div>

          {/* View Mode & Count */}
          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
            <div className="text-xs text-slate-400 font-mono">
              Showing <span className="text-emerald-400 font-bold">{filteredStocks.length}</span> of {ALL_NSE_STOCKS.length}
            </div>

            <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'TABLE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'GRID' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* PILL FILTERS: Market Cap & Sector Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          
          {/* Cap Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setCapFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                capFilter === 'ALL'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All Equities ({ALL_NSE_STOCKS.length})
            </button>

            <button
              onClick={() => setCapFilter('FNO_ONLY')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                capFilter === 'FNO_ONLY'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-amber-400/90 hover:text-amber-300 border border-slate-800'
              }`}
            >
              <Zap className="w-3 h-3" />
              F&O Stocks ({stats.fnoCount})
            </button>

            <button
              onClick={() => setCapFilter('NIFTY_50')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                capFilter === 'NIFTY_50'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-slate-950 text-blue-400 hover:text-blue-300 border border-slate-800'
              }`}
            >
              NIFTY 50
            </button>

            <button
              onClick={() => setCapFilter('NIFTY_100')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                capFilter === 'NIFTY_100'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-cyan-400 hover:text-cyan-300 border border-slate-800'
              }`}
            >
              NIFTY 100
            </button>

            <button
              onClick={() => setCapFilter('NIFTY_500')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                capFilter === 'NIFTY_500'
                  ? 'bg-violet-500 text-white shadow-sm'
                  : 'bg-slate-950 text-violet-400 hover:text-violet-300 border border-slate-800'
              }`}
            >
              NIFTY 500
            </button>

            <button
              onClick={() => setCapFilter('LARGE_CAP')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                capFilter === 'LARGE_CAP'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Large Cap ({stats.largeCount})
            </button>

            <button
              onClick={() => setCapFilter('MID_CAP')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                capFilter === 'MID_CAP'
                  ? 'bg-indigo-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Mid Cap ({stats.midCount})
            </button>

            <button
              onClick={() => setCapFilter('SMALL_CAP')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                capFilter === 'SMALL_CAP'
                  ? 'bg-purple-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Small Cap ({stats.smallCount})
            </button>
          </div>

          {/* Sector Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">Sector:</span>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 font-mono focus:outline-none focus:border-emerald-500/60 cursor-pointer"
            >
              <option value="ALL">All Sectors ({allSectors.length})</option>
              {allSectors.map(sec => (
                <option key={sec} value={sec}>
                  {NSE_SECTOR_ICONS[sec] || '📁'} {sec}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* STOCKS LIST / GRID */}
      {filteredStocks.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">No NSE stocks found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query "{searchQuery}" or resetting sector / market cap filters.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedSector('ALL'); setCapFilter('ALL'); }}
            className="mt-4 px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-mono font-bold hover:bg-emerald-500/30 transition-all cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'TABLE' ? (
        
        /* TABLE VIEW */
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3 sm:px-4">Symbol & Name</th>
                  <th className="py-3 px-3">Sector</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Series</th>
                  <th className="py-3 px-3 text-right">Live LTP</th>
                  <th className="py-3 px-3 text-right">1D Change</th>
                  <th className="py-3 px-3 text-right">ADR Resistance</th>
                  <th className="py-3 px-3 text-right">ADR Support</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredStocks.map((stock) => {
                  const quote = liveScanData[stock.symbol];
                  const hasQuote = !!quote;
                  const isBull = quote && quote.priceChangePct >= 0;

                  return (
                    <tr 
                      key={stock.symbol}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectSymbolForChart(stock.symbol)}
                    >
                      {/* Symbol & Name */}
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-100 font-mono text-xs sm:text-sm group-hover:text-emerald-400 transition-colors">
                                {stock.cleanSymbol}
                              </span>
                              {stock.isFno && (
                                <span className="bg-amber-500/20 text-amber-300 text-[9px] font-mono px-1 py-0.2 rounded border border-amber-500/30">
                                  F&O
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[180px] sm:max-w-[240px]">
                              {stock.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Sector */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-[11px] text-slate-300 flex items-center gap-1">
                          <span>{NSE_SECTOR_ICONS[stock.sector] || '📁'}</span>
                          <span>{stock.sector}</span>
                        </span>
                      </td>

                      {/* Cap Tier */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          stock.capTier === 'LARGE_CAP'
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                            : stock.capTier === 'MID_CAP'
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        }`}>
                          {stock.capTier === 'LARGE_CAP' ? 'Large Cap' : stock.capTier === 'MID_CAP' ? 'Mid Cap' : 'Small Cap'}
                        </span>
                      </td>

                      {/* Series */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-400">
                        {stock.series}
                      </td>

                      {/* Live LTP */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                        {hasQuote ? (
                          <span>₹{quote.latestPrice.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">—</span>
                        )}
                      </td>

                      {/* 1D Change */}
                      <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                        {hasQuote ? (
                          <span className={`flex items-center justify-end gap-0.5 ${isBull ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isBull ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {quote.priceChangePct >= 0 ? '+' : ''}{quote.priceChangePct.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">—</span>
                        )}
                      </td>

                      {/* ADR Resistance */}
                      <td className="py-3 px-3 text-right font-mono text-emerald-300/90 whitespace-nowrap">
                        {hasQuote && quote.resistance > 0 ? (
                          <span>₹{quote.resistance.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">—</span>
                        )}
                      </td>

                      {/* ADR Support */}
                      <td className="py-3 px-3 text-right font-mono text-rose-300/90 whitespace-nowrap">
                        {hasQuote && quote.support > 0 ? (
                          <span>₹{quote.support.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {hasQuote ? (
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            quote.status === 'BUY_SIGNAL'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                              : quote.status === 'SELL_SIGNAL'
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {quote.status === 'BUY_SIGNAL' ? '🚀 BUY' : quote.status === 'SELL_SIGNAL' ? '🔻 SELL' : 'NEUTRAL'}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[10px] font-mono">READY</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectSymbolForChart(stock.symbol)}
                            className="p-1.5 bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                            title="Open in Chart Analysis"
                          >
                            <BarChart2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => openTradingViewChart(stock.cleanSymbol)}
                            className="p-1.5 bg-slate-800 hover:bg-sky-500/20 hover:text-sky-300 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                            title="Open TradingView Chart"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleCopySingle(stock.symbol)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                            title="Copy Ticker"
                          >
                            {copiedSingle === stock.symbol ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredStocks.map((stock) => {
            const quote = liveScanData[stock.symbol];
            const hasQuote = !!quote;
            const isBull = quote && quote.priceChangePct >= 0;

            return (
              <div
                key={stock.symbol}
                onClick={() => onSelectSymbolForChart(stock.symbol)}
                className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-3.5 transition-all cursor-pointer group shadow-md hover:shadow-xl relative"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-100 font-mono text-sm group-hover:text-emerald-400 transition-colors">
                        {stock.cleanSymbol}
                      </span>
                      {stock.isFno && (
                        <span className="bg-amber-500/20 text-amber-300 text-[9px] font-mono px-1.5 py-0.2 rounded border border-amber-500/30">
                          F&O
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate max-w-[160px]">
                      {stock.name}
                    </p>
                  </div>

                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    stock.capTier === 'LARGE_CAP'
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                      : stock.capTier === 'MID_CAP'
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                  }`}>
                    {stock.capTier === 'LARGE_CAP' ? 'Large' : stock.capTier === 'MID_CAP' ? 'Mid' : 'Small'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1.5 px-2 bg-slate-950/60 rounded-xl border border-slate-800/80 mb-2.5 font-mono">
                  <span className="text-slate-400 text-[10px]">
                    {NSE_SECTOR_ICONS[stock.sector] || '📁'} {stock.sector}
                  </span>
                  {hasQuote ? (
                    <span className={`font-bold text-[11px] flex items-center gap-0.5 ${isBull ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {quote.priceChangePct >= 0 ? '+' : ''}{quote.priceChangePct.toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[10px]">EQ</span>
                  )}
                </div>

                {hasQuote ? (
                  <div className="space-y-1 text-[11px] font-mono mb-2">
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-500">LTP:</span>
                      <span className="font-bold text-slate-100">₹{quote.latestPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-emerald-400">
                      <span className="text-slate-500">ADR Res:</span>
                      <span>₹{quote.resistance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-rose-400">
                      <span className="text-slate-500">ADR Supp:</span>
                      <span>₹{quote.support.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-center text-slate-500 text-[10px] font-mono">
                    Click "Fetch Live Quotes" for ADR & LTP
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => openTradingViewChart(stock.cleanSymbol)}
                    className="text-[10px] font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>TradingView</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => handleCopySingle(stock.symbol)}
                    className="text-[10px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSingle === stock.symbol ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSingle === stock.symbol ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
