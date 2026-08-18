import React, { useState } from 'react';
import { StockScanStatus } from '../types';
import { 
  Flame, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Activity, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowUpDown,
  Grid, 
  PieChart, 
  Sparkles,
  BarChart2,
  RefreshCw,
  Shield,
  Maximize2
} from 'lucide-react';

interface VisualHeatmapWidgetProps {
  results: StockScanStatus[];
  onSelectSymbolForChart: (symbol: string) => void;
  onOpenChartModal?: (symbol: string) => void;
  timeframe: '5m' | '15m';
  initialSectorFilter?: string;
}

type HeatmapMode = 'ADR_DISTANCE' | 'VOLATILITY_RVOL' | 'PRICE_CHANGE';
type GroupByOption = 'BREAKOUT_STATUS' | 'SECTOR' | 'VOLATILITY_TIER' | 'NONE';
type FilterCategory = 'ALL' | 'ABOVE_RES' | 'BELOW_SUPP' | 'HIGH_RVOL' | 'TOP_GAINERS' | 'TOP_LOSERS';

import { 
  NSE_SECTOR_MAPPINGS as SECTOR_MAPPINGS, 
  NSE_SECTOR_ICONS,
  getSectorForSymbol 
} from '../constants/sectors';

export const VisualHeatmapWidget: React.FC<VisualHeatmapWidgetProps> = ({
  results,
  onSelectSymbolForChart,
  onOpenChartModal,
  timeframe,
  initialSectorFilter
}) => {
  const [viewType, setViewType] = useState<'SECTORS' | 'STOCKS'>('SECTORS');
  const [sectorSortMode, setSectorSortMode] = useState<'BULLISH' | 'BEARISH' | 'BREAKOUTS' | 'NAME'>('BULLISH');
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('ADR_DISTANCE');
  const [groupBy, setGroupBy] = useState<GroupByOption>('BREAKOUT_STATUS');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('ALL');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>(initialSectorFilter || 'ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStock, setSelectedStock] = useState<StockScanStatus | null>(null);

  // Calculate aggregated sector heatmap metrics for all 27 NSE Sectors
  const sectorHeatmapData = React.useMemo(() => {
    return Object.entries(SECTOR_MAPPINGS).map(([secName, symbols]) => {
      const cleanSymbols = symbols.map(s => s.replace('.NS', '').toUpperCase());
      const matchedStocks = results.filter(r => cleanSymbols.includes(r.symbol.replace('.NS', '').toUpperCase()));

      const count = matchedStocks.length;
      let totalChange = 0;
      let adv = 0;
      let dec = 0;
      let adrResCount = 0;
      let adrSuppCount = 0;
      let totalRvol = 0;

      matchedStocks.forEach(s => {
        const change = s.priceChangePct || 0;
        totalChange += change;
        if (change > 0.01) adv++;
        else if (change < -0.01) dec++;

        if (s.latestPrice > s.resistance) adrResCount++;
        if (s.latestPrice < s.support) adrSuppCount++;
        totalRvol += (s.rvol || 1.0);
      });

      const avgChangePct = count > 0 ? totalChange / count : 0;
      const avgRvol = count > 0 ? totalRvol / count : 1.0;
      const icon = NSE_SECTOR_ICONS[secName] || '🏢';

      return {
        name: secName,
        icon,
        symbols,
        stocks: matchedStocks,
        count,
        avgChangePct,
        advances: adv,
        declines: dec,
        neutral: count - (adv + dec),
        adrResCount,
        adrSuppCount,
        avgRvol
      };
    });
  }, [results]);

  // Sort sectors
  const sortedSectors = React.useMemo(() => {
    return [...sectorHeatmapData].sort((a, b) => {
      if (sectorSortMode === 'BULLISH') return b.avgChangePct - a.avgChangePct;
      if (sectorSortMode === 'BEARISH') return a.avgChangePct - b.avgChangePct;
      if (sectorSortMode === 'BREAKOUTS') return b.adrResCount - a.adrResCount;
      if (sectorSortMode === 'NAME') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [sectorHeatmapData, sectorSortMode]);

  // Stats calculation
  const totalStocks = results.length;
  const aboveAdrResCount = results.filter(r => r.latestPrice > r.resistance).length;
  const belowAdrSuppCount = results.filter(r => r.latestPrice < r.support).length;
  const highRvolCount = results.filter(r => (r.rvol || 1.0) >= 1.3).length;
  const extremeVolCount = results.filter(r => (r.rvol || 1.0) >= 2.0).length;

  // Filter items
  const filteredResults = results.filter(item => {
    const symMatch = item.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    if (!symMatch) return false;

    if (selectedSectorFilter !== 'ALL') {
      const itemSector = getSectorForSymbol(item.symbol);
      if (itemSector !== selectedSectorFilter) return false;
    }

    if (filterCategory === 'ABOVE_RES') return item.latestPrice > item.resistance;
    if (filterCategory === 'BELOW_SUPP') return item.latestPrice < item.support;
    if (filterCategory === 'HIGH_RVOL') return (item.rvol || 1.0) >= 1.3;
    if (filterCategory === 'TOP_GAINERS') return (item.priceChangePct || 0) >= 1.0;
    if (filterCategory === 'TOP_LOSERS') return (item.priceChangePct || 0) <= -1.0;

    return true;
  });

  // Color generator function based on selected mode
  const getTileStyles = (item: StockScanStatus) => {
    const price = item.latestPrice || 1;
    const res = item.resistance || 1;
    const supp = item.support || 1;
    const rvol = item.rvol || 1.0;
    const changePct = item.priceChangePct || 0;

    const distResPct = ((price - res) / res) * 100;
    const distSuppPct = ((price - supp) / supp) * 100;

    if (heatmapMode === 'ADR_DISTANCE') {
      if (price > res) {
        if (distResPct > 1.2 && rvol >= 1.5) {
          return {
            bg: 'bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.5)] border-emerald-400 ring-1 ring-emerald-300',
            text: 'text-white',
            badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-400',
            label: `+${distResPct.toFixed(1)}% > Res`
          };
        }
        return {
          bg: 'bg-emerald-700/90 hover:bg-emerald-600 border-emerald-500/60',
          text: 'text-emerald-100',
          badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-500',
          label: `+${distResPct.toFixed(1)}% > Res`
        };
      }
      if (price < supp) {
        if (distSuppPct < -1.2 && rvol >= 1.5) {
          return {
            bg: 'bg-rose-800 shadow-[0_0_15px_rgba(244,63,94,0.5)] border-rose-400 ring-1 ring-rose-300',
            text: 'text-white',
            badgeBg: 'bg-rose-950 text-rose-300 border-rose-400',
            label: `${distSuppPct.toFixed(1)}% < Supp`
          };
        }
        return {
          bg: 'bg-rose-700/90 hover:bg-rose-600 border-rose-500/60',
          text: 'text-rose-100',
          badgeBg: 'bg-rose-950 text-rose-300 border-rose-500',
          label: `${distSuppPct.toFixed(1)}% < Supp`
        };
      }
      // Inside range
      if (distResPct >= -0.5) {
        return {
          bg: 'bg-teal-900/60 border-teal-600/50 hover:bg-teal-800/80',
          text: 'text-teal-200',
          badgeBg: 'bg-teal-950 text-teal-300 border-teal-700',
          label: `Near Res (${distResPct.toFixed(1)}%)`
        };
      }
      if (distSuppPct <= 0.5) {
        return {
          bg: 'bg-amber-900/60 border-amber-600/50 hover:bg-amber-800/80',
          text: 'text-amber-200',
          badgeBg: 'bg-amber-950 text-amber-300 border-amber-700',
          label: `Near Supp (${distSuppPct.toFixed(1)}%)`
        };
      }
      return {
        bg: 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-750',
        text: 'text-slate-200',
        badgeBg: 'bg-slate-900 text-slate-400 border-slate-700',
        label: `Inside Range`
      };
    } else if (heatmapMode === 'VOLATILITY_RVOL') {
      if (rvol >= 2.5) {
        return {
          bg: 'bg-purple-700 shadow-[0_0_12px_rgba(168,85,247,0.5)] border-purple-400 ring-1 ring-purple-300',
          text: 'text-white',
          badgeBg: 'bg-purple-950 text-purple-200 border-purple-400',
          label: `${rvol.toFixed(1)}x Vol Spike`
        };
      }
      if (rvol >= 1.5) {
        return {
          bg: 'bg-amber-600/90 hover:bg-amber-500 border-amber-400/80',
          text: 'text-amber-950 font-black',
          badgeBg: 'bg-amber-950 text-amber-300 border-amber-400',
          label: `${rvol.toFixed(1)}x RVOL`
        };
      }
      if (rvol >= 1.1) {
        return {
          bg: 'bg-emerald-800/70 hover:bg-emerald-700 border-emerald-600/60',
          text: 'text-emerald-100',
          badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-700',
          label: `${rvol.toFixed(1)}x RVOL`
        };
      }
      return {
        bg: 'bg-slate-850/80 border-slate-800 hover:bg-slate-800',
        text: 'text-slate-300',
        badgeBg: 'bg-slate-900 text-slate-400 border-slate-700',
        label: `${rvol.toFixed(1)}x RVOL`
      };
    } else {
      // PRICE_CHANGE
      if (changePct >= 2.0) {
        return {
          bg: 'bg-emerald-600 border-emerald-400 shadow-md',
          text: 'text-white',
          badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-400',
          label: `+${changePct.toFixed(2)}%`
        };
      }
      if (changePct > 0) {
        return {
          bg: 'bg-emerald-800/80 border-emerald-600/60',
          text: 'text-emerald-100',
          badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-700',
          label: `+${changePct.toFixed(2)}%`
        };
      }
      if (changePct <= -2.0) {
        return {
          bg: 'bg-rose-700 border-rose-400 shadow-md',
          text: 'text-white',
          badgeBg: 'bg-rose-950 text-rose-300 border-rose-400',
          label: `${changePct.toFixed(2)}%`
        };
      }
      return {
        bg: 'bg-rose-900/80 border-rose-700/60',
        text: 'text-rose-100',
        badgeBg: 'bg-rose-950 text-rose-300 border-rose-800',
        label: `${changePct.toFixed(2)}%`
      };
    }
  };

  // Grouping Logic
  const getGroupedData = () => {
    if (groupBy === 'BREAKOUT_STATUS') {
      const groups: Record<string, StockScanStatus[]> = {
        '🔥 Confirmed Bullish Breakouts (Above ADR Res)': [],
        '⚡ Approaching ADR Resistance (Within 0.5%)': [],
        '📋 Neutral In-Range Stocks': [],
        '🛡️ Approaching ADR Support (Within 0.5%)': [],
        '🔻 Confirmed Bearish Breakdowns (Below ADR Supp)': []
      };

      filteredResults.forEach(item => {
        const price = item.latestPrice || 1;
        const res = item.resistance || 1;
        const supp = item.support || 1;
        const distResPct = ((price - res) / res) * 100;
        const distSuppPct = ((price - supp) / supp) * 100;

        if (price > res) {
          groups['🔥 Confirmed Bullish Breakouts (Above ADR Res)'].push(item);
        } else if (price < supp) {
          groups['🔻 Confirmed Bearish Breakdowns (Below ADR Supp)'].push(item);
        } else if (distResPct >= -0.5) {
          groups['⚡ Approaching ADR Resistance (Within 0.5%)'].push(item);
        } else if (distSuppPct <= 0.5) {
          groups['🛡️ Approaching ADR Support (Within 0.5%)'].push(item);
        } else {
          groups['📋 Neutral In-Range Stocks'].push(item);
        }
      });

      return groups;
    } else if (groupBy === 'VOLATILITY_TIER') {
      const groups: Record<string, StockScanStatus[]> = {
        '⚡ Extreme Volatility Spike (RVOL ≥ 2.0x)': [],
        '🔥 Heavy Volatility Expansion (RVOL 1.3x - 2.0x)': [],
        '📈 Normal Intraday Volatility (RVOL 0.9x - 1.3x)': [],
        '💤 Low Volatility Compression (RVOL < 0.9x)': []
      };

      filteredResults.forEach(item => {
        const rvol = item.rvol || 1.0;
        if (rvol >= 2.0) groups['⚡ Extreme Volatility Spike (RVOL ≥ 2.0x)'].push(item);
        else if (rvol >= 1.3) groups['🔥 Heavy Volatility Expansion (RVOL 1.3x - 2.0x)'].push(item);
        else if (rvol >= 0.9) groups['📈 Normal Intraday Volatility (RVOL 0.9x - 1.3x)'].push(item);
        else groups['💤 Low Volatility Compression (RVOL < 0.9x)'].push(item);
      });

      return groups;
    } else if (groupBy === 'SECTOR') {
      const groups: Record<string, StockScanStatus[]> = {};
      filteredResults.forEach(item => {
        const sec = getSectorForSymbol(item.symbol);
        if (!groups[sec]) groups[sec] = [];
        groups[sec].push(item);
      });
      return groups;
    } else {
      return { 'All Scanned Stocks': filteredResults };
    }
  };

  const groupedData = getGroupedData();

  return (
    <div className="space-y-5 bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-2xl">
      
      {/* Heatmap Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-amber-500/20 rounded-lg border border-emerald-500/30 text-emerald-400">
              <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-100 font-mono uppercase tracking-wider flex items-center gap-2">
                ADR & Volatility Intensity Heatmap Widget
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                  LIVE VISUALIZER
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time visual map comparing current price relative to ADR Resistance & Support levels + RVOL multiplier intensity.
              </p>
            </div>
          </div>
        </div>

        {/* Top Summary Stats Cards */}
        <div className="flex items-center gap-2 font-mono text-xs overflow-x-auto">
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-center shrink-0">
            <span className="text-[10px] text-slate-400 block">Total Heatmap</span>
            <span className="font-extrabold text-slate-200">{filteredResults.length} Stocks</span>
          </div>

          <div className="bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-500/40 text-center shrink-0">
            <span className="text-[10px] text-emerald-400 block">Above ADR Res</span>
            <span className="font-extrabold text-emerald-400">{aboveAdrResCount}</span>
          </div>

          <div className="bg-rose-950/60 px-3 py-1.5 rounded-lg border border-rose-500/40 text-center shrink-0">
            <span className="text-[10px] text-rose-400 block">Below ADR Supp</span>
            <span className="font-extrabold text-rose-400">{belowAdrSuppCount}</span>
          </div>

          <div className="bg-amber-950/60 px-3 py-1.5 rounded-lg border border-amber-500/40 text-center shrink-0">
            <span className="text-[10px] text-amber-300 block">High RVOL (≥1.3x)</span>
            <span className="font-extrabold text-amber-300">{highRvolCount}</span>
          </div>
        </div>
      </div>

      {/* Heatmap Mode Toggle Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800 font-mono">
        <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewType('SECTORS')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              viewType === 'SECTORS'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Grid className="w-4 h-4" />
            🏢 27 NSE SECTOR HEATMAP OVERVIEW
          </button>
          <button
            onClick={() => setViewType('STOCKS')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              viewType === 'STOCKS'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            📊 INDIVIDUAL STOCKS HEATMAP ({filteredResults.length})
          </button>
        </div>

        {viewType === 'STOCKS' && selectedSectorFilter !== 'ALL' && (
          <button
            onClick={() => {
              setSelectedSectorFilter('ALL');
              setViewType('SECTORS');
            }}
            className="text-xs font-bold font-mono text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900 px-3 py-1.5 rounded-lg border border-emerald-500/40 transition-all cursor-pointer flex items-center gap-1.5"
          >
            ← Back to 27 Sectors Overview
          </button>
        )}
      </div>

      {viewType === 'SECTORS' ? (
        /* ================= 27 SECTORS HEATMAP OVERVIEW ================= */
        <div className="space-y-4">
          {/* Sector Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" /> Sort Sectors:
              </span>
              <div className="flex flex-wrap items-center gap-1">
                <button
                  onClick={() => setSectorSortMode('BULLISH')}
                  className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                    sectorSortMode === 'BULLISH'
                      ? 'bg-emerald-500 text-slate-950 font-black shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  🟢 Top Gainers
                </button>
                <button
                  onClick={() => setSectorSortMode('BEARISH')}
                  className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                    sectorSortMode === 'BEARISH'
                      ? 'bg-rose-500 text-slate-950 font-black shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  🔴 Top Losers
                </button>
                <button
                  onClick={() => setSectorSortMode('BREAKOUTS')}
                  className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                    sectorSortMode === 'BREAKOUTS'
                      ? 'bg-amber-400 text-slate-950 font-black shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  ⚡ Most Breakouts
                </button>
                <button
                  onClick={() => setSectorSortMode('NAME')}
                  className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                    sectorSortMode === 'NAME'
                      ? 'bg-slate-700 text-slate-100 font-black shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  🔤 Name A-Z
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>Showing <strong className="text-emerald-400 font-black">{sortedSectors.length} Sectors</strong></span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Click any sector tile to view constituent stock heatmap</span>
            </div>
          </div>

          {/* Sectors Heatmap Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {sortedSectors.map((sec) => {
              const isPos = sec.avgChangePct >= 0;
              const hasBreakouts = sec.adrResCount > 0;
              const hasBreakdowns = sec.adrSuppCount > 0;

              // Tile style calculation based on average sector change % and breakout intensity
              let tileBg = 'bg-slate-950/80 border-slate-800 hover:border-slate-700';
              let badgeStyle = 'bg-slate-900 text-slate-300 border-slate-700';

              if (sec.avgChangePct >= 0.8 || sec.adrResCount >= 2) {
                tileBg = 'bg-emerald-950/90 hover:bg-emerald-900/90 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/40';
                badgeStyle = 'bg-emerald-500 text-slate-950 font-black';
              } else if (sec.avgChangePct > 0) {
                tileBg = 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-800/60';
                badgeStyle = 'bg-emerald-950 text-emerald-300 border-emerald-500/50 font-bold';
              } else if (sec.avgChangePct <= -0.8 || sec.adrSuppCount >= 2) {
                tileBg = 'bg-rose-950/90 hover:bg-rose-900/90 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.2)] ring-1 ring-rose-500/40';
                badgeStyle = 'bg-rose-500 text-slate-950 font-black';
              } else if (sec.avgChangePct < 0) {
                tileBg = 'bg-rose-950/40 hover:bg-rose-900/50 border-rose-800/60';
                badgeStyle = 'bg-rose-950 text-rose-300 border-rose-500/50 font-bold';
              }

              const advPct = sec.count > 0 ? (sec.advances / sec.count) * 100 : 0;
              const decPct = sec.count > 0 ? (sec.declines / sec.count) * 100 : 0;

              return (
                <div
                  key={sec.name}
                  onClick={() => {
                    setSelectedSectorFilter(sec.name);
                    setViewType('STOCKS');
                  }}
                  className={`p-3.5 rounded-xl border transition-all transform hover:-translate-y-1 hover:shadow-2xl cursor-pointer flex flex-col justify-between min-h-[125px] group relative overflow-hidden font-mono ${tileBg}`}
                >
                  {/* Top Header */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className="text-base">{sec.icon}</span>
                      <span className="font-extrabold text-xs text-slate-100 group-hover:text-emerald-300 truncate uppercase">
                        {sec.name}
                      </span>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-mono ${badgeStyle}`}>
                      {isPos ? '+' : ''}{sec.avgChangePct.toFixed(2)}%
                    </span>
                  </div>

                  {/* Advance / Decline Progress Bar */}
                  <div className="my-1.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="text-emerald-400 font-bold">{sec.advances} Adv</span>
                      <span className="text-slate-400 text-[9px]">{sec.count} Stocks</span>
                      <span className="text-rose-400 font-bold">{sec.declines} Dec</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                      <div className="bg-emerald-500 h-full" style={{ width: `${advPct}%` }}></div>
                      <div className="bg-slate-700 h-full" style={{ width: `${100 - advPct - decPct}%` }}></div>
                      <div className="bg-rose-500 h-full" style={{ width: `${decPct}%` }}></div>
                    </div>
                  </div>

                  {/* Bottom Stats Line */}
                  <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-black/20 mt-1">
                    <div className="flex items-center gap-1.5">
                      {sec.adrResCount > 0 ? (
                        <span className="bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded text-[9px]">
                          ⚡ {sec.adrResCount} Res Breakout
                        </span>
                      ) : sec.adrSuppCount > 0 ? (
                        <span className="bg-cyan-400 text-slate-950 font-black px-1.5 py-0.2 rounded text-[9px]">
                          🛡️ {sec.adrSuppCount} Supp Break
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[9px]">Normal In-Range</span>
                      )}
                    </div>

                    <span className="text-amber-300 text-[9px] font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      {sec.avgRvol.toFixed(1)}x RVOL
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ================= INDIVIDUAL STOCKS HEATMAP ================= */
        <div className="space-y-5">
          {/* Active Sector Banner if filtered */}
          {selectedSectorFilter !== 'ALL' && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{NSE_SECTOR_ICONS[selectedSectorFilter] || '🏢'}</span>
                <div>
                  <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wider">
                    {selectedSectorFilter} CONSTITUENT STOCKS HEATMAP
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Showing {filteredResults.length} stock tiles in {selectedSectorFilter} sector
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSectorFilter('ALL')}
                className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-1 rounded-lg border border-slate-700 font-bold self-start sm:self-auto cursor-pointer"
              >
                Clear Sector Filter (Show All)
              </button>
            </div>
          )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono">
        
        {/* Sector Filter Selector */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1 font-bold flex items-center gap-1">
            <Grid className="w-3 h-3 text-purple-400" /> Filter Sector:
          </label>
          <select
            value={selectedSectorFilter}
            onChange={(e) => setSelectedSectorFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer font-bold"
          >
            <option value="ALL">🏢 All Sectors (27)</option>
            {Object.keys(SECTOR_MAPPINGS).map((secName) => (
              <option key={secName} value={secName}>
                {secName}
              </option>
            ))}
          </select>
        </div>

        {/* Heatmap Color Mode Selector */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1 font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Color Intensity Basis:
          </label>
          <select
            value={heatmapMode}
            onChange={(e) => setHeatmapMode(e.target.value as HeatmapMode)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer font-bold"
          >
            <option value="ADR_DISTANCE">🔥 ADR Distance (Res / Supp)</option>
            <option value="VOLATILITY_RVOL">⚡ Volatility Intensity (RVOL Multiplier)</option>
            <option value="PRICE_CHANGE">📈 Intraday Price Change %</option>
          </select>
        </div>

        {/* Group By Selector */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1 font-bold flex items-center gap-1">
            <Layers className="w-3 h-3 text-emerald-400" /> Group Heatmap By:
          </label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer font-bold"
          >
            <option value="BREAKOUT_STATUS">🎯 ADR Breakout Status</option>
            <option value="SECTOR">🏢 Sector Industry</option>
            <option value="VOLATILITY_TIER">⚡ Volatility Intensity Tier</option>
            <option value="NONE">📋 Flat Treemap (No Grouping)</option>
          </select>
        </div>

        {/* Category Filter Selector */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1 font-bold flex items-center gap-1">
            <Filter className="w-3 h-3 text-sky-400" /> Filter Category:
          </label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as FilterCategory)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer font-bold"
          >
            <option value="ALL">Show All Stocks ({results.length})</option>
            <option value="ABOVE_RES">🟢 Above ADR Resistance ({aboveAdrResCount})</option>
            <option value="BELOW_SUPP">🔴 Below ADR Support ({belowAdrSuppCount})</option>
            <option value="HIGH_RVOL">⚡ High RVOL ≥ 1.3x ({highRvolCount})</option>
            <option value="TOP_GAINERS">🚀 Gainers ≥ +1%</option>
            <option value="TOP_LOSERS">🔻 Losers ≤ -1%</option>
          </select>
        </div>

        {/* Search Input */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1 font-bold flex items-center gap-1">
            <Search className="w-3 h-3 text-slate-400" /> Search Ticker:
          </label>
          <input
            type="text"
            placeholder="e.g. RELIANCE, TCS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Quick Sector Filter Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono scrollbar-thin scrollbar-thumb-slate-700">
        <span className="text-slate-400 font-bold shrink-0 flex items-center gap-1">
          <Grid className="w-3 h-3 text-purple-400" /> Sector Filter:
        </span>
        <button
          onClick={() => setSelectedSectorFilter('ALL')}
          className={`px-2.5 py-0.5 rounded-full font-bold shrink-0 transition-all cursor-pointer ${
            selectedSectorFilter === 'ALL'
              ? 'bg-emerald-500 text-slate-950 font-black shadow'
              : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
          }`}
        >
          All Sectors
        </button>
        {Object.keys(SECTOR_MAPPINGS).map((secName) => (
          <button
            key={secName}
            onClick={() => setSelectedSectorFilter(secName)}
            className={`px-2.5 py-0.5 rounded-full font-extrabold shrink-0 transition-all cursor-pointer ${
              selectedSectorFilter === secName
                ? 'bg-emerald-400 text-slate-950 font-black shadow ring-1 ring-emerald-300'
                : 'bg-slate-950 text-slate-300 hover:text-emerald-300 border border-slate-800'
            }`}
          >
            {secName}
          </button>
        ))}
      </div>

      {/* Heatmap Legend Guide */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] font-mono">
        <span className="text-slate-400 font-bold flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-emerald-400" /> Legend:
        </span>

        {heatmapMode === 'ADR_DISTANCE' ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> Above ADR Res (Bullish)
            </span>
            <span className="flex items-center gap-1 text-teal-300">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span> Approaching Res
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span> Inside Range
            </span>
            <span className="flex items-center gap-1 text-amber-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span> Approaching Supp
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span> Below ADR Supp (Bearish)
            </span>
          </div>
        ) : heatmapMode === 'VOLATILITY_RVOL' ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 text-purple-300">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span> Extreme Vol (≥2.5x RVOL)
            </span>
            <span className="flex items-center gap-1 text-amber-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> High Vol (≥1.5x RVOL)
            </span>
            <span className="flex items-center gap-1 text-emerald-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Moderate (≥1.1x)
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800"></span> Normal / Low Vol
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Gain ≥ +2.0%
            </span>
            <span className="flex items-center gap-1 text-emerald-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-800"></span> Positive Gain
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-700"></span> Loss ≤ -2.0%
            </span>
          </div>
        )}
      </div>

      {/* Main Heatmap Grid Display */}
      <div className="space-y-6">
        {Object.entries(groupedData).map(([groupTitle, stocks]) => {
          if (stocks.length === 0) return null;

          return (
            <div key={groupTitle} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
                  <span>{groupTitle}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700 font-normal">
                    {stocks.length} Stocks
                  </span>
                </h3>
              </div>

              {/* Grid Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5">
                {stocks.map((st, idx) => {
                  const styles = getTileStyles(st);
                  const isPos = (st.priceChangePct || 0) >= 0;
                  const rvol = st.rvol || 1.0;

                  return (
                    <div
                      key={`${st.symbol}_${groupTitle}_${idx}`}
                      onClick={() => onOpenChartModal ? onOpenChartModal(st.symbol) : onSelectSymbolForChart(st.symbol)}
                      className={`p-3 rounded-xl border transition-all transform hover:-translate-y-1 hover:shadow-xl cursor-pointer flex flex-col justify-between min-h-[92px] group relative overflow-hidden ${styles.bg}`}
                    >
                      {/* Top Symbol & Change % */}
                      <div className="flex items-start justify-between gap-1">
                        <span className={`font-mono font-black text-xs tracking-tight uppercase group-hover:underline ${styles.text}`}>
                          {st.symbol.replace('.NS', '')}
                        </span>
                        <span className={`text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded ${
                          isPos ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                        }`}>
                          {isPos ? '+' : ''}{(st.priceChangePct || 0).toFixed(2)}%
                        </span>
                      </div>

                      {/* Middle Price */}
                      <div className="my-1">
                        <span className="font-mono text-sm font-extrabold text-white block">
                          ₹{st.latestPrice > 0 ? st.latestPrice.toFixed(2) : '--'}
                        </span>
                      </div>

                      {/* Bottom Level / RVOL Label Badge */}
                      <div className="flex items-center justify-between gap-1 mt-1 pt-1 border-t border-black/20 text-[9px] font-mono">
                        <span className={`px-1.5 py-0.5 rounded font-bold border truncate ${styles.badgeBg}`}>
                          {styles.label}
                        </span>
                        
                        {rvol >= 1.3 && (
                          <span className="bg-amber-400 text-slate-950 px-1 py-0.2 rounded font-black shrink-0" title={`Relative Volume: ${rvol.toFixed(1)}x`}>
                            {rvol.toFixed(1)}x
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )}
</div>
);
};
