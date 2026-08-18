import React, { useState, useEffect } from 'react';
import { Candle, UniverseType } from '../types';
import { UniverseSelector } from './UniverseSelector';
import {
  VolCandleConfig,
  VolCandleSignal,
  DEFAULT_VOL_CANDLE_CONFIG,
  calculateVolCandles,
  detectVolCandleSignals,
  VolCandleInfo,
} from '../utils/volCandle4Types';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Sliders,
  CheckCircle2,
  Search,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  Layers,
} from 'lucide-react';

interface VolumeCandle4TypesViewProps {
  timeframe: '5m' | '15m';
  setTimeframe: (tf: '5m' | '15m') => void;
  universe: UniverseType;
  setUniverse?: (u: UniverseType) => void;
  onSelectSymbolForChart: (sym: string) => void;
  onOpenChartModal?: (sym: string) => void;
}

interface StockVolStatus {
  symbol: string;
  name?: string;
  ltp: number;
  todaysOpen: number;
  priceChangePct: number;
  candle1?: VolCandleInfo;
  candle2?: VolCandleInfo;
  latestCandle?: VolCandleInfo;
  signal?: VolCandleSignal;
}

export const VolumeCandle4TypesView: React.FC<VolumeCandle4TypesViewProps> = ({
  timeframe,
  setTimeframe,
  universe,
  setUniverse,
  onSelectSymbolForChart,
  onOpenChartModal,
}) => {
  const [subTab, setSubTab] = useState<'BULLISH' | 'BEARISH' | 'CLIMAX_15M' | 'ALL_STOCKS'>('BULLISH');
  const [config, setConfig] = useState<VolCandleConfig>(DEFAULT_VOL_CANDLE_CONFIG);
  const [loading, setLoading] = useState<boolean>(true);
  const [stockStatuses, setStockStatuses] = useState<StockVolStatus[]>([]);
  const [bullishSignals, setBullishSignals] = useState<VolCandleSignal[]>([]);
  const [bearishSignals, setBearishSignals] = useState<VolCandleSignal[]>([]);
  const [climax15mStocks, setClimax15mStocks] = useState<{
    symbol: string;
    ltp: number;
    priceChangePct: number;
    candle15mType: 'LIGHT_GREEN' | 'MAROON';
    volRatio: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    candleTime: string;
  }[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);

  const fetchAndAnalyzeUniverse = async () => {
    setLoading(true);
    try {
      let data: any = { items: [] };
      let data15m: any = { items: [] };

      if (timeframe === '15m') {
        const res = await fetch(`/api/stock-scanner-data?universe=${universe}&interval=15m`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();
        data15m = data;
      } else {
        const [res, res15m] = await Promise.all([
          fetch(`/api/stock-scanner-data?universe=${universe}&interval=${timeframe}`),
          fetch(`/api/stock-scanner-data?universe=${universe}&interval=15m`),
        ]);
        if (res.ok) data = await res.json();
        if (res15m.ok) data15m = await res15m.json();
      }

      const statuses: StockVolStatus[] = [];
      const bullSigs: VolCandleSignal[] = [];
      const bearSigs: VolCandleSignal[] = [];
      const climax15mList: {
        symbol: string;
        ltp: number;
        priceChangePct: number;
        candle15mType: 'LIGHT_GREEN' | 'MAROON';
        volRatio: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
        candleTime: string;
      }[] = [];

      for (const item of data.items || []) {
        const symbol = item.symbol;
        const candles: Candle[] = item.intradayCandles || [];
        if (candles.length < 2) continue;

        const volInfos = calculateVolCandles(candles, config);
        const sigs = detectVolCandleSignals(symbol, candles, timeframe, config);

        const ltp = item.latestPrice || candles[candles.length - 1].close;
        const todaysOpen = item.todaysOpen || candles[0].open;
        const priceChangePct = ((ltp - todaysOpen) / todaysOpen) * 100;

        const c1 = volInfos.find((v) => v.candleIndexInDay === 0);
        const c2 = volInfos.find((v) => v.candleIndexInDay === 1);
        const latestC = volInfos[volInfos.length - 1];

        const activeSig = sigs.length > 0 ? sigs[sigs.length - 1] : undefined;
        if (activeSig) {
          if (activeSig.type === 'BUY') bullSigs.push(activeSig);
          if (activeSig.type === 'SELL') bearSigs.push(activeSig);
        }

        statuses.push({
          symbol,
          name: item.name,
          ltp,
          todaysOpen,
          priceChangePct,
          candle1: c1,
          candle2: c2,
          latestCandle: latestC,
          signal: activeSig,
        });
      }

      // Process 15m candles specifically for 1st 15-min Climax Candle table
      for (const item15 of data15m.items || []) {
        const symbol = item15.symbol;
        const candles15: Candle[] = item15.intradayCandles || [];
        if (candles15.length === 0) continue;

        const volInfos15 = calculateVolCandles(candles15, config);
        const c1_15m = volInfos15.find((v) => v.candleIndexInDay === 0);

        if (c1_15m && (c1_15m.type === 'LIGHT_GREEN' || c1_15m.type === 'MAROON')) {
          const ltp = item15.latestPrice || candles15[candles15.length - 1].close;
          const todaysOpen = item15.todaysOpen || candles15[0].open;
          const priceChangePct = ((ltp - todaysOpen) / todaysOpen) * 100;

          climax15mList.push({
            symbol,
            ltp,
            priceChangePct,
            candle15mType: c1_15m.type,
            volRatio: c1_15m.volRatio,
            open: c1_15m.candle.open,
            high: c1_15m.candle.high,
            low: c1_15m.candle.low,
            close: c1_15m.candle.close,
            volume: c1_15m.candle.volume,
            candleTime: c1_15m.candle.datetime.substring(11, 16),
          });
        }
      }

      setStockStatuses(statuses);
      setBullishSignals(bullSigs);
      setBearishSignals(bearSigs);
      setClimax15mStocks(climax15mList);
    } catch (err) {
      console.error('Error fetching volume candle scan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndAnalyzeUniverse();
  }, [universe, timeframe, config]);

  const filteredBullish = bullishSignals.filter((s) =>
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBearish = bearishSignals.filter((s) =>
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAllStocks = stockStatuses.filter((st) =>
    st.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                Volume Candle Strategy
              </span>
              <h2 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
                1st 5-Min Volume Candle Strategy (Light Green & Maroon)
              </h2>
            </div>
            
            <p className="text-xs text-slate-300 mt-1">
              Classifies high volume candles based on 14 Volume EMA: <strong className="text-lime-300 font-bold">Light Green</strong> (High Volume Bullish) and <strong className="text-rose-400 font-bold">Maroon</strong> (High Volume Bearish).
            </p>
          </div>

          {/* Quick Legend & Config */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="bg-lime-500/20 border border-lime-400 text-lime-300 px-3 py-1 rounded-lg flex items-center gap-1.5 font-bold shadow-sm">
              <span className="w-3.5 h-3.5 rounded-sm bg-lime-400 inline-block shadow"></span>
              <span>Light Green (Bullish Volume)</span>
            </div>

            <div className="bg-rose-950/90 border border-rose-700 text-rose-300 px-3 py-1 rounded-lg flex items-center gap-1.5 font-bold shadow-sm">
              <span className="w-3.5 h-3.5 rounded-sm bg-rose-900 inline-block shadow"></span>
              <span>Maroon (Bearish Volume)</span>
            </div>

            <button
              onClick={() => setShowConfigModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Settings ({config.volFactor}x Vol)</span>
            </button>
          </div>
        </div>

        {/* Strategy Confirmation Banner */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Rule:</strong> 1st 5-min candle is <strong className="text-lime-300">Light Green</strong> = <strong className="text-emerald-400">BUY</strong> on 2nd candle confirmation | 1st 5-min candle is <strong className="text-rose-400">Maroon</strong> = <strong className="text-rose-400">SELL</strong> on 2nd candle confirmation.
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
            <span className="text-slate-400">Timeframe: <strong className="text-slate-200">{timeframe}</strong></span>
            <button
              onClick={fetchAndAnalyzeUniverse}
              disabled={loading}
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors font-bold cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Scan Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900 p-2 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSubTab('BULLISH')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'BULLISH'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>🟢 Light Green Bullish Signals ({bullishSignals.length})</span>
          </button>

          <button
            onClick={() => setSubTab('BEARISH')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'BEARISH'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <TrendingDown className="w-4 h-4 text-rose-400" />
            <span>🔴 Maroon Bearish Signals ({bearishSignals.length})</span>
          </button>

          <button
            onClick={() => setSubTab('ALL_STOCKS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'ALL_STOCKS'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4 text-blue-400" />
            <span>⚡ All Stocks Matrix ({stockStatuses.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-60">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search symbol (e.g. RELIANCE)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-950 text-xs text-slate-200 placeholder-slate-500 pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 w-full"
          />
        </div>
      </div>

      {/* Main Table Views with Fixed On-Screen Horizontal Scrollbar */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-sm font-medium">Scanning 1st 5-min Light Green & Maroon volume candles across {universe}...</p>
        </div>
      ) : (
        <>
          {/* BULLISH SIGNALS TAB */}
          {subTab === 'BULLISH' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
                <span className="font-bold text-xs text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  1st Candle Light Green (Bullish) + 2nd Candle Confirmation
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {filteredBullish.length} Triggered
                </span>
              </div>

              <div className="overflow-auto max-h-[62vh] relative">
                {filteredBullish.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                    <CheckCircle2 className="w-6 h-6 text-slate-600 mx-auto" />
                    <p>No Bullish 1st Candle Light Green setups detected on {timeframe} timeframe right now.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 z-20 bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800 shadow-md">
                      <tr>
                        <th className="py-2.5 px-3">Symbol</th>
                        <th className="py-2.5 px-3">Signal Time</th>
                        <th className="py-2.5 px-3">1st Candle (09:15)</th>
                        <th className="py-2.5 px-3">2nd Candle (09:20)</th>
                        <th className="py-2.5 px-3">Entry Price</th>
                        <th className="py-2.5 px-3 text-emerald-400">Target (+1%)</th>
                        <th className="py-2.5 px-3 text-rose-400">Stop Loss</th>
                        <th className="py-2.5 px-3">Vol Surge</th>
                        <th className="py-2.5 px-3 text-right">Plot On Chart</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {filteredBullish.map((sig) => (
                        <tr key={sig.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-100">
                            <button
                              onClick={() => onOpenChartModal ? onOpenChartModal(sig.symbol) : onSelectSymbolForChart(sig.symbol)}
                              className="flex items-center gap-1.5 text-left group cursor-pointer"
                              title={`Click to open quick popup chart for ${sig.symbol}`}
                            >
                              <span className="text-emerald-400 font-extrabold group-hover:underline flex items-center gap-1">
                                {sig.symbol}
                                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </span>
                              <span className="text-[10px] text-lime-300 bg-lime-500/20 px-1.5 py-0.5 rounded border border-lime-400 font-sans">
                                BUY SIGNAL
                              </span>
                            </button>
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            <span className="inline-flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                              <Clock className="w-3 h-3 text-amber-400" />
                              {sig.candle1Time} - {sig.candle2Time}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 font-extrabold px-2 py-0.5 rounded border text-[11px] bg-lime-500/20 text-lime-300 border-lime-400 shadow-sm">
                              🟢 Light Green ({sig.volRatio1.toFixed(1)}x Vol)
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded border text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                              {sig.candle2Color} Confirm
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-100 font-bold">
                            ₹{sig.entryPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-emerald-400 font-bold">
                            ₹{sig.targetPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-rose-400 font-semibold">
                            ₹{sig.stopLossPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            <span className="bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20 font-bold text-[11px]">
                              {sig.volRatio1.toFixed(1)}x EMA14
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => onOpenChartModal ? onOpenChartModal(sig.symbol) : onSelectSymbolForChart(sig.symbol)}
                              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded text-[11px] font-sans font-bold transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <span>Open Chart</span>
                              <ChevronRight className="w-3 h-3" />
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

          {/* BEARISH SIGNALS TAB */}
          {subTab === 'BEARISH' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
                <span className="font-bold text-xs text-rose-300 uppercase tracking-wider flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  1st Candle Maroon (Bearish) + 2nd Candle Confirmation
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {filteredBearish.length} Triggered
                </span>
              </div>

              <div className="overflow-auto max-h-[62vh] relative">
                {filteredBearish.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                    <CheckCircle2 className="w-6 h-6 text-slate-600 mx-auto" />
                    <p>No Bearish 1st Candle Maroon setups detected on {timeframe} timeframe right now.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 z-20 bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800 shadow-md">
                      <tr>
                        <th className="py-2.5 px-3">Symbol</th>
                        <th className="py-2.5 px-3">Signal Time</th>
                        <th className="py-2.5 px-3">1st Candle (09:15)</th>
                        <th className="py-2.5 px-3">2nd Candle (09:20)</th>
                        <th className="py-2.5 px-3">Entry Price</th>
                        <th className="py-2.5 px-3 text-rose-400">Target (-1%)</th>
                        <th className="py-2.5 px-3 text-emerald-400">Stop Loss</th>
                        <th className="py-2.5 px-3">Vol Surge</th>
                        <th className="py-2.5 px-3 text-right">Plot On Chart</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {filteredBearish.map((sig) => (
                        <tr key={sig.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-100">
                            <button
                              onClick={() => onOpenChartModal ? onOpenChartModal(sig.symbol) : onSelectSymbolForChart(sig.symbol)}
                              className="flex items-center gap-1.5 text-left group cursor-pointer"
                              title={`Click to open quick popup chart for ${sig.symbol}`}
                            >
                              <span className="text-rose-400 font-extrabold group-hover:underline flex items-center gap-1">
                                {sig.symbol}
                                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </span>
                              <span className="text-[10px] text-rose-300 bg-rose-950 px-1.5 py-0.5 rounded border border-rose-700 font-sans">
                                SELL SIGNAL
                              </span>
                            </button>
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            <span className="inline-flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                              <Clock className="w-3 h-3 text-amber-400" />
                              {sig.candle1Time} - {sig.candle2Time}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 font-extrabold px-2 py-0.5 rounded border text-[11px] bg-rose-950 text-rose-300 border-rose-700 shadow-sm">
                              🔴 Maroon ({sig.volRatio1.toFixed(1)}x Vol)
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded border text-[11px] bg-rose-500/10 text-rose-400 border-rose-500/20">
                              {sig.candle2Color} Confirm
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-100 font-bold">
                            ₹{sig.entryPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-rose-400 font-bold">
                            ₹{sig.targetPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-emerald-400 font-semibold">
                            ₹{sig.stopLossPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            <span className="bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20 font-bold text-[11px]">
                              {sig.volRatio1.toFixed(1)}x EMA14
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => onOpenChartModal ? onOpenChartModal(sig.symbol) : onSelectSymbolForChart(sig.symbol)}
                              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded text-[11px] font-sans font-bold transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <span>Open Chart</span>
                              <ChevronRight className="w-3 h-3" />
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

          {/* ALL STOCKS MATRIX TAB */}
          {subTab === 'ALL_STOCKS' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-200 uppercase tracking-wider">
                  Live Volume Candle Matrix ({universe})
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Showing {filteredAllStocks.length} Tickers
                </span>
              </div>

              <div className="overflow-auto max-h-[62vh] relative">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 z-20 bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800 shadow-md">
                    <tr>
                      <th className="py-2.5 px-3">Symbol</th>
                      <th className="py-2.5 px-3">LTP (₹)</th>
                      <th className="py-2.5 px-3">Change %</th>
                      <th className="py-2.5 px-3">1st Candle (09:15)</th>
                      <th className="py-2.5 px-3">2nd Candle (09:20)</th>
                      <th className="py-2.5 px-3">Vol Ratio</th>
                      <th className="py-2.5 px-3">Strategy Signal</th>
                      <th className="py-2.5 px-3 text-right">Plot On Chart</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {filteredAllStocks.map((st, idx) => (
                      <tr key={`${st.symbol}_${idx}`} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-100">
                          <button
                            onClick={() => onOpenChartModal ? onOpenChartModal(st.symbol) : onSelectSymbolForChart(st.symbol)}
                            className="hover:text-emerald-400 hover:underline cursor-pointer font-extrabold flex items-center gap-1 transition-colors"
                            title={`Click to open quick popup chart for ${st.symbol}`}
                          >
                            <span>{st.symbol}</span>
                            <ChevronRight className="w-3 h-3 text-emerald-400 opacity-70" />
                          </button>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-200">
                          ₹{st.ltp.toFixed(2)}
                        </td>
                        <td className={`py-3 px-3 font-bold ${st.priceChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {st.priceChangePct >= 0 ? '+' : ''}{st.priceChangePct.toFixed(2)}%
                        </td>

                        <td className="py-3 px-3">
                          {st.candle1 ? (
                            <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded border text-[10px] ${st.candle1.bgTailwind} ${st.candle1.borderTailwind} ${st.candle1.textTailwind}`}>
                              {st.candle1.colorName} ({st.candle1.volRatio.toFixed(1)}x)
                            </span>
                          ) : '-'}
                        </td>

                        <td className="py-3 px-3">
                          {st.candle2 ? (
                            <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded border text-[10px] ${st.candle2.bgTailwind} ${st.candle2.borderTailwind} ${st.candle2.textTailwind}`}>
                              {st.candle2.colorName} ({st.candle2.volRatio.toFixed(1)}x)
                            </span>
                          ) : '-'}
                        </td>

                        <td className="py-3 px-3 text-slate-300">
                          <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-bold text-[11px]">
                            {st.latestCandle?.volRatio.toFixed(1)}x
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          {st.signal ? (
                            <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded border text-[10px] ${
                              st.signal.type === 'BUY'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            }`}>
                              {st.signal.type === 'BUY' ? '🟢 BUY (LIGHT GREEN)' : '🔴 SELL (MAROON)'}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Neutral</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => onOpenChartModal ? onOpenChartModal(st.symbol) : onSelectSymbolForChart(st.symbol)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded text-[11px] font-sans font-medium transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <span>Open Chart</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Settings Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-slate-100">
                  Volume Candle Settings
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-200 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Volume EMA Baseline Period:
                </label>
                <input
                  type="number"
                  value={config.period}
                  onChange={(e) => setConfig({ ...config, period: parseInt(e.target.value) || 14 })}
                  className="bg-slate-950 border border-slate-700 text-slate-100 px-3 py-1.5 rounded w-full font-mono focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  High Volume Surge Factor (1.50 = 150% of EMA):
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={config.volFactor}
                  onChange={(e) => setConfig({ ...config, volFactor: parseFloat(e.target.value) || 1.50 })}
                  className="bg-slate-950 border border-slate-700 text-slate-100 px-3 py-1.5 rounded w-full font-mono focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setConfig(DEFAULT_VOL_CANDLE_CONFIG)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setShowConfigModal(false)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-1.5 rounded text-xs transition-colors cursor-pointer"
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
