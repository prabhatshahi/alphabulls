import React, { useState, useEffect } from 'react';
import { Candle, DailyLevel, Signal, UniverseType } from '../types';
import { calculateDailyLevels, checkSignalCondition } from '../strategyEngine';
import { calculateVolCandles } from '../utils/volCandle4Types';
import { UniverseSelector } from './UniverseSelector';
import { getNseStocksByUniverse } from '../constants/allNseStocks';
import { RefreshCw, AlertCircle, ArrowUpRight, ArrowDownRight, Layers, Crosshair, Zap, BarChart2, TrendingUp, TrendingDown, Sliders, ArrowLeft, ChevronDown } from 'lucide-react';

interface ChartAnalysisViewProps {
  selectedSymbol: string;
  timeframe: '5m' | '15m';
  setTimeframe?: (tf: '5m' | '15m') => void;
  universe?: UniverseType;
  setUniverse?: (u: UniverseType) => void;
  onGoBack?: () => void;
  previousTabName?: string;
}

export const ChartAnalysisView: React.FC<ChartAnalysisViewProps> = ({
  selectedSymbol,
  timeframe: initialTimeframe,
  setTimeframe,
  universe = 'NIFTY_FNO',
  setUniverse,
  onGoBack,
  previousTabName,
}) => {
  const [symbol, setSymbol] = useState<string>(selectedSymbol || 'RELIANCE.NS');
  const [currentTimeframe, setCurrentTimeframe] = useState<'5m' | '15m'>(initialTimeframe || '15m');
  const [dailyCandles, setDailyCandles] = useState<Candle[]>([]);
  const [intradayCandles, setIntradayCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showVol4TypesOverlay, setShowVol4TypesOverlay] = useState<boolean>(true);
  const [showVolumeProfile, setShowVolumeProfile] = useState<boolean>(true);

  useEffect(() => {
    if (selectedSymbol) {
      setSymbol(selectedSymbol);
    }
  }, [selectedSymbol]);

  useEffect(() => {
    if (initialTimeframe) {
      setCurrentTimeframe(initialTimeframe);
    }
  }, [initialTimeframe]);

  const handleTimeframeChange = (tf: '5m' | '15m') => {
    setCurrentTimeframe(tf);
    if (setTimeframe) {
      setTimeframe(tf);
    }
  };

  const loadStockData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stock-data?symbol=${encodeURIComponent(symbol)}&interval=${currentTimeframe}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();

      setDailyCandles(data.dailyCandles || []);
      setIntradayCandles(data.intradayCandles || []);

      // Auto pick latest available intraday trading date
      const dates = Array.from(
        new Set((data.intradayCandles || []).map((c: Candle) => c.datetime.substring(0, 10)))
      ).sort() as string[];

      if (dates.length > 0) {
        setSelectedDate(dates[dates.length - 1]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load stock candles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStockData();
  }, [symbol, currentTimeframe]);

  // Extract available intraday dates
  const availableDates = Array.from(
    new Set(intradayCandles.map((c) => c.datetime.substring(0, 10)))
  ).sort() as string[];

  // Filter intraday candles for selected date
  const todaysCandles = intradayCandles.filter(
    (c) => c.datetime.substring(0, 10) === selectedDate
  );

  // Calculate Daily Levels & Multi-Day / Previous Day Range for selected date
  let dailyLevel: DailyLevel | null = null;
  let avgVol10d = 0;
  let pdh = 0;
  let pdl = 0;
  let pdc = 0;
  let daysHighBroken = 0;
  let daysLowBroken = 0;
  let pdRangeText = '';
  let pdRangeStatus: 'ABOVE_PDH' | 'BELOW_PDL' | 'INSIDE_PD_RANGE' = 'INSIDE_PD_RANGE';

  if (selectedDate && dailyCandles.length >= 15 && todaysCandles.length > 0) {
    const prevDaily = dailyCandles.filter((c) => c.datetime.substring(0, 10) < selectedDate);
    if (prevDaily.length >= 14) {
      const previous14Daily = prevDaily.slice(-14);
      const todaysOpen = todaysCandles[0].open;
      dailyLevel = calculateDailyLevels(previous14Daily, todaysOpen, selectedDate);

      // Average Daily Volume over last 10 days
      const last10Daily = prevDaily.slice(-10);
      avgVol10d = last10Daily.reduce((acc, c) => acc + (c.volume || 0), 0) / last10Daily.length;

      // Multi-Day & PD Range
      const lastDaily = prevDaily[prevDaily.length - 1];
      pdh = Number(lastDaily.high.toFixed(2));
      pdl = Number(lastDaily.low.toFixed(2));
      pdc = Number(lastDaily.close.toFixed(2));

      const latestPrice = todaysCandles[todaysCandles.length - 1].close;
      const prevDailyReversed = [...prevDaily].reverse();

      for (const c of prevDailyReversed) {
        if (latestPrice > c.high) daysHighBroken++;
        else break;
      }

      for (const c of prevDailyReversed) {
        if (latestPrice < c.low) daysLowBroken++;
        else break;
      }

      if (latestPrice > pdh) {
        pdRangeStatus = 'ABOVE_PDH';
        const abovePct = (((latestPrice - pdh) / pdh) * 100).toFixed(2);
        if (daysHighBroken >= 2) {
          pdRangeText = `🔥 Broke ${daysHighBroken}-Day High (+${abovePct}% above PDH ₹${pdh})`;
        } else {
          pdRangeText = `🟢 Broke PDH ₹${pdh} (+${abovePct}%)`;
        }
      } else if (latestPrice < pdl) {
        pdRangeStatus = 'BELOW_PDL';
        const belowPct = (((pdl - latestPrice) / pdl) * 100).toFixed(2);
        if (daysLowBroken >= 2) {
          pdRangeText = `🔻 Broke ${daysLowBroken}-Day Low (-${belowPct}% below PDL ₹${pdl})`;
        } else {
          pdRangeText = `🔴 Broke PDL ₹${pdl} (-${belowPct}%)`;
        }
      } else {
        pdRangeStatus = 'INSIDE_PD_RANGE';
        const span = pdh - pdl;
        const posPct = span > 0 ? Math.round(((latestPrice - pdl) / span) * 100) : 50;
        pdRangeText = `↔️ Inside PD Range (PDL ₹${pdl} - PDH ₹${pdh}) • ${posPct}% of Range`;
      }
    }
  }

  // Expected volume per candle (15m -> 25 candles/day, 5m -> 75 candles/day)
  const expectedCandlesPerDay = currentTimeframe === '15m' ? 25 : 75;
  const avgCandleVol = avgVol10d > 0
    ? avgVol10d / expectedCandlesPerDay
    : (todaysCandles.reduce((acc, c) => acc + (c.volume || 0), 0) / (todaysCandles.length || 1));

  const formatVol = (num: number) => {
    const abs = Math.abs(num);
    if (abs >= 10000000) return `${(num / 10000000).toFixed(2)}Cr`;
    if (abs >= 100000) return `${(num / 100000).toFixed(2)}L`;
    if (abs >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (abs >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  // Calculate Candle Signals & Volume Order Flow Metrics (RVOL, Buys vs Sells, CCVD)
  const candleAnalysis: Array<{
    candle: Candle;
    prevClose: number;
    signal: 'BUY' | 'SELL' | 'NONE';
    state: string;
    rvol: number;
    buyVol: number;
    sellVol: number;
    buyPct: number;
    sellPct: number;
    delta: number;
    ccvd: number;
  }> = [];

  if (dailyLevel && todaysCandles.length > 0) {
    let state: 'NEUTRAL' | 'ABOVE_RES' | 'BELOW_SUPP' = 'NEUTRAL';
    let runningCvd = 0;

    for (let i = 0; i < todaysCandles.length; i++) {
      const c = todaysCandles[i];
      const prevClose = i > 0 ? todaysCandles[i - 1].close : c.open;

      const { signal, nextState } = checkSignalCondition(
        prevClose,
        c.close,
        dailyLevel.resistance,
        dailyLevel.support,
        state
      );

      // Volume & Delta calculations for this closed candle
      const vol = c.volume || 0;
      const range = c.high - c.low;
      let buyRatio = 0.5;
      let sellRatio = 0.5;

      if (range > 0) {
        buyRatio = (c.close - c.low) / range;
        sellRatio = (c.high - c.close) / range;
      } else if (c.close > c.open) {
        buyRatio = 1.0;
        sellRatio = 0.0;
      } else if (c.close < c.open) {
        buyRatio = 0.0;
        sellRatio = 1.0;
      }

      const buyVol = Math.round(vol * buyRatio);
      const sellVol = Math.round(vol * sellRatio);
      const delta = buyVol - sellVol;
      runningCvd += delta;

      const rvol = avgCandleVol > 0 ? Number((vol / avgCandleVol).toFixed(2)) : 1.0;
      const buyPct = vol > 0 ? Math.round((buyVol / vol) * 100) : 50;
      const sellPct = vol > 0 ? Math.round((sellVol / vol) * 100) : 50;

      state = nextState;
      candleAnalysis.push({
        candle: c,
        prevClose,
        signal,
        state,
        rvol,
        buyVol,
        sellVol,
        buyPct,
        sellPct,
        delta,
        ccvd: runningCvd,
      });
    }
  }

  // SVG Chart Dimensions
  const chartHeight = 240;
  const chartWidth = 800;

  let minPrice = Math.min(...todaysCandles.map((c) => c.low));
  let maxPrice = Math.max(...todaysCandles.map((c) => c.high));

  if (dailyLevel) {
    minPrice = Math.min(minPrice, dailyLevel.support * 0.995);
    maxPrice = Math.max(maxPrice, dailyLevel.resistance * 1.005);
  }

  const priceRange = maxPrice - minPrice || 1;

  const getY = (price: number) => {
    return chartHeight - ((price - minPrice) / priceRange) * chartHeight;
  };

  // Calculate Volume Profile Bins (VPVR) across Session
  const NUM_VP_BINS = 22;
  interface VpBin {
    binIdx: number;
    priceLow: number;
    priceHigh: number;
    priceMid: number;
    buyVol: number;
    sellVol: number;
    totalVol: number;
  }

  const vpBins: VpBin[] = [];
  let pocBin: VpBin | null = null;
  let vahPrice = 0;
  let valPrice = 0;
  let totalSessionVol = 0;
  let maxBinVol = 0;

  if (todaysCandles.length > 0 && priceRange > 0) {
    const binStep = priceRange / NUM_VP_BINS;

    for (let b = 0; b < NUM_VP_BINS; b++) {
      const pLow = minPrice + b * binStep;
      const pHigh = minPrice + (b + 1) * binStep;
      vpBins.push({
        binIdx: b,
        priceLow: pLow,
        priceHigh: pHigh,
        priceMid: (pLow + pHigh) / 2,
        buyVol: 0,
        sellVol: 0,
        totalVol: 0
      });
    }

    for (let i = 0; i < todaysCandles.length; i++) {
      const c = todaysCandles[i];
      const ca = candleAnalysis[i];
      const bVol = ca ? ca.buyVol : (c.close >= c.open ? c.volume || 0 : 0);
      const sVol = ca ? ca.sellVol : (c.close < c.open ? c.volume || 0 : 0);
      const cLow = c.low;
      const cHigh = c.high;

      const binsInSpan = vpBins.filter(b => b.priceHigh >= cLow && b.priceLow <= cHigh);
      const count = binsInSpan.length || 1;

      for (const bin of binsInSpan) {
        bin.buyVol += bVol / count;
        bin.sellVol += sVol / count;
        bin.totalVol += (bVol + sVol) / count;
        totalSessionVol += (bVol + sVol) / count;
      }
    }

    for (const bin of vpBins) {
      if (bin.totalVol > maxBinVol) {
        maxBinVol = bin.totalVol;
        pocBin = bin;
      }
    }

    if (pocBin && totalSessionVol > 0) {
      const targetValVol = totalSessionVol * 0.70;
      let accumulatedVol = pocBin.totalVol;
      let lowIdx = pocBin.binIdx;
      let highIdx = pocBin.binIdx;

      while (accumulatedVol < targetValVol && (lowIdx > 0 || highIdx < vpBins.length - 1)) {
        const nextLowVol = lowIdx > 0 ? vpBins[lowIdx - 1].totalVol : -1;
        const nextHighVol = highIdx < vpBins.length - 1 ? vpBins[highIdx + 1].totalVol : -1;

        if (nextHighVol >= nextLowVol && nextHighVol >= 0) {
          highIdx++;
          accumulatedVol += vpBins[highIdx].totalVol;
        } else if (nextLowVol >= 0) {
          lowIdx--;
          accumulatedVol += vpBins[lowIdx].totalVol;
        } else {
          break;
        }
      }

      vahPrice = vpBins[highIdx].priceHigh;
      valPrice = vpBins[lowIdx].priceLow;
    }
  }

  // Top High Volume Nodes (HVN)
  const hvnBins = [...vpBins].sort((a, b) => b.totalVol - a.totalVol).slice(0, 3);

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-mono transition-all shadow-[0_0_12px_rgba(16,185,129,0.25)] active:scale-95 cursor-pointer shrink-0"
              title={`Return to ${previousTabName || 'Previous Screen'}`}
            >
              <ArrowLeft className="w-4 h-4 stroke-[3]" />
              <span>Back to {previousTabName || 'Previous Screen'}</span>
            </button>
          )}

          <div className="flex items-center space-x-2 sm:space-x-3">
            <Crosshair className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h2 className="text-sm sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Chart Analysis</span>
                <span className="bg-emerald-500/20 text-emerald-400 font-mono text-[11px] px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                  {symbol}
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 hidden sm:block">
                Visualizes ADR Resistance & Support levels alongside confirmed breakout candles.
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Stock Universe Selector */}
          {setUniverse && (
            <UniverseSelector
              universe={universe}
              setUniverse={setUniverse}
              variant="dropdown"
            />
          )}

          {/* Quick Stock Selector from Universe */}
          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-700 px-2 py-1 rounded-lg">
            <span className="text-xs text-slate-400 font-mono">Stock:</span>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-emerald-300 font-mono font-bold text-xs rounded-md px-2 py-1 focus:outline-none max-w-[140px]"
            >
              <option value={symbol}>{symbol} (Current)</option>
              {getNseStocksByUniverse(universe).slice(0, 100).map((st) => (
                st !== symbol && <option key={st} value={st}>{st.replace('.NS', '')}</option>
              ))}
            </select>
          </div>

          {/* Timeframe Selector Options: 5 Min & 15 Min */}
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-700 p-1 rounded-lg">
            <span className="text-xs text-slate-400 px-1 font-medium">Timeframe:</span>
            <button
              onClick={() => handleTimeframeChange('5m')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                currentTimeframe === '5m'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              5 Min
            </button>
            <button
              onClick={() => handleTimeframeChange('15m')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                currentTimeframe === '15m'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              15 Min
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Custom Ticker:</span>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g. TCS.NS"
              className="bg-slate-950 border border-slate-700 text-slate-100 font-mono font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 w-28"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Date:</span>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              {availableDates.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Volume Profile (VPVR) Toggle */}
          <button
            onClick={() => setShowVolumeProfile(!showVolumeProfile)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              showVolumeProfile
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle Volume Profile Visible Range (VPVR) S/R Overlay"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Volume Profile (VPVR)</span>
          </button>

          {/* Volume Candle Strategy Overlay Toggle */}
          <button
            onClick={() => setShowVol4TypesOverlay(!showVol4TypesOverlay)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              showVol4TypesOverlay
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Vol Strategy</span>
          </button>

          <button
            onClick={loadStockData}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl flex items-center space-x-3 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-16 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-400" />
          <p className="text-sm font-medium">Loading candles for {symbol}...</p>
        </div>
      ) : dailyLevel && todaysCandles.length > 0 ? (
        <>
          {/* Level Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 block">Today's Open</span>
              <p className="text-lg font-bold text-slate-100 font-mono">₹{dailyLevel.open.toFixed(2)}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 block">ADR Value</span>
              <p className="text-lg font-bold text-slate-100 font-mono">₹{dailyLevel.adr14.toFixed(2)}</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl">
              <span className="text-xs text-emerald-400 block font-semibold">Fixed Resistance</span>
              <p className="text-lg font-bold text-emerald-400 font-mono">₹{dailyLevel.resistance.toFixed(2)}</p>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl">
              <span className="text-xs text-rose-400 block font-semibold">Fixed Support</span>
              <p className="text-lg font-bold text-rose-400 font-mono">₹{dailyLevel.support.toFixed(2)}</p>
            </div>
          </div>

          {/* Previous Day Range & Multi-Day Breakout Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Prev Day High (PDH)</span>
                <p className="text-base font-bold text-slate-200 font-mono">₹{pdh.toFixed(2)}</p>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                Resistance
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Prev Day Low (PDL)</span>
                <p className="text-base font-bold text-slate-200 font-mono">₹{pdl.toFixed(2)}</p>
              </div>
              <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-bold">
                Support
              </span>
            </div>
            <div className="bg-slate-900 border border-purple-500/30 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-purple-300 block font-semibold">Multi-Day & PD Status</span>
                <p className="text-xs font-extrabold text-slate-100 font-sans mt-0.5">{pdRangeText}</p>
              </div>
            </div>
          </div>

          {/* SVG Candlestick / Price Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-lg overflow-x-auto">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200">
                {symbol} - {selectedDate} ({currentTimeframe.toUpperCase()} Interval)
              </span>
              <div className="flex items-center space-x-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-emerald-400 inline-block"></span> Resistance
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-rose-400 inline-block"></span> Support
                </span>
              </div>
            </div>

            <div className="relative w-full overflow-hidden bg-slate-950 p-4 rounded-lg border border-slate-800">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-64 overflow-visible"
              >
                {/* Volume Profile (VPVR) Histogram & Key Lines Overlay */}
                {showVolumeProfile && vpBins.length > 0 && maxBinVol > 0 && (
                  <g opacity="0.85">
                    {vpBins.map((bin) => {
                      const yHigh = getY(bin.priceHigh);
                      const yLow = getY(bin.priceLow);
                      const barHeight = Math.max(2, Math.abs(yLow - yHigh) - 1);

                      const maxBarWidth = 150;
                      const buyWidth = (bin.buyVol / maxBinVol) * maxBarWidth;
                      const sellWidth = (bin.sellVol / maxBinVol) * maxBarWidth;
                      const isPoc = pocBin && pocBin.binIdx === bin.binIdx;

                      return (
                        <g key={`vp-${bin.binIdx}`}>
                          {/* Buy Volume Horizontal Bar */}
                          <rect
                            x={chartWidth - buyWidth - sellWidth}
                            y={yHigh}
                            width={Math.max(1, buyWidth)}
                            height={barHeight}
                            fill="#10b981"
                            opacity={isPoc ? 0.9 : 0.45}
                            rx="1"
                          />
                          {/* Sell Volume Horizontal Bar */}
                          <rect
                            x={chartWidth - sellWidth}
                            y={yHigh}
                            width={Math.max(1, sellWidth)}
                            height={barHeight}
                            fill="#f43f5e"
                            opacity={isPoc ? 0.9 : 0.45}
                            rx="1"
                          />
                        </g>
                      );
                    })}

                    {/* Key Lines: POC, VAH, VAL */}
                    {pocBin && (
                      <>
                        {/* Point of Control (POC) Line */}
                        <line
                          x1="0"
                          y1={getY(pocBin.priceMid)}
                          x2={chartWidth}
                          y2={getY(pocBin.priceMid)}
                          stroke="#f59e0b"
                          strokeWidth="2"
                        />
                        <rect
                          x={10}
                          y={getY(pocBin.priceMid) - 9}
                          width="185"
                          height="18"
                          fill="#020617"
                          stroke="#f59e0b"
                          strokeWidth="1"
                          rx="4"
                        />
                        <text
                          x={16}
                          y={getY(pocBin.priceMid) + 4}
                          fill="#fbbf24"
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          POC (Point of Control): ₹{pocBin.priceMid.toFixed(2)}
                        </text>

                        {/* VAH (Value Area High) Line */}
                        {vahPrice > 0 && (
                          <>
                            <line
                              x1="0"
                              y1={getY(vahPrice)}
                              x2={chartWidth}
                              y2={getY(vahPrice)}
                              stroke="#38bdf8"
                              strokeWidth="1.5"
                              strokeDasharray="3 3"
                            />
                            <text
                              x={10}
                              y={getY(vahPrice) - 4}
                              fill="#38bdf8"
                              fontSize="9"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              VAH (Value Area High): ₹{vahPrice.toFixed(2)}
                            </text>
                          </>
                        )}

                        {/* VAL (Value Area Low) Line */}
                        {valPrice > 0 && (
                          <>
                            <line
                              x1="0"
                              y1={getY(valPrice)}
                              x2={chartWidth}
                              y2={getY(valPrice)}
                              stroke="#38bdf8"
                              strokeWidth="1.5"
                              strokeDasharray="3 3"
                            />
                            <text
                              x={10}
                              y={getY(valPrice) + 12}
                              fill="#38bdf8"
                              fontSize="9"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              VAL (Value Area Low): ₹{valPrice.toFixed(2)}
                            </text>
                          </>
                        )}
                      </>
                    )}
                  </g>
                )}

                {/* Horizontal Grid lines & ADR Resistance / Support */}
                {dailyLevel && (
                  <>
                    {/* Resistance Line */}
                    <line
                      x1="0"
                      y1={getY(dailyLevel.resistance)}
                      x2={chartWidth}
                      y2={getY(dailyLevel.resistance)}
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={chartWidth - 100}
                      y={getY(dailyLevel.resistance) - 5}
                      fill="#10b981"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      BUY: ₹{dailyLevel.resistance.toFixed(2)}
                    </text>

                    {/* Support Line */}
                    <line
                      x1="0"
                      y1={getY(dailyLevel.support)}
                      x2={chartWidth}
                      y2={getY(dailyLevel.support)}
                      stroke="#f43f5e"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={chartWidth - 100}
                      y={getY(dailyLevel.support) + 12}
                      fill="#f43f5e"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      SELL: ₹{dailyLevel.support.toFixed(2)}
                    </text>
                  </>
                )}

                {/* Candles */}
                {(() => {
                  const vol4Infos = calculateVolCandles(todaysCandles);
                  return todaysCandles.map((c, i) => {
                    const stepX = chartWidth / (todaysCandles.length || 1);
                    const x = i * stepX + stepX / 2;
                    const candleWidth = Math.max(2, stepX * 0.6);

                    const yOpen = getY(c.open);
                    const yClose = getY(c.close);
                    const yHigh = getY(c.high);
                    const yLow = getY(c.low);

                    const isBull = c.close >= c.open;
                    let color = isBull ? '#10b981' : '#f43f5e';

                    if (showVol4TypesOverlay && vol4Infos[i]) {
                      color = vol4Infos[i].colorHex;
                    }

                    const itemAnalysis = candleAnalysis[i];
                    const hasSignal = itemAnalysis && itemAnalysis.signal !== 'NONE';

                    return (
                      <g key={c.datetime}>
                        {/* High-Low Wick */}
                        <line
                          x1={x}
                          y1={yHigh}
                          x2={x}
                          y2={yLow}
                          stroke={color}
                          strokeWidth="1.5"
                        />

                        {/* Open-Close Body */}
                        <rect
                          x={x - candleWidth / 2}
                          y={Math.min(yOpen, yClose)}
                          width={candleWidth}
                          height={Math.max(2, Math.abs(yClose - yOpen))}
                          fill={color}
                          rx="1"
                        />

                      {/* Signal Marker if Breakout occurs */}
                      {hasSignal && (
                        <g>
                          <circle
                            cx={x}
                            cy={itemAnalysis.signal === 'BUY' ? yLow + 12 : yHigh - 12}
                            r="8"
                            fill={itemAnalysis.signal === 'BUY' ? '#10b981' : '#f43f5e'}
                          />
                          <text
                            x={x}
                            y={itemAnalysis.signal === 'BUY' ? yLow + 15 : yHigh - 9}
                            textAnchor="middle"
                            fill="#020617"
                            fontSize="9"
                            fontWeight="bold"
                          >
                            {itemAnalysis.signal === 'BUY' ? 'B' : 'S'}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                });
              })()}
              </svg>
            </div>
          </div>

          {/* Volume Profile (VPVR) S/R Level Inspector Matrix */}
          {pocBin && (
            <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-4 sm:p-5 shadow-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-mono font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
                      <span>Volume Profile S/R Level Matrix</span>
                      <span className="bg-amber-500/20 text-amber-300 font-bold text-xs px-2.5 py-0.5 rounded-full border border-amber-500/30 font-mono">
                        VPVR LAYER
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Volume-at-price distribution revealing true institutional Point of Control and Value Area boundaries.
                    </p>
                  </div>
                </div>

                {todaysCandles.length > 0 && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Current Price vs POC</span>
                    <span className={`text-xs font-mono font-bold ${
                      todaysCandles[todaysCandles.length - 1].close >= pocBin.priceMid
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}>
                      {todaysCandles[todaysCandles.length - 1].close >= pocBin.priceMid
                        ? `🟢 +${(((todaysCandles[todaysCandles.length - 1].close - pocBin.priceMid) / pocBin.priceMid) * 100).toFixed(2)}% Above POC (Bullish)`
                        : `🔴 ${(((todaysCandles[todaysCandles.length - 1].close - pocBin.priceMid) / pocBin.priceMid) * 100).toFixed(2)}% Below POC (Bearish)`
                      }
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
                {/* POC Card */}
                <div className="bg-amber-500/10 border border-amber-500/40 p-3.5 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-amber-300 font-bold uppercase">
                    <span>Point of Control (POC)</span>
                    <span className="bg-amber-500/20 px-1.5 py-0.5 rounded">Magnet Level</span>
                  </div>
                  <p className="text-xl font-bold text-amber-300 font-mono">₹{pocBin.priceMid.toFixed(2)}</p>
                  <p className="text-[10px] text-slate-400">Highest volume price bucket ({formatVol(pocBin.totalVol)} traded)</p>
                </div>

                {/* VAH Card */}
                <div className="bg-sky-500/10 border border-sky-500/30 p-3.5 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-sky-300 font-bold uppercase">
                    <span>Value Area High (VAH)</span>
                    <span className="bg-sky-500/20 px-1.5 py-0.5 rounded">Upper Bound</span>
                  </div>
                  <p className="text-xl font-bold text-sky-300 font-mono">₹{vahPrice.toFixed(2)}</p>
                  <p className="text-[10px] text-slate-400">70% Volume Area top resistance ceiling</p>
                </div>

                {/* VAL Card */}
                <div className="bg-sky-500/10 border border-sky-500/30 p-3.5 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-sky-300 font-bold uppercase">
                    <span>Value Area Low (VAL)</span>
                    <span className="bg-sky-500/20 px-1.5 py-0.5 rounded">Lower Bound</span>
                  </div>
                  <p className="text-xl font-bold text-sky-300 font-mono">₹{valPrice.toFixed(2)}</p>
                  <p className="text-[10px] text-slate-400">70% Volume Area bottom support floor</p>
                </div>

                {/* Top HVNs */}
                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-1">
                  <div className="text-[11px] text-purple-300 font-bold uppercase">
                    <span>High Volume Nodes (HVNs)</span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-200">
                    {hvnBins.map((hvn, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">HVN #{idx + 1}:</span>
                        <span className="font-bold text-emerald-400">₹{hvn.priceMid.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-500">({formatVol(hvn.totalVol)})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Candle Log Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-400" />
                  Closed Candle Inspection Table ({currentTimeframe.toUpperCase()})
                </h3>
                <p className="text-xs text-slate-400">
                  Detailed minute-by-minute breakout audit with Relative Volume (RVOL), Order Flow (Buys vs Sells), and Cumulative Volume Delta (CCVD).
                </p>
              </div>

              {/* Session Volume Summary Badges */}
              {candleAnalysis.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <div className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-slate-300">
                    <span className="text-[10px] text-slate-500 block uppercase">Session Vol</span>
                    <span className="font-bold text-slate-100">{formatVol(candleAnalysis.reduce((a, b) => a + (b.candle.volume || 0), 0))}</span>
                  </div>
                  <div className="bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/30 text-amber-300">
                    <span className="text-[10px] text-amber-500/80 block uppercase">Session RVOL</span>
                    <span className="font-bold">
                      {avgVol10d > 0
                        ? (candleAnalysis.reduce((a, b) => a + (b.candle.volume || 0), 0) / avgVol10d).toFixed(2)
                        : '1.00'}x
                    </span>
                  </div>
                  <div className="bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30 text-emerald-300">
                    <span className="text-[10px] text-emerald-500/80 block uppercase">Buy Vol</span>
                    <span className="font-bold">{formatVol(candleAnalysis.reduce((a, b) => a + b.buyVol, 0))}</span>
                  </div>
                  <div className="bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/30 text-rose-300">
                    <span className="text-[10px] text-rose-500/80 block uppercase">Sell Vol</span>
                    <span className="font-bold">{formatVol(candleAnalysis.reduce((a, b) => a + b.sellVol, 0))}</span>
                  </div>
                  <div className="bg-sky-500/10 px-2.5 py-1 rounded-md border border-sky-500/30 text-sky-300">
                    <span className="text-[10px] text-sky-400 block uppercase font-bold">Net CCVD</span>
                    <span className="font-bold">
                      {candleAnalysis[candleAnalysis.length - 1]?.ccvd > 0 ? '+' : ''}
                      {formatVol(candleAnalysis[candleAnalysis.length - 1]?.ccvd || 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Open</th>
                    <th className="py-2.5 px-3">High</th>
                    <th className="py-2.5 px-3">Low</th>
                    <th className="py-2.5 px-3">Close</th>
                    <th className="py-2.5 px-3 text-amber-400">Vol / RVOL</th>
                    <th className="py-2.5 px-3 text-emerald-400">Buys vs Sells</th>
                    <th className="py-2.5 px-3 text-sky-400">Delta</th>
                    <th className="py-2.5 px-3 text-sky-300 font-bold">CCVD</th>
                    <th className="py-2.5 px-3">Signal Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {candleAnalysis.map((ca) => {
                    const c = ca.candle;
                    const isBuy = ca.signal === 'BUY';
                    const isSell = ca.signal === 'SELL';

                    return (
                      <tr
                        key={c.datetime}
                        className={
                          isBuy
                            ? 'bg-emerald-500/10 font-bold'
                            : isSell
                            ? 'bg-rose-500/10 font-bold'
                            : 'hover:bg-slate-800/40'
                        }
                      >
                        <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                          {new Date(c.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">₹{c.open.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-slate-300">₹{c.high.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-slate-300">₹{c.low.toFixed(2)}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-100">₹{c.close.toFixed(2)}</td>
                        
                        {/* Candle Volume & RVOL Badge */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-slate-200">{formatVol(c.volume || 0)}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                              ca.rvol >= 1.4
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : ca.rvol >= 1.1
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {ca.rvol.toFixed(2)}x
                            </span>
                          </div>
                        </td>

                        {/* Buys vs Sells Breakdown */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="text-emerald-400 font-semibold">
                              🟢 {formatVol(ca.buyVol)} ({ca.buyPct}%)
                            </span>
                            <span className="text-slate-600">/</span>
                            <span className="text-rose-400 font-semibold">
                              🔴 {formatVol(ca.sellVol)} ({ca.sellPct}%)
                            </span>
                          </div>
                        </td>

                        {/* Candle Delta */}
                        <td className="py-2.5 px-3 font-bold whitespace-nowrap">
                          <span className={ca.delta > 0 ? 'text-emerald-400' : ca.delta < 0 ? 'text-rose-400' : 'text-slate-400'}>
                            {ca.delta > 0 ? `+${formatVol(ca.delta)}` : formatVol(ca.delta)}
                          </span>
                        </td>

                        {/* Cumulative Volume Delta (CCVD) */}
                        <td className="py-2.5 px-3 font-bold whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[11px] border ${
                            ca.ccvd > 0
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : ca.ccvd < 0
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {ca.ccvd > 0 ? `+${formatVol(ca.ccvd)}` : formatVol(ca.ccvd)}
                          </span>
                        </td>

                        {/* Signal Check Trigger */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {isBuy && (
                            <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                              <ArrowUpRight className="w-3.5 h-3.5" /> BUY TRIGGER (Closed &gt; Res)
                            </span>
                          )}
                          {isSell && (
                            <span className="text-rose-400 font-extrabold flex items-center gap-1">
                              <ArrowDownRight className="w-3.5 h-3.5" /> SELL TRIGGER (Closed &lt; Supp)
                            </span>
                          )}
                          {!isBuy && !isSell && <span className="text-slate-500">None</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <Layers className="w-10 h-10 mx-auto mb-2 text-slate-600" />
          <p className="text-sm">Select a symbol and date to view intraday candle charts & level breakdown.</p>
        </div>
      )}
    </div>
  );
};
