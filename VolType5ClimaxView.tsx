import React, { useState, useEffect } from 'react';
import { Candle, DailyLevel, UniverseType } from '../types';
import { calculateDailyLevels } from '../strategyEngine';
import { calculateVolCandles, VolCandleInfo } from '../utils/volCandle4Types';
import { UniverseSelector } from './UniverseSelector';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  Search,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  Eye,
  X,
  Crosshair,
  BarChart3,
  Sliders,
  AlertCircle,
  Flame,
} from 'lucide-react';

interface VolType5ClimaxViewProps {
  timeframe: '5m' | '15m';
  setTimeframe: (tf: '5m' | '15m') => void;
  universe: UniverseType;
  setUniverse?: (u: UniverseType) => void;
  onSelectSymbolForChart: (sym: string) => void;
  onOpenChartModal?: (sym: string) => void;
  initialSubTab?: 'ALL' | 'BULLISH' | 'BEARISH';
}

export interface ClimaxStockItem {
  symbol: string;
  name: string;
  ltp: number;
  todaysOpen: number;
  priceChangePct: number;
  type: 'BULLISH_CLIMAX' | 'BEARISH_CLIMAX';
  timestamp: string; // ISO or formatted date time e.g., 2026-08-12 09:15
  time15mStr: string; // e.g. "09:15 - 09:30"
  c15m: Candle;
  c15mVolInfo: VolCandleInfo;
  adr14: number;
  resistance: number;
  support: number;
  adrBreakPct: number; // e.g. +1.4% above Resistance or -1.2% below Support
  targetPrice: number;
  stopLossPrice: number;
  volRatio: number; // volume surge vs 14 EMA volume
  intradayCandles: Candle[];
  dailyCandles: Candle[];
  dailyLevel: DailyLevel;
}

