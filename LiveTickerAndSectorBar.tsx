import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  PieChart, 
  Layers, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  BarChart3,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Pause,
  Play,
  Shield,
  Gauge,
  ArrowUpDown,
  RotateCw
} from 'lucide-react';

interface StockTickerItem {
  symbol: string;
  latestPrice: number;
  todaysOpen: number;
  priceChangePct: number;
  rvol?: number;
  adrRes?: number;
  adrSupp?: number;
  isAboveAdrRes?: boolean;
  isBelowAdrSupp?: boolean;
}

interface SectorData {
  name: string;
  code: string;
  icon: string;
  stocks: StockTickerItem[];
  avgChangePct: number;
  advances: number;
  declines: number;
  neutral: number;
  aboveAdrResCount: number;
  belowAdrSuppCount: number;
  netFlowStatus: 'STRONG_INFLOW' | 'MODERATE_INFLOW' | 'NEUTRAL' | 'OUTFLOW';
}

import { 
  NSE_SECTOR_MAPPINGS as SECTOR_MAPPINGS, 
  NSE_SECTOR_ICONS as SECTOR_ICONS, 
  NSE_SECTOR_CODES as SECTOR_CODES 
} from '../constants/sectors';

type TickerSpeedMode = 'ULTRA_SLOW' | 'VERY_SLOW' | 'SLOW' | 'NORMAL' | 'FAST';
type SectorSortMode = 'BULLISH' | 'BEARISH' | 'ADR_ACTIVITY' | 'NAME';

import { TabType } from '../App';
import { UniverseType, FetchUniverseType } from '../types';
import { UniverseSelector } from './UniverseSelector';

interface LiveTickerAndSectorBarProps {
  universe: UniverseType;
  setUniverse?: (u: UniverseType) => void;
  fetchUniverse?: FetchUniverseType;
  setFetchUniverse?: (f: FetchUniverseType) => void;
  timeframe: '5m' | '15m';
  onSelectSymbolForChart: (symbol: string) => void;
  onOpenChartModal?: (symbol: string) => void;
  onOpenTrendingRadar?: () => void;
}