export const VolType5ClimaxView: React.FC<VolType5ClimaxViewProps> = ({
  timeframe,
  setTimeframe,
  universe,
  setUniverse,
  onSelectSymbolForChart,
  onOpenChartModal,
  initialSubTab = 'ALL',
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [subTab, setSubTab] = useState<'ALL' | 'BULLISH' | 'BEARISH'>(initialSubTab);
  const [volFactor, setVolFactor] = useState<number>(1.5); // Default 1.5x Vol EMA threshold for climax
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bullishClimaxItems, setBullishClimaxItems] = useState<ClimaxStockItem[]>([]);
  const [bearishClimaxItems, setBearishClimaxItems] = useState<ClimaxStockItem[]>([]);
  const [selectedStockForPopup, setSelectedStockForPopup] = useState<ClimaxStockItem | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  const fetchAndAnalyzeClimaxStocks = async () => {
    setLoading(true);
    try {
      // Fetch 15m intraday candles specifically for 1st 15m Climax Candle Strategy
      const res = await fetch(`/api/stock-scanner-data?universe=${universe}&interval=15m`);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data = await res.json();

      const bullList: ClimaxStockItem[] = [];
      const bearList: ClimaxStockItem[] = [];

      for (const item of data.items || []) {
        const symbol = item.symbol;
        const name = item.name || symbol.replace('.NS', '');
        const intradayCandles: Candle[] = item.intradayCandles || [];
        const dailyCandles: Candle[] = item.dailyCandles || [];

        if (intradayCandles.length < 1 || dailyCandles.length < 3) continue;

        // Group 15m candles by date YYYY-MM-DD to find latest trading date
        const dates = Array.from(new Set(intradayCandles.map((c) => c.datetime.substring(0, 10)))).sort();
        const latestDate = dates[dates.length - 1];

        // Intraday 15m candles for latest date
        const todays15m = intradayCandles.filter((c) => c.datetime.substring(0, 10) === latestDate);
        if (todays15m.length === 0) continue;

        // 1st 15-minute candle of the day
        const c1_15m = todays15m[0];

        // Find previous daily candles prior to latestDate
        const prevDaily = dailyCandles.filter((c) => c.datetime.substring(0, 10) < latestDate);
        const previous14Daily = prevDaily.length > 0 ? prevDaily.slice(-14) : dailyCandles.slice(-14);
        const todaysOpen = c1_15m.open;

        // Calculate ADR(14), Resistance, Support
        const dailyLevel = calculateDailyLevels(previous14Daily, todaysOpen, latestDate);
        const { resistance, support, adr14 } = dailyLevel;

        // Calculate Volume Candle classification across all intraday 15m candles to compute proper volume EMA
        const allVolInfos = calculateVolCandles(intradayCandles, { period: 14, volFactor });
        const c1VolInfo = allVolInfos.find((v) => v.candle.datetime === c1_15m.datetime) || allVolInfos[0];
        if (!c1VolInfo) continue;

        const ltp = item.latestPrice || todays15m[todays15m.length - 1].close;
        const priceChangePct = ((ltp - todaysOpen) / todaysOpen) * 100;

        // Volume climax check: volume ratio >= volFactor OR high volume candle type
        const isHighVolClimax = c1VolInfo.volRatio >= volFactor || c1VolInfo.isHighVol || c1VolInfo.type === 'LIGHT_GREEN' || c1VolInfo.type === 'MAROON';
        const timestampIso = c1_15m.datetime;
        
        const format15mTimeWindow = (datetimeStr: string, timestampMs?: number, symStr: string = '') => {
          try {
            const isUs = symStr.includes('AAPL') || symStr.includes('NVDA') || symStr.includes('TSLA') || symStr.includes('SPY') || symStr.includes('MSFT') || symStr.includes('GOOGL') || symStr.includes('AMZN') || symStr.includes('META') || symStr.includes('AMD') || symStr.includes('NFLX');
            const timeZone = isUs ? 'America/New_York' : 'Asia/Kolkata';

            let startDate: Date;
            if (timestampMs && timestampMs > 0) {
              startDate = new Date(timestampMs);
            } else if (datetimeStr) {
              startDate = new Date(datetimeStr);
            } else {
              startDate = new Date();
            }

            if (isNaN(startDate.getTime())) return '09:15 - 09:30';

            const endDate = new Date(startDate.getTime() + 15 * 60 * 1000);

            const t1 = startDate.toLocaleTimeString('en-IN', { timeZone, hour12: false, hour: '2-digit', minute: '2-digit' });
            const t2 = endDate.toLocaleTimeString('en-IN', { timeZone, hour12: false, hour: '2-digit', minute: '2-digit' });
            const dateStr = startDate.toLocaleDateString('en-IN', { timeZone, day: '2-digit', month: 'short' });

            return `${t1} - ${t2} (${dateStr})`;
          } catch {
            return '09:15 - 09:30';
          }
        };

        const formattedTime = format15mTimeWindow(c1_15m.datetime, c1_15m.timestamp, symbol);

        // Check Bullish Climax Condition:
        // 1. 1st 15m candle is Bullish (Close >= Open)
        // 2. 1st 15m candle breaks or reaches near ADR Resistance (High >= Resistance OR Close >= Resistance OR Close >= todaysOpen + adr14 * 0.7)
        // 3. Climax Volume formed (volRatio >= volFactor or High Vol)
        const isBullishCandle = c1_15m.close >= c1_15m.open;
        const isBullishAdrBreak =
          c1_15m.close >= resistance ||
          c1_15m.high >= resistance ||
          c1_15m.close >= todaysOpen + adr14 * 0.7;

        if (isBullishAdrBreak && isBullishCandle && isHighVolClimax) {
          const adrBreakPct = Number((((c1_15m.close - todaysOpen) / adr14) * 100).toFixed(1));
          const targetPrice = Number((c1_15m.close * 1.01).toFixed(2));
          const stopLossPrice = Number((c1_15m.low).toFixed(2));

          bullList.push({
            symbol,
            name,
            ltp,
            todaysOpen,
            priceChangePct,
            type: 'BULLISH_CLIMAX',
            timestamp: timestampIso,
            time15mStr: formattedTime,
            c15m: c1_15m,
            c15mVolInfo: c1VolInfo,
            adr14,
            resistance,
            support,
            adrBreakPct,
            targetPrice,
            stopLossPrice,
            volRatio: c1VolInfo.volRatio,
            intradayCandles: todays15m,
            dailyCandles,
            dailyLevel,
          });
        }

        // Check Bearish Climax Condition:
        // 1. 1st 15m candle is Bearish (Close < Open)
        // 2. 1st 15m candle breaks or reaches near ADR Support (Low <= Support OR Close <= Support OR Close <= todaysOpen - adr14 * 0.7)
        // 3. Climax Volume formed (volRatio >= volFactor or High Vol)
        const isBearishCandle = c1_15m.close < c1_15m.open;
        const isBearishAdrBreak =
          c1_15m.close <= support ||
          c1_15m.low <= support ||
          c1_15m.close <= todaysOpen - adr14 * 0.7;

        if (isBearishAdrBreak && isBearishCandle && isHighVolClimax) {
          const adrBreakPct = Number((((todaysOpen - c1_15m.close) / adr14) * 100).toFixed(1));
          const targetPrice = Number((c1_15m.close * 0.99).toFixed(2));
          const stopLossPrice = Number((c1_15m.high).toFixed(2));

          bearList.push({
            symbol,
            name,
            ltp,
            todaysOpen,
            priceChangePct,
            type: 'BEARISH_CLIMAX',
            timestamp: timestampIso,
            time15mStr: formattedTime,
            c15m: c1_15m,
            c15mVolInfo: c1VolInfo,
            adr14,
            resistance,
            support,
            adrBreakPct,
            targetPrice,
            stopLossPrice,
            volRatio: c1VolInfo.volRatio,
            intradayCandles: todays15m,
            dailyCandles,
            dailyLevel,
          });
        }
      }

      setBullishClimaxItems(bullList);
      setBearishClimaxItems(bearList);
    } catch (err) {
      console.error('Error fetching Vol Type 5 Climax scan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndAnalyzeClimaxStocks();
  }, [universe, volFactor]);

  const filteredBullish = bullishClimaxItems.filter((i) =>
    i.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBearish = bearishClimaxItems.filter((i) =>
    i.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-md text-xs font-mono font-extrabold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                VOLUME TYPE 5 STRATEGY
              </span>
              <h2 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
                1st 15-Min Climax Candle & ADR Breakout Engine
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Filters stocks where the <strong className="text-amber-300">1st 15-minute candle (09:15 - 09:30)</strong> breaks the ADR level with an extreme <strong className="text-lime-300 font-bold">High Volume Climax Candle</strong>.
            </p>
          </div>

          {/* Quick Metrics & Settings */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Bullish Climax: {bullishClimaxItems.length}</span>
            </div>

            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <span>Bearish Climax: {bearishClimaxItems.length}</span>
            </div>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Climax Threshold ({volFactor}x Vol)</span>
            </button>
          </div>
        </div>

        {/* Rule Explanation Banner */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Type 5 Climax Rule:</strong> Candle 1 (09:15 - 09:30) must <strong className="text-emerald-400">Break ADR Resistance/Support</strong> + <strong className="text-lime-300">Climax Volume Surge (≥ {volFactor}x 14 EMA)</strong>.
            </span>
          </div>

          <div className="flex items-center gap-3">
            {setUniverse && (
              <UniverseSelector
                universe={universe}
                setUniverse={setUniverse}
                variant="dropdown"
              />
            )}
            <button
              onClick={fetchAndAnalyzeClimaxStocks}
              disabled={loading}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors font-bold cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Scan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900 p-2.5 rounded-xl border border-slate-800 shadow-md">
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSubTab('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              subTab === 'ALL'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            <span>Show Both Tables ({bullishClimaxItems.length + bearishClimaxItems.length})</span>
          </button>

          <button
            onClick={() => setSubTab('BULLISH')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              subTab === 'BULLISH'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>🟢 Bullish Climax Table ({bullishClimaxItems.length})</span>
          </button>

          <button
            onClick={() => setSubTab('BEARISH')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              subTab === 'BEARISH'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            <span>🔴 Bearish Climax Table ({bearishClimaxItems.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search ticker (e.g. RELIANCE)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-950 text-xs text-slate-200 placeholder-slate-500 pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-16 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-sm font-medium">Scanning 1st 15-minute ADR Breakout & Volume Type 5 Climax candles across {universe}...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* TABLE 1: BULLISH VOL TYPE 5 CLIMAX CANDLES */}
          {(subTab === 'ALL' || subTab === 'BULLISH') && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="bg-emerald-500/20 text-emerald-300 p-1.5 rounded-lg border border-emerald-500/30">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                      <span>🟢 Table 1: Bullish Vol Type 5 Climax Candles</span>
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded border border-emerald-500/40">
                        1st 15m ADR Resistance Breakout
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      1st 15-min Candle (09:15 - 09:30) closed ABOVE ADR Resistance with High Bullish Climax Volume.
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  {filteredBullish.length} Triggered
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto max-h-[500px]">
                {filteredBullish.length === 0 ? (
                  <div className="p-10 text-center text-slate-500 text-xs space-y-2">
                    <ShieldCheck className="w-6 h-6 text-slate-600 mx-auto" />
                    <p>No Bullish 1st 15m Climax ADR Resistance Breakout setups detected right now.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="sticky top-0 z-20 bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800 shadow-md">
                      <tr>
                        <th className="py-2.5 px-3">Symbol</th>
                        <th className="py-2.5 px-3">1st 15m Timestamp</th>
                        <th className="py-2.5 px-3">LTP / Change</th>
                        <th className="py-2.5 px-3">1st 15m Candle (OHLC)</th>
                        <th className="py-2.5 px-3 text-emerald-400">ADR Resistance</th>
                        <th className="py-2.5 px-3 text-lime-300">ADR Breakout %</th>
                        <th className="py-2.5 px-3 text-amber-300">Climax Vol Surge</th>
                        <th className="py-2.5 px-3 text-emerald-400">Target (+1%)</th>
                        <th className="py-2.5 px-3 text-rose-400">Stop Loss</th>
                        <th className="py-2.5 px-3 text-center">Quick View Chart</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {filteredBullish.map((item) => (
                        <tr key={item.symbol} className="hover:bg-slate-800/40 transition-colors">
                          
                          {/* Symbol */}
                          <td className="py-3 px-3">
                            <button
                              onClick={() => onOpenChartModal ? onOpenChartModal(item.symbol) : onSelectSymbolForChart(item.symbol)}
                              className="flex items-center space-x-2 group cursor-pointer text-left"
                              title={`Click to open popup chart for ${item.symbol}`}
                            >
                              <span className="font-extrabold text-emerald-400 text-sm group-hover:underline flex items-center gap-1">
                                {item.symbol}
                                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </span>
                              <span className="text-[10px] bg-lime-500/20 text-lime-300 px-1.5 py-0.5 rounded border border-lime-400 font-sans font-bold">
                                TYPE 5 BULL
                              </span>
                            </button>
                          </td>

                          {/* Timestamp */}
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 bg-slate-950 text-amber-300 px-2 py-0.5 rounded border border-slate-800 text-[11px] font-bold">
                              <Clock className="w-3 h-3 text-amber-400" />
                              {item.time15mStr}
                            </span>
                          </td>

                          {/* LTP & Change % */}
                          <td className="py-3 px-3">
                            <div className="font-bold">₹{item.ltp.toFixed(2)}</div>
                            <div className={`text-[11px] font-bold ${item.priceChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {item.priceChangePct >= 0 ? '+' : ''}{item.priceChangePct.toFixed(2)}%
                            </div>
                          </td>

                          {/* 1st 15m OHLC */}
                          <td className="py-3 px-3">
                            <div className="text-slate-300 text-[11px]">
                              O: ₹{item.c15m.open.toFixed(1)} | H: ₹{item.c15m.high.toFixed(1)}
                            </div>
                            <div className="text-slate-300 text-[11px]">
                              L: ₹{item.c15m.low.toFixed(1)} | <strong className="text-emerald-400">C: ₹{item.c15m.close.toFixed(1)}</strong>
                            </div>
                          </td>

                          {/* ADR Resistance */}
                          <td className="py-3 px-3 text-emerald-400 font-bold">
                            <div>₹{item.resistance.toFixed(2)}</div>
                            <div className="text-[10px] text-slate-400 font-normal">ADR: ₹{item.adr14.toFixed(2)}</div>
                          </td>

                          {/* ADR Break % */}
                          <td className="py-3 px-3">
                            <span className="bg-lime-500/20 text-lime-300 border border-lime-400/60 px-2 py-0.5 rounded font-extrabold text-[11px]">
                              +{item.adrBreakPct}% Above
                            </span>
                          </td>

                          {/* Vol Ratio Surge */}
                          <td className="py-3 px-3">
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-black text-[11px] flex items-center gap-1 w-fit">
                              <Zap className="w-3 h-3 text-amber-400" />
                              {item.volRatio.toFixed(1)}x Vol EMA
                            </span>
                          </td>

                          {/* Target */}
                          <td className="py-3 px-3 text-emerald-400 font-extrabold">
                            ₹{item.targetPrice.toFixed(2)}
                          </td>

                          {/* Stop Loss */}
                          <td className="py-3 px-3 text-rose-400 font-semibold">
                            ₹{item.stopLossPrice.toFixed(2)}
                          </td>

                          {/* Quick View Chart Popup Button */}
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => onOpenChartModal ? onOpenChartModal(item.symbol) : onSelectSymbolForChart(item.symbol)}
                              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all shadow hover:scale-105 cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Quick View Chart</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TABLE 2: BEARISH VOL TYPE 5 CLIMAX CANDLES */}
          {(subTab === 'ALL' || subTab === 'BEARISH') && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="bg-rose-500/20 text-rose-300 p-1.5 rounded-lg border border-rose-500/30">
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                      <span>🔴 Table 2: Bearish Vol Type 5 Climax Candles</span>
                      <span className="bg-rose-500/20 text-rose-300 text-[10px] px-2 py-0.5 rounded border border-rose-500/40">
                        1st 15m ADR Support Breakdown
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      1st 15-min Candle (09:15 - 09:30) closed BELOW ADR Support with Heavy Bearish Maroon Climax Volume.
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20">
                  {filteredBearish.length} Triggered
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto max-h-[500px]">
                {filteredBearish.length === 0 ? (
                  <div className="p-10 text-center text-slate-500 text-xs space-y-2">
                    <ShieldCheck className="w-6 h-6 text-slate-600 mx-auto" />
                    <p>No Bearish 1st 15m Climax ADR Support Breakdown setups detected right now.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="sticky top-0 z-20 bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800 shadow-md">
                      <tr>
                        <th className="py-2.5 px-3">Symbol</th>
                        <th className="py-2.5 px-3">1st 15m Timestamp</th>
                        <th className="py-2.5 px-3">LTP / Change</th>
                        <th className="py-2.5 px-3">1st 15m Candle (OHLC)</th>
                        <th className="py-2.5 px-3 text-rose-400">ADR Support</th>
                        <th className="py-2.5 px-3 text-rose-300">ADR Breakdown %</th>
                        <th className="py-2.5 px-3 text-amber-300">Climax Vol Surge</th>
                        <th className="py-2.5 px-3 text-rose-400">Target (-1%)</th>
                        <th className="py-2.5 px-3 text-emerald-400">Stop Loss</th>
                        <th className="py-2.5 px-3 text-center">Quick View Chart</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {filteredBearish.map((item) => (
                        <tr key={item.symbol} className="hover:bg-slate-800/40 transition-colors">
                          
                          {/* Symbol */}
                          <td className="py-3 px-3">
                            <button
                              onClick={() => onOpenChartModal ? onOpenChartModal(item.symbol) : onSelectSymbolForChart(item.symbol)}
                              className="flex items-center space-x-2 group cursor-pointer text-left"
                              title={`Click to open popup chart for ${item.symbol}`}
                            >
                              <span className="font-extrabold text-rose-400 text-sm group-hover:underline flex items-center gap-1">
                                {item.symbol}
                                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </span>
                              <span className="text-[10px] bg-rose-950 text-rose-300 px-1.5 py-0.5 rounded border border-rose-700 font-sans font-bold">
                                TYPE 5 BEAR
                              </span>
                            </button>
                          </td>

                          {/* Timestamp */}
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 bg-slate-950 text-amber-300 px-2 py-0.5 rounded border border-slate-800 text-[11px] font-bold">
                              <Clock className="w-3 h-3 text-amber-400" />
                              {item.time15mStr}
                            </span>
                          </td>

                          {/* LTP & Change % */}
                          <td className="py-3 px-3">
                            <div className="font-bold">₹{item.ltp.toFixed(2)}</div>
                            <div className={`text-[11px] font-bold ${item.priceChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {item.priceChangePct >= 0 ? '+' : ''}{item.priceChangePct.toFixed(2)}%
                            </div>
                          </td>

                          {/* 1st 15m OHLC */}
                          <td className="py-3 px-3">
                            <div className="text-slate-300 text-[11px]">
                              O: ₹{item.c15m.open.toFixed(1)} | H: ₹{item.c15m.high.toFixed(1)}
                            </div>
                            <div className="text-slate-300 text-[11px]">
                              L: ₹{item.c15m.low.toFixed(1)} | <strong className="text-rose-400">C: ₹{item.c15m.close.toFixed(1)}</strong>
                            </div>
                          </td>

                          {/* ADR Support */}
                          <td className="py-3 px-3 text-rose-400 font-bold">
                            <div>₹{item.support.toFixed(2)}</div>
                            <div className="text-[10px] text-slate-400 font-normal">ADR: ₹{item.adr14.toFixed(2)}</div>
                          </td>

                          {/* ADR Breakdown % */}
                          <td className="py-3 px-3">
                            <span className="bg-rose-950 text-rose-300 border border-rose-700 px-2 py-0.5 rounded font-extrabold text-[11px]">
                              -{item.adrBreakPct}% Below
                            </span>
                          </td>

                          {/* Vol Ratio Surge */}
                          <td className="py-3 px-3">
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-black text-[11px] flex items-center gap-1 w-fit">
                              <Zap className="w-3 h-3 text-amber-400" />
                              {item.volRatio.toFixed(1)}x Vol EMA
                            </span>
                          </td>

                          {/* Target */}
                          <td className="py-3 px-3 text-rose-400 font-extrabold">
                            ₹{item.targetPrice.toFixed(2)}
                          </td>

                          {/* Stop Loss */}
                          <td className="py-3 px-3 text-emerald-400 font-semibold">
                            ₹{item.stopLossPrice.toFixed(2)}
                          </td>

                          {/* Quick View Chart Popup Button */}
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => onOpenChartModal ? onOpenChartModal(item.symbol) : onSelectSymbolForChart(item.symbol)}
                              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all shadow hover:scale-105 cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5 text-rose-400" />
                              <span>Quick View Chart</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* QUICK VIEW CHART MODAL POPUP */}
      {selectedStockForPopup && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-4xl w-full p-5 shadow-2xl space-y-4 relative my-auto">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-xl border ${
                  selectedStockForPopup.type === 'BULLISH_CLIMAX'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-slate-100 font-mono">
                      {selectedStockForPopup.symbol}
                    </h3>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-sans font-bold border ${
                      selectedStockForPopup.type === 'BULLISH_CLIMAX'
                        ? 'bg-lime-500/20 text-lime-300 border-lime-400'
                        : 'bg-rose-950 text-rose-300 border-rose-700'
                    }`}>
                      {selectedStockForPopup.type === 'BULLISH_CLIMAX' ? '🟢 BULLISH CLIMAX (1st 15m)' : '🔴 BEARISH CLIMAX (1st 15m)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                    <span>1st 15m Time: <strong>{selectedStockForPopup.time15mStr}</strong></span>
                    <span>•</span>
                    <span>LTP: <strong className="text-slate-200">₹{selectedStockForPopup.ltp.toFixed(2)}</strong></span>
                    <span>({selectedStockForPopup.priceChangePct >= 0 ? '+' : ''}{selectedStockForPopup.priceChangePct.toFixed(2)}%)</span>
                  </p>
                </div>
              </div>

              {/* Close & Full Chart Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const sym = selectedStockForPopup.symbol;
                    setSelectedStockForPopup(null);
                    onSelectSymbolForChart(sym);
                  }}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Full Interactive Chart</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setSelectedStockForPopup(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 p-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Metrics Quick Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Today's Open</span>
                <span className="font-bold text-slate-100">₹{selectedStockForPopup.todaysOpen.toFixed(2)}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">ADR Value</span>
                <span className="font-bold text-slate-100">₹{selectedStockForPopup.adr14.toFixed(2)}</span>
              </div>
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
                <span className="text-emerald-400 block text-[10px] font-bold">ADR Resistance</span>
                <span className="font-extrabold text-emerald-300">₹{selectedStockForPopup.resistance.toFixed(2)}</span>
              </div>
              <div className="bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30">
                <span className="text-rose-400 block text-[10px] font-bold">ADR Support</span>
                <span className="font-extrabold text-rose-300">₹{selectedStockForPopup.support.toFixed(2)}</span>
              </div>
            </div>

            {/* Quick View Interactive SVG Candlestick Chart */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800/80 pb-2">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Intraday 15m Price & Volume Chart (1st 15m Climax Highlighted)
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-emerald-400 inline-block"></span> Resistance
                  </span>
                  <span className="text-rose-400 flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-rose-400 inline-block"></span> Support
                  </span>
                </div>
              </div>

              {/* Chart SVG */}
              {(() => {
                const candles = selectedStockForPopup.intradayCandles;
                const chartHeight = 220;
                const chartWidth = 760;

                let minP = Math.min(...candles.map((c) => c.low), selectedStockForPopup.support * 0.995);
                let maxP = Math.max(...candles.map((c) => c.high), selectedStockForPopup.resistance * 1.005);
                const rangeP = maxP - minP || 1;

                const getY = (p: number) => chartHeight - ((p - minP) / rangeP) * chartHeight;

                const maxVol = Math.max(...candles.map((c) => c.volume || 1));

                return (
                  <div className="relative w-full overflow-hidden">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 60}`} className="w-full h-64 overflow-visible">
                      
                      {/* Grid / Level lines */}
                      <line
                        x1="0"
                        y1={getY(selectedStockForPopup.resistance)}
                        x2={chartWidth}
                        y2={getY(selectedStockForPopup.resistance)}
                        stroke="#10b981"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={chartWidth - 110}
                        y={getY(selectedStockForPopup.resistance) - 4}
                        fill="#10b981"
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        Res: ₹{selectedStockForPopup.resistance.toFixed(2)}
                      </text>

                      <line
                        x1="0"
                        y1={getY(selectedStockForPopup.support)}
                        x2={chartWidth}
                        y2={getY(selectedStockForPopup.support)}
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={chartWidth - 110}
                        y={getY(selectedStockForPopup.support) + 12}
                        fill="#f43f5e"
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        Supp: ₹{selectedStockForPopup.support.toFixed(2)}
                      </text>

                      {/* Render Candlesticks */}
                      {candles.map((c, i) => {
                        const stepX = chartWidth / (candles.length || 1);
                        const x = i * stepX + stepX / 2;
                        const candleW = Math.max(3, stepX * 0.6);

                        const yO = getY(c.open);
                        const yC = getY(c.close);
                        const yH = getY(c.high);
                        const yL = getY(c.low);

                        const isFirst = i === 0;
                        const isBull = c.close >= c.open;

                        let color = isBull ? '#10b981' : '#ef4444';
                        if (isFirst) {
                          color = selectedStockForPopup.type === 'BULLISH_CLIMAX' ? '#00FF74' : '#f43f5e';
                        }

                        // Volume Bar (at bottom)
                        const volH = Math.max(4, (c.volume / maxVol) * 45);
                        const yVol = chartHeight + 55 - volH;

                        return (
                          <g key={c.datetime}>
                            {/* Climax Highlight background on 1st candle */}
                            {isFirst && (
                              <rect
                                x={x - candleW * 1.5}
                                y={0}
                                width={candleW * 3}
                                height={chartHeight + 60}
                                fill={selectedStockForPopup.type === 'BULLISH_CLIMAX' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(244, 63, 94, 0.15)'}
                                rx="4"
                              />
                            )}

                            {/* Candle Wick */}
                            <line x1={x} y1={yH} x2={x} y2={yL} stroke={color} strokeWidth="1.5" />

                            {/* Candle Body */}
                            <rect
                              x={x - candleW / 2}
                              y={Math.min(yO, yC)}
                              width={candleW}
                              height={Math.max(2, Math.abs(yC - yO))}
                              fill={color}
                              rx="1"
                            />

                            {/* Volume Bar */}
                            <rect
                              x={x - candleW / 2}
                              y={yVol}
                              width={candleW}
                              height={volH}
                              fill={isFirst ? (selectedStockForPopup.type === 'BULLISH_CLIMAX' ? '#22c55e' : '#f43f5e') : (isBull ? '#065f46' : '#881337')}
                              opacity={isFirst ? 1 : 0.6}
                            />

                            {/* 1st 15m Climax Marker Badge */}
                            {isFirst && (
                              <g>
                                <rect
                                  x={x - 45}
                                  y={yH - 24}
                                  width="90"
                                  height="18"
                                  rx="4"
                                  fill={selectedStockForPopup.type === 'BULLISH_CLIMAX' ? '#00FF74' : '#f43f5e'}
                                />
                                <text
                                  x={x}
                                  y={yH - 12}
                                  textAnchor="middle"
                                  fill="#020617"
                                  fontSize="9"
                                  fontFamily="sans-serif"
                                  fontWeight="900"
                                >
                                  ⚡ CLIMAX (09:15)
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                );
              })()}
            </div>

            {/* 1st 15m Candle OHLCV Breakdown Footer */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center space-x-3">
                <span className="text-amber-400 font-bold">1st 15m Candle Details:</span>
                <span>Open: <strong>₹{selectedStockForPopup.c15m.open.toFixed(2)}</strong></span>
                <span>High: <strong>₹{selectedStockForPopup.c15m.high.toFixed(2)}</strong></span>
                <span>Low: <strong>₹{selectedStockForPopup.c15m.low.toFixed(2)}</strong></span>
                <span>Close: <strong>₹{selectedStockForPopup.c15m.close.toFixed(2)}</strong></span>
              </div>
              <div className="bg-amber-500/10 text-amber-300 px-2.5 py-0.5 rounded border border-amber-500/20 font-extrabold">
                Volume Surge: {selectedStockForPopup.volRatio.toFixed(1)}x 14 EMA
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-slate-100">
                  Climax Volume Sensitivity
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-200 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Climax Volume Factor (1.50 = 150% of 14 EMA):
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="5.0"
                  value={volFactor}
                  onChange={(e) => setVolFactor(parseFloat(e.target.value) || 1.5)}
                  className="bg-slate-950 border border-slate-700 text-slate-100 px-3 py-1.5 rounded w-full font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setVolFactor(1.5)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Reset (1.5x)
              </button>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1.5 rounded text-xs transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