export function LiveTickerAndSectorBar({
  universe,
  setUniverse,
  fetchUniverse,
  setFetchUniverse,
  timeframe,
  onSelectSymbolForChart,
  onOpenChartModal,
  onOpenTrendingRadar
}: LiveTickerAndSectorBarProps) {
  const [tickerItems, setTickerItems] = useState<StockTickerItem[]>([]);
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [tickerSpeed, setTickerSpeed] = useState<TickerSpeedMode>('ULTRA_SLOW');
  const [sectorSortMode, setSectorSortMode] = useState<SectorSortMode>('BULLISH');
  const [sectorStockSortMode, setSectorStockSortMode] = useState<'GAINERS' | 'LOSERS' | 'RVOL' | 'NAME'>('GAINERS');
  const [isSectorExpanded, setIsSectorExpanded] = useState<boolean>(false);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  // Stats for Advance/Decline
  const [advances, setAdvances] = useState<number>(0);
  const [declines, setDeclines] = useState<number>(0);
  const [neutral, setNeutral] = useState<number>(0);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');

  // 3-Minute Auto-Refresh Countdown (180 Seconds)
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState<number>(180);

  const fetchStockTickerData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/stock-scanner-data?universe=${universe}&interval=${timeframe}`);
      if (!res.ok) return;
      const data = await res.json();
      const items: StockTickerItem[] = (data.items || []).map((it: any) => ({
        symbol: it.symbol,
        latestPrice: it.latestPrice || 0,
        todaysOpen: it.todaysOpen || 0,
        priceChangePct: it.priceChangePct || 0,
        rvol: it.rvol || 1.0,
        adrRes: it.adrRes || 0,
        adrSupp: it.adrSupp || 0,
        isAboveAdrRes: it.isAboveAdrRes ?? (it.adrRes > 0 && it.latestPrice > it.adrRes),
        isBelowAdrSupp: it.isBelowAdrSupp ?? (it.adrSupp > 0 && it.latestPrice < it.adrSupp)
      }));

      if (items.length > 0) {
        setTickerItems(items);

        // Compute Advance / Decline
        let adv = 0;
        let dec = 0;
        let neu = 0;

        items.forEach((item) => {
          if (item.priceChangePct > 0.01) adv++;
          else if (item.priceChangePct < -0.01) dec++;
          else neu++;
        });

        setAdvances(adv);
        setDeclines(dec);
        setNeutral(neu);

        // Group into Sectors
        const sectorResults: SectorData[] = [];
        Object.entries(SECTOR_MAPPINGS).forEach(([secName, secSymbols]) => {
          const matched = items.filter((it) => 
            secSymbols.some((sym) => it.symbol.toUpperCase().includes(sym.replace('.NS','').toUpperCase()))
          );

          if (matched.length > 0) {
            const sumPct = matched.reduce((acc, m) => acc + m.priceChangePct, 0);
            const avgPct = sumPct / matched.length;

            let sAdv = 0;
            let sDec = 0;
            let sNeu = 0;
            let aboveAdr = 0;
            let belowAdr = 0;

            matched.forEach((m) => {
              if (m.priceChangePct > 0.01) sAdv++;
              else if (m.priceChangePct < -0.01) sDec++;
              else sNeu++;

              if (m.isAboveAdrRes) aboveAdr++;
              if (m.isBelowAdrSupp) belowAdr++;
            });

            let flow: 'STRONG_INFLOW' | 'MODERATE_INFLOW' | 'NEUTRAL' | 'OUTFLOW' = 'NEUTRAL';
            if (avgPct > 0.8 && sAdv > sDec * 2) flow = 'STRONG_INFLOW';
            else if (avgPct > 0.2) flow = 'MODERATE_INFLOW';
            else if (avgPct < -0.2) flow = 'OUTFLOW';

            sectorResults.push({
              name: secName,
              code: secName.substring(0, 3).toUpperCase(),
              icon: SECTOR_ICONS[secName] || '📈',
              stocks: matched,
              avgChangePct: Number(avgPct.toFixed(2)),
              advances: sAdv,
              declines: sDec,
              neutral: sNeu,
              aboveAdrResCount: aboveAdr,
              belowAdrSuppCount: belowAdr,
              netFlowStatus: flow
            });
          }
        });

        setSectors(sectorResults);
        setLastUpdatedTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.error('Ticker fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and universe/timeframe change listener
  useEffect(() => {
    fetchStockTickerData();
    setAutoRefreshCountdown(180);
  }, [universe, timeframe]);

  // 3-Minute Auto-Refresh Countdown Timer (180 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setAutoRefreshCountdown((prev) => {
        if (prev <= 1) {
          fetchStockTickerData();
          return 180;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [universe, timeframe]);

  const handleManualRefresh = () => {
    fetchStockTickerData();
    setAutoRefreshCountdown(180);
  };

  // Sector Sorting Logic
  const sortedSectors = [...sectors].sort((a, b) => {
    if (sectorSortMode === 'BULLISH') {
      return b.avgChangePct - a.avgChangePct;
    } else if (sectorSortMode === 'BEARISH') {
      return a.avgChangePct - b.avgChangePct;
    } else if (sectorSortMode === 'ADR_ACTIVITY') {
      const activityA = a.aboveAdrResCount + a.belowAdrSuppCount;
      const activityB = b.aboveAdrResCount + b.belowAdrSuppCount;
      return activityB - activityA;
    } else if (sectorSortMode === 'NAME') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const totalScanned = advances + declines + neutral;
  const adRatio = declines > 0 ? (advances / declines).toFixed(2) : (advances || 1).toFixed(2);
  const advPct = totalScanned > 0 ? Math.round((advances / totalScanned) * 100) : 50;
  const decPct = totalScanned > 0 ? Math.round((declines / totalScanned) * 100) : 50;

  // Ticker Speed Duration in Seconds
  const getSpeedDurationSeconds = () => {
    switch (tickerSpeed) {
      case 'ULTRA_SLOW': return 300;
      case 'VERY_SLOW': return 180;
      case 'SLOW': return 120;
      case 'NORMAL': return 70;
      case 'FAST': return 35;
      default: return 300;
    }
  };

  // Format countdown mm:ss
  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Duplicate ticker items for seamless looping marquee
  const loopedTickers = [...tickerItems, ...tickerItems];

  return (
    <div className="w-full bg-slate-900/90 border-y border-slate-800 shadow-2xl backdrop-blur-md mb-5 overflow-hidden rounded-xl">
      
      {/* SECTION 1: RUNNING LIVE TICKER TAPE (RIGHT TO LEFT SCROLLING WITH SPEED CONTROLS) */}
      <div className="relative border-b border-slate-800/80 bg-slate-950/80 py-1.5 overflow-hidden flex items-center group">
        
        {/* Left Label & Speed Control Panel */}
        <div className="z-20 bg-emerald-950/95 border-r border-emerald-500/40 px-2 sm:px-3 py-1 flex items-center gap-1.5 sm:gap-2.5 shadow-xl shrink-0">
          <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-emerald-500"></span>
          </span>
          
          <span className="text-[10px] sm:text-[11px] font-extrabold tracking-wider text-emerald-300 uppercase font-mono hidden xs:inline">
            TICKER
          </span>

          {/* Pause / Play Toggle */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-emerald-500 transition-colors active:scale-95"
            title={isPaused ? "Resume Ticker Scrolling" : "Pause Ticker Scrolling"}
          >
            {isPaused ? <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" /> : <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-300" />}
          </button>

          {/* Ticker Speed Selector */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-900/90 px-1 py-0.5 rounded border border-slate-800 text-[9px] sm:text-[10px] font-mono">
            <Gauge className="w-3 h-3 text-emerald-400 hidden sm:inline" />
            <button
              onClick={() => setTickerSpeed('ULTRA_SLOW')}
              className={`px-1 sm:px-1.5 py-0.5 rounded font-black transition-colors ${tickerSpeed === 'ULTRA_SLOW' ? 'bg-emerald-400 text-slate-950 shadow-sm' : 'text-emerald-400 hover:text-white'}`}
              title="Ultra Slow (0.1x)"
            >
              0.1x
            </button>
            <button
              onClick={() => setTickerSpeed('SLOW')}
              className={`px-1 sm:px-1.5 py-0.5 rounded font-bold transition-colors ${tickerSpeed === 'SLOW' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
              title="Slow Speed (1x)"
            >
              1x
            </button>
            <button
              onClick={() => setTickerSpeed('FAST')}
              className={`px-1 sm:px-1.5 py-0.5 rounded font-bold transition-colors ${tickerSpeed === 'FAST' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
              title="Fast Speed (2x)"
            >
              2x
            </button>
          </div>
        </div>

        {/* Scrolling Ticker Container */}
        <div className="overflow-hidden whitespace-nowrap flex-1 relative flex items-center">
          <div 
            className={`inline-flex items-center gap-6 ${isPaused ? '' : 'animate-ticker'}`}
            style={{ 
              animationPlayState: isPaused ? 'paused' : 'running',
              animationDuration: `${getSpeedDurationSeconds()}s`
            }}
          >
            {loading && tickerItems.length === 0 ? (
              <div className="text-xs text-slate-400 font-mono flex items-center gap-2 px-4">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                Loading Live Stock Ticker Stream...
              </div>
            ) : (
              loopedTickers.map((st, idx) => {
                const isPos = st.priceChangePct >= 0;
                return (
                  <button
                    key={`${st.symbol}_${idx}`}
                    onClick={() => onOpenChartModal ? onOpenChartModal(st.symbol) : onSelectSymbolForChart(st.symbol)}
                    className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all cursor-pointer text-left group/item shrink-0"
                  >
                    <span className="font-extrabold text-slate-200 text-xs tracking-tight group-hover/item:text-emerald-400 font-mono">
                      {st.symbol.replace('.NS', '')}
                    </span>
                    <span className="text-xs font-semibold text-slate-300 font-mono">
                      ₹{st.latestPrice > 0 ? st.latestPrice.toFixed(2) : '--'}
                    </span>
                    <span className={`inline-flex items-center text-[10px] font-extrabold px-1.5 py-0.2 rounded font-mono ${
                      isPos 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' 
                        : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                    }`}>
                      {isPos ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                      {isPos ? '+' : ''}{st.priceChangePct.toFixed(2)}%
                    </span>

                    {/* High Vol or ADR Tags */}
                    {st.isAboveAdrRes && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 rounded font-bold flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5" /> ADR Res
                      </span>
                    )}
                    {st.isBelowAdrSupp && (
                      <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1 rounded font-bold flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5" /> ADR Supp
                      </span>
                    )}
                    {st.rvol && st.rvol >= 2.0 && !st.isAboveAdrRes && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1 rounded font-bold">
                        {st.rvol.toFixed(1)}x VOL
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Auto-Refresh & Clock Panel */}
        <div className="z-20 bg-slate-950/95 border-l border-slate-800 px-3 py-1 text-[10px] font-mono text-slate-300 shrink-0 flex items-center gap-2">
          {onOpenTrendingRadar && (
            <button
              onClick={onOpenTrendingRadar}
              className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 hover:text-orange-200 border border-orange-500/50 px-2 py-0.5 rounded-lg flex items-center gap-1.5 font-bold cursor-pointer transition-all shadow-[0_0_10px_rgba(249,115,22,0.2)] active:scale-95 text-[10px]"
              title="Open 5-Minute Advanced Trending Radar"
            >
              <Zap className="w-3 h-3 text-orange-400 animate-bounce" />
              <span className="font-extrabold">5M TRENDING RADAR</span>
            </button>
          )}

          {/* 3-Minute Auto-Refresh Countdown Display */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-900 px-2 py-0.5 rounded border border-slate-800" title="Full App Auto-Refreshes every 3 minutes">
            <RotateCw className={`w-3 h-3 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-slate-400 text-[9px]">3m Auto-Refresh:</span>
            <span className="font-extrabold text-emerald-400 font-mono">{formatCountdown(autoRefreshCountdown)}</span>
            <button
              onClick={handleManualRefresh}
              className="ml-1 text-[9px] bg-slate-800 hover:bg-emerald-600 hover:text-slate-950 text-slate-300 px-1.5 py-0.2 rounded transition-colors font-bold"
              title="Click to refresh now"
            >
              Refresh
            </button>
          </div>

          <div className="flex items-center gap-1 text-slate-400 border-l border-slate-800 pl-2">
            <Clock className="w-3 h-3" />
            <span>{lastUpdatedTime || 'Live'}</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: ADVANCE / DECLINE MARKET BREADTH BAR */}
      <div className="px-4 py-3 bg-slate-900/80 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800/80">
        
        {/* A/D Header Info */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Market Breadth (Advance / Decline)
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono border border-slate-700">
                {totalScanned} Stocks Scanned
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm font-extrabold text-emerald-400 flex items-center gap-1 font-mono">
                <TrendingUp className="w-4 h-4" /> {advances} Advances ({advPct}%)
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-sm font-extrabold text-rose-400 flex items-center gap-1 font-mono">
                <TrendingDown className="w-4 h-4" /> {declines} Declines ({decPct}%)
              </span>
              {neutral > 0 && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-slate-400 font-mono">{neutral} Unchanged</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Advance / Decline Progress Visualizer Bar */}
        <div className="w-full md:w-80 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-emerald-400 font-bold">Adv {advPct}%</span>
            <span className="text-slate-300 font-extrabold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              A/D Ratio: <span className={Number(adRatio) >= 1 ? 'text-emerald-400' : 'text-rose-400'}>{adRatio}</span>
            </span>
            <span className="text-rose-400 font-bold">Dec {decPct}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-800">
            <div 
              style={{ width: `${advPct}%` }} 
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-l transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              title={`Advances: ${advances} (${advPct}%)`}
            />
            <div 
              style={{ width: `${100 - advPct - decPct}%` }} 
              className="h-full bg-slate-700" 
              title={`Neutral: ${neutral}`}
            />
            <div 
              style={{ width: `${decPct}%` }} 
              className="h-full bg-gradient-to-r from-rose-500 to-rose-700 rounded-r transition-all duration-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
              title={`Declines: ${declines} (${decPct}%)`}
            />
          </div>
        </div>

        {/* Controls: Universe Selector & Sectoral Toggle */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {setUniverse && (
            <UniverseSelector
              universe={universe}
              setUniverse={setUniverse}
              fetchUniverse={fetchUniverse}
              setFetchUniverse={setFetchUniverse}
              variant="dropdown"
            />
          )}

          {/* Sectoral Toggle Button */}
          <button
            onClick={() => setIsSectorExpanded(!isSectorExpanded)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors shadow-sm cursor-pointer"
          >
            <PieChart className="w-4 h-4 text-emerald-400" />
            <span>Sectoral Flow ({sectors.length} Sectors)</span>
            {isSectorExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* SECTION 3: SECTORAL FLOW MATRIX WITH ADR STATS & SORTING CONTROLS */}
      {isSectorExpanded && (
        <div className="p-4 bg-slate-950/60 border-t border-slate-800/60">
          
          {/* Header Controls for Sector Sorting */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 font-mono">
                Sectoral Capital Flow & ADR Breakout Heatmap
              </h3>
            </div>

            {/* Sector Sorting Options */}
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              <span className="text-slate-400 text-[10px] mr-1 hidden md:inline">Sort Sectors:</span>
              
              <button
                onClick={() => setSectorSortMode('BULLISH')}
                className={`px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1 ${
                  sectorSortMode === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                🟢 Bullish
              </button>

              <button
                onClick={() => setSectorSortMode('BEARISH')}
                className={`px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1 ${
                  sectorSortMode === 'BEARISH' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                🔴 Bearish
              </button>

              <button
                onClick={() => setSectorSortMode('ADR_ACTIVITY')}
                className={`px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1 ${
                  sectorSortMode === 'ADR_ACTIVITY' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                ⚡ ADR Breakouts
              </button>

              <button
                onClick={() => setSectorSortMode('NAME')}
                className={`px-2 py-0.5 rounded font-bold transition-all ${
                  sectorSortMode === 'NAME' ? 'bg-slate-700 text-slate-100 border border-slate-600' : 'text-slate-400 hover:text-white'
                }`}
              >
                🔤 Name A-Z
              </button>
            </div>
          </div>

          {/* Sectors Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {sortedSectors.map((sec) => {
              const isBull = sec.avgChangePct >= 0;
              const isSelected = selectedSector === sec.name;

              return (
                <button
                  key={sec.name}
                  onClick={() => setSelectedSector(isSelected ? null : sec.name)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer relative overflow-hidden ${
                    isSelected 
                      ? 'bg-slate-800 border-emerald-500 shadow-lg ring-1 ring-emerald-500/50' 
                      : isBull 
                        ? 'bg-emerald-950/20 border-emerald-900/50 hover:border-emerald-500/40 hover:bg-slate-900' 
                        : 'bg-rose-950/20 border-rose-900/50 hover:border-rose-500/40 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base">{sec.icon}</span>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded font-mono ${
                      isBull ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {isBull ? '+' : ''}{sec.avgChangePct}%
                    </span>
                  </div>

                  <div className="font-extrabold text-[11px] text-slate-200 truncate leading-tight">
                    {sec.name}
                  </div>

                  <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400 font-mono">
                    <span className="text-emerald-400 font-bold">{sec.advances} Adv</span>
                    <span className="text-rose-400 font-bold">{sec.declines} Dec</span>
                  </div>

                  {/* ADR Resistance & Support Count Tags in Card */}
                  <div className="flex items-center justify-between text-[9px] font-mono mt-1 pt-1 border-t border-slate-800/80">
                    <span className={`px-1 py-0.2 rounded font-bold flex items-center gap-0.5 ${
                      sec.aboveAdrResCount > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 opacity-60'
                    }`}>
                      ⚡ {sec.aboveAdrResCount} &gt; Res
                    </span>
                    <span className={`px-1 py-0.2 rounded font-bold flex items-center gap-0.5 ${
                      sec.belowAdrSuppCount > 0 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 opacity-60'
                    }`}>
                      🛡️ {sec.belowAdrSuppCount} &lt; Supp
                    </span>
                  </div>

                  {/* Flow Pill */}
                  <div className="mt-1 pt-1 border-t border-slate-800/60 flex items-center justify-between text-[9px] font-mono">
                    {sec.netFlowStatus === 'STRONG_INFLOW' && (
                      <span className="text-emerald-400 font-extrabold flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" /> High Inflow
                      </span>
                    )}
                    {sec.netFlowStatus === 'MODERATE_INFLOW' && (
                      <span className="text-emerald-300 font-semibold">Inflow</span>
                    )}
                    {sec.netFlowStatus === 'OUTFLOW' && (
                      <span className="text-rose-400 font-semibold">Outflow</span>
                    )}
                    {sec.netFlowStatus === 'NEUTRAL' && (
                      <span className="text-slate-400">Neutral</span>
                    )}
                    <span className="text-slate-400 font-mono text-[8px]">{sec.stocks.length} stocks</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Sector Constituent Stocks Modal/Panel */}
          {selectedSector && (() => {
            const rawStocks = sectors.find(s => s.name === selectedSector)?.stocks || [];
            const sortedSectorStocks = [...rawStocks].sort((a, b) => {
              const aChange = a.priceChangePct || 0;
              const bChange = b.priceChangePct || 0;
              if (sectorStockSortMode === 'GAINERS') return bChange - aChange;
              if (sectorStockSortMode === 'LOSERS') return aChange - bChange;
              if (sectorStockSortMode === 'RVOL') return (b.rvol || 1) - (a.rvol || 1);
              if (sectorStockSortMode === 'NAME') return a.symbol.localeCompare(b.symbol);
              return 0;
            });

            return (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-900 border border-emerald-500/50 shadow-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </span>
                    <div>
                      <h4 className="text-sm font-extrabold text-emerald-400 font-mono uppercase tracking-wider flex items-center gap-2">
                        {selectedSector} HEATMAP
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700 font-extrabold">
                          {sortedSectorStocks.length} Stocks
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Visual heatmap tiles for constituent stocks in {selectedSector} sector
                      </p>
                    </div>
                  </div>

                  {/* Stock Sorting Controls */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono flex-wrap">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                    <span className="text-slate-400 text-[10px] mr-1 hidden sm:inline">Sort:</span>
                    <button
                      onClick={() => setSectorStockSortMode('GAINERS')}
                      className={`px-2 py-0.5 rounded font-extrabold transition-all ${
                        sectorStockSortMode === 'GAINERS' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🚀 Gainers
                    </button>
                    <button
                      onClick={() => setSectorStockSortMode('LOSERS')}
                      className={`px-2 py-0.5 rounded font-extrabold transition-all ${
                        sectorStockSortMode === 'LOSERS' ? 'bg-rose-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🔻 Losers
                    </button>
                    <button
                      onClick={() => setSectorStockSortMode('RVOL')}
                      className={`px-2 py-0.5 rounded font-extrabold transition-all ${
                        sectorStockSortMode === 'RVOL' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ⚡ High RVOL
                    </button>
                    <button
                      onClick={() => setSectorStockSortMode('NAME')}
                      className={`px-2 py-0.5 rounded font-extrabold transition-all ${
                        sectorStockSortMode === 'NAME' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🔤 Name
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedSector(null)}
                    className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800 border border-slate-700 font-bold self-end sm:self-auto"
                  >
                    ✕ Close Heatmap
                  </button>
                </div>

                {/* Heatmap Tile Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                  {sortedSectorStocks.map((st, idx) => {
                    const pct = st.priceChangePct || 0;
                    const isPos = pct >= 0;
                    const isAboveRes = st.isAboveAdrRes;
                    const isBelowSupp = st.isBelowAdrSupp;
                    const rvol = st.rvol || 1.0;

                    let tileStyle = 'bg-slate-950 border-slate-800 text-slate-200';
                    if (isAboveRes) {
                      tileStyle = 'bg-emerald-600 hover:bg-emerald-500 border-emerald-300 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)] ring-1 ring-emerald-300';
                    } else if (isBelowSupp) {
                      tileStyle = 'bg-rose-700 hover:bg-rose-600 border-rose-300 text-white shadow-[0_0_12px_rgba(244,63,94,0.5)] ring-1 ring-rose-300';
                    } else if (pct >= 2.0) {
                      tileStyle = 'bg-emerald-700 hover:bg-emerald-600 border-emerald-400 text-emerald-100 shadow';
                    } else if (pct > 0.01) {
                      tileStyle = 'bg-emerald-950 hover:bg-emerald-900 border-emerald-800 text-emerald-300';
                    } else if (pct <= -2.0) {
                      tileStyle = 'bg-rose-800 hover:bg-rose-700 border-rose-400 text-rose-100 shadow';
                    } else if (pct < -0.01) {
                      tileStyle = 'bg-rose-950 hover:bg-rose-900 border-rose-800 text-rose-300';
                    }

                    return (
                      <div
                        key={`${st.symbol}_${selectedSector || 'all'}_${idx}`}
                        onClick={() => onOpenChartModal ? onOpenChartModal(st.symbol) : onSelectSymbolForChart(st.symbol)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all transform hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between min-h-[82px] group relative overflow-hidden ${tileStyle}`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-mono font-extrabold text-xs uppercase tracking-tight group-hover:underline">
                            {st.symbol.replace('.NS', '')}
                          </span>
                          <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded ${
                            isPos ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' : 'bg-rose-950 text-rose-300 border border-rose-500/50'
                          }`}>
                            {isPos ? '+' : ''}{pct.toFixed(2)}%
                          </span>
                        </div>

                        <div className="my-1 flex items-baseline justify-between">
                          <span className="font-mono text-xs font-bold block">
                            ₹{st.latestPrice > 0 ? st.latestPrice.toFixed(2) : '--'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[9px] font-mono pt-1 border-t border-black/20">
                          {isAboveRes ? (
                            <span className="bg-amber-400 text-slate-950 px-1 py-0.2 rounded font-extrabold">
                              ⚡ &gt; ADR Res
                            </span>
                          ) : isBelowSupp ? (
                            <span className="bg-cyan-400 text-slate-950 px-1 py-0.2 rounded font-extrabold">
                              🛡️ &lt; ADR Supp
                            </span>
                          ) : (
                            <span className="opacity-75">ADR Range</span>
                          )}

                          {rvol >= 1.3 && (
                            <span className="bg-amber-300 text-slate-950 px-1 py-0.2 rounded font-black shrink-0">
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
          })()}
        </div>
      )}
    </div>
  );
}
