import React, { useState, useEffect } from 'react';
import { StockScanStatus, UniverseType } from '../types';
import { VisualHeatmapWidget } from './VisualHeatmapWidget';
import { SentimentGauge } from './SentimentGauge';
import { extractSentimentFromReasons } from '../utils/sentimentAnalysis';
import { UniverseSelector } from './UniverseSelector';
import { getNseStocksByUniverse } from '../constants/allNseStocks';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Search,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  BarChart3,
  ListFilter,
  CheckCircle2,
  Table as TableIcon,
  LayoutGrid,
  Zap,
  Activity,
  Flame,
  AlertTriangle,
  ArrowUpDown,
  Sparkles,
  Target,
  ShieldCheck
} from 'lucide-react';

interface ScannerViewProps {
  timeframe: '5m' | '15m';
  setTimeframe?: (tf: '5m' | '15m') => void;
  universe: UniverseType;
  setUniverse?: (u: UniverseType) => void;
  onSelectSymbolForChart: (symbol: string) => void;
  onOpenChartModal?: (symbol: string) => void;
  initialSubTab?: 'ALL' | 'BULLISH' | 'BEARISH' | 'VOLUME' | 'MULTI_DAY' | 'WATCHLIST' | 'HEATMAP';
  onOpenTrendingRadar?: () => void;
}

const NIFTY_FNO_STOCKS = Array.from(new Set([
  'AARTIIND.NS', 'ABB.NS', 'ABBOTINDIA.NS', 'ABCAPITAL.NS', 'ABFRL.NS', 'ACC.NS', 'ADANIENT.NS', 'ADANIPORTS.NS',
  'ALKEM.NS', 'AMBUJACEM.NS', 'APOLLOHOSP.NS', 'APOLLOTYRE.NS', 'ASHOKLEY.NS', 'ASIANPAINT.NS', 'ASTRAL.NS',
  'ATUL.NS', 'AUBANK.NS', 'AUROPHARMA.NS', 'AXISBANK.NS', 'BAJAJ-AUTO.NS', 'BAJAJFINSV.NS', 'BAJFINANCE.NS',
  'BALKRISIND.NS', 'BALRAMCHIN.NS', 'BANDHANBNK.NS', 'BANKBARODA.NS', 'BATAINDIA.NS', 'BEL.NS', 'BHARATFORG.NS',
  'BHARTIARTL.NS', 'BHEL.NS', 'BIOCON.NS', 'BPCL.NS', 'BRITANNIA.NS', 'BSOFT.NS', 'CANBK.NS', 'CANFINHOME.NS',
  'CHAMBLFERT.NS', 'CHOLAFIN.NS', 'CIPLA.NS', 'COALINDIA.NS', 'COFORGE.NS', 'COLPAL.NS', 'CONCOR.NS', 'COROMANDEL.NS',
  'CROMPTON.NS', 'CUMMINSIND.NS', 'DABUR.NS', 'DALBHARAT.NS', 'DEEPAKNTR.NS', 'DIVISLAB.NS', 'DIXON.NS', 'DLF.NS',
  'DRREDDY.NS', 'EICHERMOT.NS', 'ESCORTS.NS', 'EXIDEIND.NS', 'FEDERALBNK.NS', 'GAIL.NS', 'GLENMARK.NS', 'GMRAIRPORT.NS',
  'GNFC.NS', 'GODREJCP.NS', 'GODREJPROP.NS', 'GRANULES.NS', 'GRASIM.NS', 'GUJENERGY.NS', 'HAL.NS', 'HAVELLS.NS',
  'HCLTECH.NS', 'HDFCBANK.NS', 'HDFCLIFE.NS', 'HEROMOTOCO.NS', 'HINDALCO.NS', 'HINDPETRO.NS', 'HINDUNILVR.NS',
  'ICICIBANK.NS', 'ICICIGI.NS', 'ICICIPRULI.NS', 'IDEA.NS', 'IDFCFIRSTB.NS', 'IEX.NS', 'IGL.NS', 'INDHOTEL.NS',
  'INDIACEM.NS', 'INDIAMART.NS', 'INDIGO.NS', 'INDUSINDBK.NS', 'INDUSTOWER.NS', 'INFY.NS', 'IOC.NS', 'IRCTC.NS',
  'ITC.NS', 'JINDALSTEL.NS', 'JSWSTEEL.NS', 'JUBLFOOD.NS', 'KEI.NS', 'KOTAKBANK.NS', 'LALPATHLAB.NS', 'LAURUSLABS.NS',
  'LICHSGFIN.NS', 'LT.NS', 'LTF.NS', 'LTTS.NS', 'LUPIN.NS', 'M&M.NS', 'M&MFIN.NS', 'MANAPPURAM.NS', 'MARICO.NS',
  'MARUTI.NS', 'UNITDSPR.NS', 'MCX.NS', 'METROPOLIS.NS', 'MFSL.NS', 'MGL.NS', 'MOTHERSON.NS', 'MPHASIS.NS',
  'MRF.NS', 'MUTHOOTFIN.NS', 'NATIONALUM.NS', 'NAUKRI.NS', 'NAVINFLUOR.NS', 'NESTLEIND.NS', 'NMDC.NS', 'NTPC.NS',
  'OBEROIRLTY.NS', 'OFSS.NS', 'ONGC.NS', 'PAGEIND.NS', 'PERSISTENT.NS', 'PETRONET.NS', 'PFC.NS', 'PIDILITIND.NS',
  'PIIND.NS', 'PNB.NS', 'POLYCAB.NS', 'POWERGRID.NS', 'PVRINOX.NS', 'RAMCOCEM.NS', 'RBLBANK.NS', 'RECLTD.NS',
  'RELIANCE.NS', 'SAIL.NS', 'SBICARD.NS', 'SBILIFE.NS', 'SBIN.NS', 'SHREECEM.NS', 'SHRIRAMFIN.NS', 'SIEMENS.NS',
  'SRF.NS', 'SUNPHARMA.NS', 'SUNTV.NS', 'SYNGENE.NS', 'TATACOMM.NS', 'TATACONSUM.NS', 'TATAELXSI.NS', 'TMPV.NS',
  'TATAPOWER.NS', 'TATASTEEL.NS', 'TCS.NS', 'TECHM.NS', 'TITAN.NS', 'TORNTPHARM.NS', 'TVSMOTOR.NS',
  'UBL.NS', 'ULTRACEMCO.NS', 'UPL.NS', 'VBL.NS', 'VEDL.NS', 'VOLTAS.NS', 'WIPRO.NS', 'ZEEL.NS', 'ZYDUSLIFE.NS'
]));

export interface AIAlphaPick {
  stock: StockScanStatus;
  convictionScore: number;
  tier: 'STRONG' | 'HIGH' | 'MODERATE';
  projectedMovePct: number;
  signalType: 'BULLISH' | 'BEARISH';
  rawTimestamp: number;
  timestamp: string;
  reasons: string[];
  entryPrice: number;
  targetPrice: number;
  stopLossPrice: number;
  riskReward: string;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  timeframe,
  setTimeframe,
  universe,
  setUniverse,
  onSelectSymbolForChart,
  onOpenChartModal,
  initialSubTab,
  onOpenTrendingRadar,
}) => {
  const [results, setResults] = useState<StockScanStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState<string>('');
  const [viewMode, setViewMode] = useState<'SIDE_BY_SIDE' | 'GRID'>('SIDE_BY_SIDE');
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');
  const [volumeFilter, setVolumeFilter] = useState<'ALL' | 'VOL_ALERTS' | 'MULTI_DAY' | 'REVERSALS' | 'HIGH_RVOL' | 'BUY_CVD' | 'SELL_CVD'>('ALL');
  const [primarySort, setPrimarySort] = useState<'TIME' | 'RVOL' | 'CVD' | 'SYMBOL' | 'PRICE' | 'CHANGE' | 'MULTI_DAY' | 'SENTIMENT'>('TIME');
  const [customTickerInput, setCustomTickerInput] = useState<string>('RELIANCE.NS, TCS.NS, INFY.NS, TMPV.NS');
  
  // AI POV High-Conviction Intraday Signals state
  const [aiTab, setAiTab] = useState<'BOTH' | 'BULLISH' | 'BEARISH'>('BOTH');
  const [aiSortBy, setAiSortBy] = useState<'SCORE' | 'MOVE' | 'TIME' | 'SYMBOL'>('SCORE');
  const [aiSortOrder, setAiSortOrder] = useState<'DESC' | 'ASC'>('DESC');

  // Dedicated Scanner Sub-Tables Navigation Tab state
  const [scannerTableTab, setScannerTableTab] = useState<'ALL' | 'BULLISH' | 'BEARISH' | 'VOLUME' | 'MULTI_DAY' | 'WATCHLIST' | 'HEATMAP'>(
    initialSubTab || 'ALL'
  );

  useEffect(() => {
    if (initialSubTab) {
      setScannerTableTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleColumnHeaderClick = (colKey: 'TIME' | 'RVOL' | 'CVD' | 'SYMBOL' | 'PRICE' | 'CHANGE' | 'MULTI_DAY' | 'SENTIMENT') => {
    if (primarySort === colKey) {
      setSortOrder((prev) => (prev === 'DESC' ? 'ASC' : 'DESC'));
    } else {
      setPrimarySort(colKey);
      setSortOrder(colKey === 'SYMBOL' ? 'ASC' : 'DESC');
    }
  };

  const renderSortArrow = (colKey: string) => {
    if (primarySort !== colKey) return null;
    return <span className="ml-1 text-emerald-400 font-extrabold">{sortOrder === 'ASC' ? '▲' : '▼'}</span>;
  };

  const handleAiHeaderClick = (colKey: 'TIME' | 'SYMBOL' | 'SCORE' | 'MOVE') => {
    if (aiSortBy === colKey) {
      setAiSortOrder((prev) => (prev === 'DESC' ? 'ASC' : 'DESC'));
    } else {
      setAiSortBy(colKey);
      setAiSortOrder(colKey === 'SYMBOL' ? 'ASC' : 'DESC');
    }
  };

  const renderAiSortArrow = (colKey: string) => {
    if (aiSortBy !== colKey) return null;
    return <span className="ml-1 text-emerald-400 font-extrabold">{aiSortOrder === 'ASC' ? '▲' : '▼'}</span>;
  };

  const fetchScan = async () => {
    setLoading(true);
    setError(null);
    try {
      let symbols: string[] = [];
      if (universe === 'CUSTOM') {
        symbols = customTickerInput
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter((s) => s.length > 0);
      } else {
        symbols = getNseStocksByUniverse(universe);
      }

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols, timeframe, universe }),
      });

      if (!res.ok) {
        throw new Error(`Scan request failed with HTTP ${res.status}`);
      }

      const data = await res.json();
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Failed to execute scanner');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScan();
  }, [timeframe, universe]);

  const getRawTimestamp = (isoString?: string): number => {
    if (!isoString) return 0;
    const parsed = Date.parse(isoString);
    if (!isNaN(parsed)) return parsed;
    const num = Number(isoString);
    if (!isNaN(num)) return num;
    return 0;
  };

  const formatSignalTime = (isoString?: string) => {
    if (!isoString) return '--:--';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      });
    } catch {
      return isoString;
    }
  };

  const sortItems = (items: StockScanStatus[]) => {
    return [...items].sort((a, b) => {
      let diff = 0;
      if (primarySort === 'SYMBOL') {
        diff = a.symbol.localeCompare(b.symbol);
      } else if (primarySort === 'RVOL') {
        diff = (a.rvol || 1.0) - (b.rvol || 1.0);
      } else if (primarySort === 'CVD') {
        diff = (a.cvd || 0) - (b.cvd || 0);
      } else if (primarySort === 'PRICE') {
        diff = (a.latestPrice || 0) - (b.latestPrice || 0);
      } else if (primarySort === 'CHANGE') {
        diff = (a.priceChangePct || 0) - (b.priceChangePct || 0);
      } else if (primarySort === 'MULTI_DAY') {
        const valA = a.daysHighBroken || a.daysLowBroken || (a.pdRangeStatus === 'ABOVE_PDH' || a.pdRangeStatus === 'BELOW_PDL' ? 1 : 0);
        const valB = b.daysHighBroken || b.daysLowBroken || (b.pdRangeStatus === 'ABOVE_PDH' || b.pdRangeStatus === 'BELOW_PDL' ? 1 : 0);
        diff = valA - valB;
      } else if (primarySort === 'SENTIMENT') {
        const sentA = extractSentimentFromReasons(
          a.activeSignal
            ? [a.activeSignal.breakoutContextAtSignal || '', a.activeSignal.breakoutShortTag || '']
            : a.volumeAlert
            ? [a.volumeAlert.title, a.volumeAlert.description]
            : a.reversalReason
            ? [a.reversalReason]
            : [],
          a,
          a.status === 'BUY_SIGNAL' ? 'BULLISH' : a.status === 'SELL_SIGNAL' ? 'BEARISH' : 'NEUTRAL'
        ).score;
        const sentB = extractSentimentFromReasons(
          b.activeSignal
            ? [b.activeSignal.breakoutContextAtSignal || '', b.activeSignal.breakoutShortTag || '']
            : b.volumeAlert
            ? [b.volumeAlert.title, b.volumeAlert.description]
            : b.reversalReason
            ? [b.reversalReason]
            : [],
          b,
          b.status === 'BUY_SIGNAL' ? 'BULLISH' : b.status === 'SELL_SIGNAL' ? 'BEARISH' : 'NEUTRAL'
        ).score;
        diff = sentA - sentB;
      } else {
        // TIME
        const timeA = new Date(a.activeSignal?.timestamp || a.lastUpdated || 0).getTime();
        const timeB = new Date(b.activeSignal?.timestamp || b.lastUpdated || 0).getTime();
        diff = timeA - timeB;
      }
      return sortOrder === 'DESC' ? -diff : diff;
    });
  };

  const filteredResults = results.filter((item) => {
    const matchesSymbol = item.symbol.toLowerCase().includes(filterText.toLowerCase());
    if (!matchesSymbol) return false;

    if (volumeFilter === 'VOL_ALERTS') return !!item.volumeAlert;
    if (volumeFilter === 'MULTI_DAY') return item.pdRangeStatus === 'ABOVE_PDH' || item.pdRangeStatus === 'BELOW_PDL' || (item.daysHighBroken && item.daysHighBroken >= 2) || (item.daysLowBroken && item.daysLowBroken >= 2);
    if (volumeFilter === 'REVERSALS') return item.reversalType === 'RESISTANCE_REVERSAL' || item.reversalType === 'SUPPORT_REVERSAL';
    if (volumeFilter === 'HIGH_RVOL') return (item.rvol || 1.0) >= 1.2;
    if (volumeFilter === 'BUY_CVD') return (item.cvd || 0) > 0;
    if (volumeFilter === 'SELL_CVD') return (item.cvd || 0) < 0;

    return true;
  });

  const buySignals = sortItems(filteredResults.filter((r) => r.status === 'BUY_SIGNAL'));
  const sellSignals = sortItems(filteredResults.filter((r) => r.status === 'SELL_SIGNAL'));
  const neutralStocks = filteredResults.filter((r) => r.status === 'NEUTRAL');
  
  const reversalStocks = sortItems(results.filter((r) => r.reversalType === 'RESISTANCE_REVERSAL' || r.reversalType === 'SUPPORT_REVERSAL'));
  const resistanceReversals = reversalStocks.filter((r) => r.reversalType === 'RESISTANCE_REVERSAL');
  const supportReversals = reversalStocks.filter((r) => r.reversalType === 'SUPPORT_REVERSAL');

  const volumeAlertStocks = sortItems(results.filter((r) => !!r.volumeAlert));
  const multiDayBreakoutStocks = sortItems(results.filter((r) => r.pdRangeStatus === 'ABOVE_PDH' || r.pdRangeStatus === 'BELOW_PDL' || (r.daysHighBroken && r.daysHighBroken >= 2) || (r.daysLowBroken && r.daysLowBroken >= 2)));
  
  // Sorted all filtered results for card view (signals first, then neutrals sorted)
  const sortedFilteredResults = [
    ...buySignals,
    ...sellSignals,
    ...sortItems(neutralStocks)
  ];

  // AI POV High-Conviction Intraday Alpha Signals Computation
  const aiAlphaPicks = React.useMemo(() => {
    const bullish: AIAlphaPick[] = [];
    const bearish: AIAlphaPick[] = [];

    for (const item of results) {
      const rvol = item.rvol || 1.0;
      const cvd = item.cvd || 0;
      const cvdRatio = item.cvdRatio || 50;
      const sig = item.activeSignal;
      const price = item.latestPrice;
      if (!price || price <= 0) continue;

      const rawTime = getRawTimestamp(sig?.candleCloseTime || sig?.timestamp || item.lastUpdated);
      const timeStr = formatSignalTime(sig?.candleCloseTime || sig?.timestamp || item.lastUpdated);

      // Bullish Evaluation
      const isBuySignal = item.status === 'BUY_SIGNAL' || (sig && sig.type === 'BUY');
      const isBullishVol = rvol >= 1.25 && (cvd > 0 || cvdRatio >= 51);
      const isBullishBreakout = (item.daysHighBroken && item.daysHighBroken >= 1) || item.pdRangeStatus === 'ABOVE_PDH' || item.reversalType === 'SUPPORT_REVERSAL';

      if (isBuySignal || (isBullishVol && isBullishBreakout)) {
        let score = 72;
        const reasons: string[] = [];

        if (isBuySignal) {
          score += 10;
          reasons.push('Active ADR Breakout');
        }
        if (rvol >= 2.0) {
          score += 10;
          reasons.push(`${rvol.toFixed(1)}x Heavy RVOL`);
        } else if (rvol >= 1.3) {
          score += 5;
          reasons.push(`${rvol.toFixed(1)}x RVOL`);
        }

        if (cvd > 0 && cvdRatio >= 58) {
          score += 10;
          reasons.push(`Bullish CVD (+${Math.round(cvd / 1000)}k, ${cvdRatio.toFixed(0)}%)`);
        } else if (cvd > 0) {
          score += 4;
          reasons.push(`Buy Order Flow (+${Math.round(cvd / 1000)}k)`);
        }

        if (item.daysHighBroken && item.daysHighBroken >= 2) {
          score += 10;
          reasons.push(`${item.daysHighBroken}-Day High Cleared`);
        } else if (item.pdRangeStatus === 'ABOVE_PDH') {
          score += 5;
          reasons.push('PDH Cleared');
        }

        if (item.reversalType === 'SUPPORT_REVERSAL') {
          score += 8;
          reasons.push('Key Support Bounce');
        }

        score = Math.min(score, 98);

        const adrPct = item.adr14 ? (item.adr14 / price) * 100 : 2.5;
        const projectedMove = Number((adrPct * (rvol > 1.5 ? 1.25 : 0.95)).toFixed(2));

        const entry = sig ? sig.entryPrice : price;
        const target = sig ? sig.targetPrice : Number((entry * (1 + (projectedMove / 100) * 0.65)).toFixed(2));
        const stop = sig ? sig.stopLossPrice : Number((entry * (1 - (adrPct / 100) * 0.35)).toFixed(2));

        bullish.push({
          stock: item,
          convictionScore: score,
          tier: score >= 90 ? 'STRONG' : score >= 80 ? 'HIGH' : 'MODERATE',
          projectedMovePct: Math.max(projectedMove, 1.5),
          signalType: 'BULLISH',
          rawTimestamp: rawTime,
          timestamp: timeStr,
          reasons,
          entryPrice: entry,
          targetPrice: target,
          stopLossPrice: stop,
          riskReward: '1 : 1.85'
        });
      }

      // Bearish Evaluation
      const isSellSignal = item.status === 'SELL_SIGNAL' || (sig && sig.type === 'SELL');
      const isBearishVol = rvol >= 1.25 && (cvd < 0 || cvdRatio <= 49);
      const isBearishBreakdown = (item.daysLowBroken && item.daysLowBroken >= 1) || item.pdRangeStatus === 'BELOW_PDL' || item.reversalType === 'RESISTANCE_REVERSAL';

      if (isSellSignal || (isBearishVol && isBearishBreakdown)) {
        let score = 72;
        const reasons: string[] = [];

        if (isSellSignal) {
          score += 10;
          reasons.push('Active ADR Breakdown');
        }
        if (rvol >= 2.0) {
          score += 10;
          reasons.push(`${rvol.toFixed(1)}x Heavy RVOL`);
        } else if (rvol >= 1.3) {
          score += 5;
          reasons.push(`${rvol.toFixed(1)}x RVOL`);
        }

        if (cvd < 0 && cvdRatio <= 42) {
          score += 10;
          reasons.push(`Bearish CVD (${Math.round(cvd / 1000)}k, ${cvdRatio.toFixed(0)}%)`);
        } else if (cvd < 0) {
          score += 4;
          reasons.push(`Sell Order Flow (${Math.round(cvd / 1000)}k)`);
        }

        if (item.daysLowBroken && item.daysLowBroken >= 2) {
          score += 10;
          reasons.push(`${item.daysLowBroken}-Day Low Broken`);
        } else if (item.pdRangeStatus === 'BELOW_PDL') {
          score += 5;
          reasons.push('PDL Broken');
        }

        if (item.reversalType === 'RESISTANCE_REVERSAL') {
          score += 8;
          reasons.push('Key Resistance Reject');
        }

        score = Math.min(score, 98);

        const adrPct = item.adr14 ? (item.adr14 / price) * 100 : 2.5;
        const projectedMove = Number((adrPct * (rvol > 1.5 ? 1.25 : 0.95)).toFixed(2));

        const entry = sig ? sig.entryPrice : price;
        const target = sig ? sig.targetPrice : Number((entry * (1 - (projectedMove / 100) * 0.65)).toFixed(2));
        const stop = sig ? sig.stopLossPrice : Number((entry * (1 + (adrPct / 100) * 0.35)).toFixed(2));

        bearish.push({
          stock: item,
          convictionScore: score,
          tier: score >= 90 ? 'STRONG' : score >= 80 ? 'HIGH' : 'MODERATE',
          projectedMovePct: Math.max(projectedMove, 1.5),
          signalType: 'BEARISH',
          rawTimestamp: rawTime,
          timestamp: timeStr,
          reasons,
          entryPrice: entry,
          targetPrice: target,
          stopLossPrice: stop,
          riskReward: '1 : 1.85'
        });
      }
    }

    const sortFn = (list: AIAlphaPick[]) => {
      return [...list].sort((a, b) => {
        let diff = 0;
        if (aiSortBy === 'SCORE') {
          diff = a.convictionScore - b.convictionScore;
          if (diff === 0) diff = a.rawTimestamp - b.rawTimestamp;
        } else if (aiSortBy === 'MOVE') {
          diff = a.projectedMovePct - b.projectedMovePct;
          if (diff === 0) diff = a.rawTimestamp - b.rawTimestamp;
        } else if (aiSortBy === 'SYMBOL') {
          diff = a.stock.symbol.localeCompare(b.stock.symbol);
          if (diff === 0) diff = a.rawTimestamp - b.rawTimestamp;
        } else {
          // TIME sort
          diff = a.rawTimestamp - b.rawTimestamp;
          if (diff === 0) diff = b.convictionScore - a.convictionScore;
        }
        return aiSortOrder === 'DESC' ? -diff : diff;
      });
    };

    return {
      bullish: sortFn(bullish),
      bearish: sortFn(bearish)
    };
  }, [results, aiSortBy, aiSortOrder]);

  return (
    <div className="space-y-3 sm:space-y-6">
      
      {/* Top Scanner Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h2 className="text-sm sm:text-lg font-bold text-slate-100">Live ADR Breakout Scanner</h2>
              <span className="text-[10px] sm:text-xs bg-emerald-500/20 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {timeframe.toUpperCase()} CANDLE CLOSE ONLY
              </span>
              <span className="text-[10px] sm:text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-md border border-slate-700">
                {universe === 'NIFTY_200' ? 'NIFTY F&O' : universe === 'US_TECH' ? 'US TECH' : 'CUSTOM'} ({results.length} Stocks)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            {/* Stock Universe Selector */}
            {setUniverse && (
              <UniverseSelector
                universe={universe}
                setUniverse={setUniverse}
                variant="dropdown"
              />
            )}

            {/* Timeframe Selector in Scanner Banner */}
            {setTimeframe && (
              <div className="flex items-center bg-slate-950 p-0.5 sm:p-1 rounded-lg border border-slate-800">
                <span className="text-[10px] sm:text-xs text-slate-400 px-1.5 hidden xs:flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" /> Timeframe:
                </span>
                <button
                  onClick={() => setTimeframe('5m')}
                  className={`px-2 py-1 text-[11px] sm:text-xs font-bold rounded-md transition-colors ${
                    timeframe === '5m'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  5-Min
                </button>
                <button
                  onClick={() => setTimeframe('15m')}
                  className={`px-2 py-1 text-[11px] sm:text-xs font-bold rounded-md transition-colors ${
                    timeframe === '15m'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  15-Min
                </button>
              </div>
            )}

            <button
              onClick={fetchScan}
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-[11px] sm:text-xs font-bold px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center space-x-1.5 transition-colors shadow-md cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Scanning...' : 'Refresh Scan'}</span>
            </button>
          </div>
        </div>

        {/* Custom Input area if universe === CUSTOM */}
        {universe === 'CUSTOM' && (
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <label className="text-xs font-medium text-slate-300 whitespace-nowrap">
              Tickers (comma separated):
            </label>
            <input
              type="text"
              value={customTickerInput}
              onChange={(e) => setCustomTickerInput(e.target.value)}
              placeholder="e.g. RELIANCE.NS, TCS.NS, INFY.NS, TMPV.NS"
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 flex-1 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={fetchScan}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700"
            >
              Apply Tickers
            </button>
          </div>
        )}

        {/* Metric Overview Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-3 mt-2.5 sm:mt-4 pt-2.5 sm:pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-2 sm:p-3 rounded-lg border border-slate-800/80">
            <span className="text-[10px] sm:text-xs text-slate-400">Total Scanned</span>
            <p className="text-sm sm:text-lg font-bold text-slate-100 font-mono">{results.length} <span className="text-[9px] sm:text-[10px] text-slate-500 font-normal">Stocks</span></p>
          </div>
          <div className="bg-emerald-500/10 p-2 sm:p-3 rounded-lg border border-emerald-500/30">
            <span className="text-[10px] sm:text-xs text-emerald-400 flex items-center gap-1 font-bold">
              <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Bullish ({timeframe})
            </span>
            <p className="text-sm sm:text-lg font-bold text-emerald-400 font-mono">{buySignals.length}</p>
          </div>
          <div className="bg-rose-500/10 p-2 sm:p-3 rounded-lg border border-rose-500/30">
            <span className="text-[10px] sm:text-xs text-rose-400 flex items-center gap-1 font-bold">
              <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Bearish ({timeframe})
            </span>
            <p className="text-sm sm:text-lg font-bold text-rose-400 font-mono">{sellSignals.length}</p>
          </div>
          <div className="bg-amber-500/10 p-2 sm:p-3 rounded-lg border border-amber-500/30">
            <span className="text-[10px] sm:text-xs text-amber-300 flex items-center gap-1 font-bold">
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> High RVOL (≥1.2x)
            </span>
            <p className="text-sm sm:text-lg font-bold text-amber-300 font-mono">
              {results.filter((r) => (r.rvol || 1.0) >= 1.2).length}
            </p>
          </div>
          <div className="bg-sky-500/10 p-2 sm:p-3 rounded-lg border border-sky-500/30 col-span-2 sm:col-span-1">
            <span className="text-[10px] sm:text-xs text-sky-400 flex items-center gap-1 font-bold">
              <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Net Order Flow (CVD)
            </span>
            <p className="text-xs font-bold text-slate-200 mt-0.5 sm:mt-1 font-mono">
              <span className="text-emerald-400">+{results.filter((r) => (r.cvd || 0) > 0).length} Buy</span>
              <span className="text-slate-500 mx-1">/</span>
              <span className="text-rose-400">{results.filter((r) => (r.cvd || 0) < 0).length} Sell</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter and View Mode Switcher */}
      <div className="flex flex-col gap-2.5 bg-slate-900 p-2.5 sm:p-4 rounded-xl border border-slate-800">
        
        {/* Top Filter Row: Search & Volume Filter Badges */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 sm:gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Filter symbol (RELIANCE, SBIN)..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-slate-700 font-mono"
            />
          </div>

          {/* Volume Filter Selector Buttons */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
            <button
              onClick={() => setVolumeFilter('ALL')}
              className={`px-2 py-1 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-lg border cursor-pointer transition-colors whitespace-nowrap ${
                volumeFilter === 'ALL'
                  ? 'bg-slate-800 text-slate-100 border-slate-600'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              All ({results.length})
            </button>
            <button
              onClick={() => setVolumeFilter('VOL_ALERTS')}
              className={`px-2 py-1 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-lg border cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1 ${
                volumeFilter === 'VOL_ALERTS'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-amber-300'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>Vol Alerts ({volumeAlertStocks.length})</span>
            </button>
            <button
              onClick={() => setVolumeFilter('MULTI_DAY')}
              className={`px-2 py-1 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-lg border cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1 ${
                volumeFilter === 'MULTI_DAY'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-emerald-300'
              }`}
            >
              <Flame className="w-3 h-3 text-emerald-400" />
              <span>Multi-Day ({multiDayBreakoutStocks.length})</span>
            </button>
            <button
              onClick={() => setVolumeFilter('REVERSALS')}
              className={`px-2 py-1 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-lg border cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1 ${
                volumeFilter === 'REVERSALS'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-purple-300'
              }`}
            >
              <RefreshCw className="w-3 h-3 text-purple-400" />
              <span>Reversals ({results.filter((r) => r.reversalType && r.reversalType !== 'NONE').length})</span>
            </button>
            <button
              onClick={() => setVolumeFilter('HIGH_RVOL')}
              className={`px-2 py-1 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-lg border cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1 ${
                volumeFilter === 'HIGH_RVOL'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-amber-300'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>RVOL ≥1.2x</span>
            </button>
            <button
              onClick={() => setVolumeFilter('BUY_CVD')}
              className={`px-2 py-1 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-lg border cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1 ${
                volumeFilter === 'BUY_CVD'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-emerald-300'
              }`}
            >
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>🟢 Buying Delta (+CVD)</span>
            </button>
            <button
              onClick={() => setVolumeFilter('SELL_CVD')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1 ${
                volumeFilter === 'SELL_CVD'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-rose-300'
              }`}
            >
              <TrendingDown className="w-3 h-3 text-rose-400" />
              <span>🔴 Selling Delta (-CVD)</span>
            </button>
          </div>
        </div>

        {/* Bottom Filter Row: Sort Mode, Time Order & View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Sort Selector */}
            <div className="flex flex-wrap items-center bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs gap-1">
              <span className="text-[11px] text-slate-400 font-medium px-1.5 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                Sort:
              </span>
              <button
                onClick={() => handleColumnHeaderClick('TIME')}
                className={`px-2 py-0.5 rounded font-bold text-[11px] transition-colors cursor-pointer ${
                  primarySort === 'TIME'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Time {renderSortArrow('TIME')}
              </button>
              <button
                onClick={() => handleColumnHeaderClick('SYMBOL')}
                className={`px-2 py-0.5 rounded font-bold text-[11px] transition-colors cursor-pointer ${
                  primarySort === 'SYMBOL'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Symbol {renderSortArrow('SYMBOL')}
              </button>
              <button
                onClick={() => handleColumnHeaderClick('RVOL')}
                className={`px-2 py-0.5 rounded font-bold text-[11px] transition-colors cursor-pointer ${
                  primarySort === 'RVOL'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                RVOL {renderSortArrow('RVOL')}
              </button>
              <button
                onClick={() => handleColumnHeaderClick('CVD')}
                className={`px-2 py-0.5 rounded font-bold text-[11px] transition-colors cursor-pointer ${
                  primarySort === 'CVD'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:text-sky-300'
                }`}
              >
                CVD {renderSortArrow('CVD')}
              </button>
              <button
                onClick={() => handleColumnHeaderClick('PRICE')}
                className={`px-2 py-0.5 rounded font-bold text-[11px] transition-colors cursor-pointer ${
                  primarySort === 'PRICE'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                LTP {renderSortArrow('PRICE')}
              </button>
              <button
                onClick={() => handleColumnHeaderClick('CHANGE')}
                className={`px-2 py-0.5 rounded font-bold text-[11px] transition-colors cursor-pointer ${
                  primarySort === 'CHANGE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Chg% {renderSortArrow('CHANGE')}
              </button>
              <button
                onClick={() => handleColumnHeaderClick('SENTIMENT')}
                className={`px-2 py-0.5 rounded font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
                  primarySort === 'SENTIMENT'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-purple-300'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                Sentiment {renderSortArrow('SENTIMENT')}
              </button>
            </div>

            {/* Explicit Ascending / Descending Toggle Buttons */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
              <span className="text-[11px] text-slate-400 font-medium px-1.5">Order:</span>
              <button
                onClick={() => setSortOrder('ASC')}
                className={`px-2.5 py-1 rounded font-extrabold text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
                  sortOrder === 'ASC'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Sort Ascending (Low to High / A to Z / Oldest)"
              >
                Ascending (Low → High ↑)
              </button>
              <button
                onClick={() => setSortOrder('DESC')}
                className={`px-2.5 py-1 rounded font-extrabold text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
                  sortOrder === 'DESC'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Sort Descending (High to Low / Z to A / Newest)"
              >
                Descending (High → Low ↓)
              </button>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setViewMode('SIDE_BY_SIDE')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border cursor-pointer ${
                viewMode === 'SIDE_BY_SIDE'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Side-by-Side Tables</span>
            </button>
            <button
              onClick={() => setViewMode('GRID')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border cursor-pointer ${
                viewMode === 'GRID'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Card Grid</span>
            </button>
          </div>

        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl flex items-center space-x-3 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 📊 DEDICATED SCANNER TABLES NAVIGATION TABS */}
      {!loading && !error && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-md">
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-black text-slate-300 px-2 uppercase tracking-wider flex items-center gap-1">
              <TableIcon className="w-4 h-4 text-emerald-400" />
              Scanner Tables:
            </span>
            {onOpenTrendingRadar && (
              <button
                onClick={onOpenTrendingRadar}
                className="px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/60 shadow-[0_0_12px_rgba(249,115,22,0.3)] animate-pulse"
                title="Open 5-Minute Advanced Trending Radar"
              >
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>⚡ 5M TRENDING RADAR</span>
                <span className="bg-orange-500 text-slate-950 text-[9px] px-1 rounded font-black">NEW</span>
              </button>
            )}
            <button
              onClick={() => setScannerTableTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                scannerTableTab === 'ALL'
                  ? 'bg-slate-100 text-slate-950 shadow-md scale-105'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>All Tables</span>
            </button>
            <button
              onClick={() => setScannerTableTab('BULLISH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                scannerTableTab === 'BULLISH'
                  ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-emerald-300'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>🟢 Bullish Breakouts ({buySignals.length})</span>
            </button>
            <button
              onClick={() => setScannerTableTab('BEARISH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                scannerTableTab === 'BEARISH'
                  ? 'bg-rose-500 text-slate-950 shadow-md scale-105'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-rose-300'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              <span>🔴 Bearish Breakdowns ({sellSignals.length})</span>
            </button>
            <button
              onClick={() => setScannerTableTab('VOLUME')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                scannerTableTab === 'VOLUME'
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-amber-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>⚡ Volume Alerts ({volumeAlertStocks.length})</span>
            </button>
            <button
              onClick={() => setScannerTableTab('MULTI_DAY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                scannerTableTab === 'MULTI_DAY'
                  ? 'bg-purple-500 text-slate-950 shadow-md scale-105'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-purple-300'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-purple-400" />
              <span>🔥 Multi-Day & Reversals ({multiDayBreakoutStocks.length + reversalStocks.length})</span>
            </button>
            <button
              onClick={() => setScannerTableTab('WATCHLIST')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                scannerTableTab === 'WATCHLIST'
                  ? 'bg-sky-500 text-slate-950 shadow-md scale-105'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-sky-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>📋 Watchlist Matrix ({filteredResults.length})</span>
            </button>
            <button
              onClick={() => setScannerTableTab('HEATMAP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                scannerTableTab === 'HEATMAP'
                  ? 'bg-gradient-to-r from-emerald-500 to-amber-500 text-slate-950 shadow-md scale-105 font-black'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-amber-300'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>🔥 Visual Heatmap Widget</span>
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-400" />
          <p className="text-sm font-medium">Scanning NIFTY 200 stocks with ADR and {timeframe} closed candles...</p>
        </div>
      ) : scannerTableTab === 'HEATMAP' ? (
        <VisualHeatmapWidget
          results={results}
          onSelectSymbolForChart={onSelectSymbolForChart}
          onOpenChartModal={onOpenChartModal}
          timeframe={timeframe}
        />
      ) : viewMode === 'SIDE_BY_SIDE' ? (
        /* SIDE BY SIDE TABLES VIEW */
        <div className="space-y-6">
          <div className={`grid grid-cols-1 ${scannerTableTab === 'ALL' ? 'lg:grid-cols-2' : ''} gap-6`}>
            
            {/* BULLISH BREAKOUTS TABLE */}
            {(scannerTableTab === 'ALL' || scannerTableTab === 'BULLISH') && (
            <div className="bg-slate-900 border border-emerald-500/30 rounded-xl overflow-hidden shadow-lg flex flex-col">
              <div className="bg-emerald-950/40 border-b border-emerald-500/30 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-emerald-400 uppercase tracking-wider">
                      Bullish Breakouts (BUY)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Closed {timeframe} candle ABOVE ADR Resistance
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-1 rounded-full border border-emerald-500/30 font-mono">
                  {buySignals.length} Active
                </span>
              </div>

              <div className="flex-1 overflow-auto max-h-[62vh] relative">
                {buySignals.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No Bullish breakouts detected on current {timeframe} candles.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 z-20 bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800 shadow-md">
                      <tr>
                        <th 
                          className="py-2.5 px-3 cursor-pointer select-none hover:text-emerald-300 transition-colors"
                          onClick={() => handleColumnHeaderClick('SYMBOL')}
                          title="Click to sort by Symbol (Ascending / Descending)"
                        >
                          Symbol {renderSortArrow('SYMBOL')}
                        </th>
                        <th 
                          className="py-2.5 px-3 cursor-pointer select-none hover:text-emerald-300 transition-colors"
                          onClick={() => handleColumnHeaderClick('TIME')}
                          title="Click to sort by Signal Time (Ascending / Descending)"
                        >
                          Signal Time {renderSortArrow('TIME')}
                        </th>
                        <th 
                          className="py-2.5 px-3 cursor-pointer select-none hover:text-emerald-300 transition-colors"
                          onClick={() => handleColumnHeaderClick('PRICE')}
                          title="Click to sort by Price (Ascending / Descending)"
                        >
                          LTP {renderSortArrow('PRICE')}
                        </th>
                        <th 
                          className="py-2.5 px-3 text-purple-300 cursor-pointer select-none hover:underline"
                          onClick={() => handleColumnHeaderClick('SENTIMENT')}
                          title="Click to sort by AI Sentiment Score"
                        >
                          AI Sentiment {renderSortArrow('SENTIMENT')}
                        </th>
                        <th 
                          className="py-2.5 px-3 text-emerald-300 cursor-pointer select-none hover:underline"
                          onClick={() => handleColumnHeaderClick('MULTI_DAY')}
                          title="Click to sort by Multi-Day Breakout context"
                        >
                          Breakout Context {renderSortArrow('MULTI_DAY')}
                        </th>
                        <th 
                          className="py-2.5 px-3 text-amber-400 cursor-pointer select-none hover:underline"
                          onClick={() => handleColumnHeaderClick('RVOL')}
                          title="Click to sort by Relative Volume (RVOL)"
                        >
                          RVOL {renderSortArrow('RVOL')}
                        </th>
                        <th 
                          className="py-2.5 px-3 text-sky-400 cursor-pointer select-none hover:underline"
                          onClick={() => handleColumnHeaderClick('CVD')}
                          title="Click to sort by Cumulative Volume Delta (CVD)"
                        >
                          CVD Delta {renderSortArrow('CVD')}
                        </th>
                        <th className="py-2.5 px-3">Entry</th>
                        <th className="py-2.5 px-3 text-emerald-400">Target (+1%)</th>
                        <th className="py-2.5 px-3 text-rose-400">Stop Loss (-1%)</th>
                        <th className="py-2.5 px-3 text-right">Chart</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {buySignals.map((item, idx) => {
                        const sig = item.activeSignal;
                        return (
                          <tr key={`${item.symbol}_buy_${idx}`} className="hover:bg-emerald-500/5 transition-colors">
                            <td className="py-3 px-3 font-extrabold text-slate-100 font-sans">
                              <button
                                onClick={() => onSelectSymbolForChart(item.symbol)}
                                className="hover:text-emerald-400 hover:underline cursor-pointer transition-colors text-left font-extrabold"
                                title={`Click to open chart for ${item.symbol}`}
                              >
                                {item.symbol}
                              </button>
                            </td>
                            <td className="py-3 px-3 text-emerald-400 font-medium whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                <Clock className="w-3 h-3 text-emerald-400" />
                                {formatSignalTime(sig?.timestamp || item.lastUpdated)}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-200">
                              ₹{item.latestPrice.toFixed(2)}
                            </td>
                            <td className="py-3 px-3">
                              <SentimentGauge
                                reasons={
                                  sig
                                    ? [
                                        sig.breakoutContextAtSignal || '',
                                        sig.breakoutShortTag || '',
                                        'ADR Breakout Active',
                                        item.daysHighBroken && item.daysHighBroken >= 2
                                          ? `${item.daysHighBroken}-Day High Cleared`
                                          : '',
                                        (item.rvol || 1) >= 1.3 ? `${item.rvol?.toFixed(1)}x RVOL` : '',
                                        (item.cvd || 0) > 0 ? `+${Math.round((item.cvd || 0) / 1000)}k Buy CVD` : ''
                                      ].filter(Boolean)
                                    : ['ADR Breakout Active']
                                }
                                stock={item}
                                signalType="BULLISH"
                              />
                            </td>
                            <td className="py-3 px-3 font-sans">
                              {sig?.isInsidePdRangeAtBreakout || item.isInsidePdRangeAtBreakout ? (
                                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded inline-flex items-center gap-1 whitespace-nowrap" title={sig?.breakoutContextAtSignal || item.breakoutContextAtSignal || "Breakout occurred inside yesterday's range (PDL - PDH)"}>
                                  <Flame className="w-3 h-3 text-amber-400" />
                                  Inside Prev Day Range
                                </span>
                              ) : (sig?.breakoutShortTag || item.breakoutShortTag) ? (
                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded inline-flex items-center gap-1 whitespace-nowrap" title={sig?.breakoutContextAtSignal || item.breakoutContextAtSignal}>
                                  <Flame className="w-3 h-3 text-emerald-400" />
                                  {sig?.breakoutShortTag || item.breakoutShortTag}
                                </span>
                              ) : item.daysHighBroken && item.daysHighBroken >= 2 ? (
                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded inline-flex items-center gap-1 whitespace-nowrap" title={`Broke ${item.daysHighBroken} consecutive daily highs`}>
                                  <Flame className="w-3 h-3 text-emerald-400" />
                                  {item.daysHighBroken}-Day High
                                </span>
                              ) : item.pdRangeStatus === 'ABOVE_PDH' ? (
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap" title={`Above Yesterday's High ₹${item.pdh}`}>
                                  Broke PDH (₹{item.pdh})
                                </span>
                              ) : (
                                <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded whitespace-nowrap">
                                  Inside PD Range
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                (item.rvol || 1.0) >= 1.4
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : (item.rvol || 1.0) >= 1.1
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}>
                                {(item.rvol || 1.0).toFixed(2)}x
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                (item.cvd || 0) > 0
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : (item.cvd || 0) < 0
                                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}>
                                {(item.cvd || 0) > 0 ? `+${(item.cvd || 0).toLocaleString()}` : (item.cvd || 0).toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-100 font-bold">
                              ₹{sig?.entryPrice.toFixed(2) || item.latestPrice.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-emerald-400 font-bold">
                              ₹{sig?.targetPrice.toFixed(2) || (item.latestPrice * 1.01).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-rose-400 font-bold">
                              ₹{sig?.stopLossPrice.toFixed(2) || (item.latestPrice * 0.99).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => onOpenChartModal ? onOpenChartModal(item.symbol) : onSelectSymbolForChart(item.symbol)}
                                className="text-emerald-400 hover:text-emerald-300 p-1.5 rounded-md hover:bg-slate-800 transition-colors inline-flex items-center gap-0.5"
                                title="View Chart"
                              >
                                <BarChart3 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            )}

            {/* BEARISH BREAKDOWNS TABLE */}
            {(scannerTableTab === 'ALL' || scannerTableTab === 'BEARISH') && (
            <div className="bg-slate-900 border border-rose-500/30 rounded-xl overflow-hidden shadow-lg flex flex-col">
              <div className="bg-rose-950/40 border-b border-rose-500/30 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-rose-500/20 rounded-lg text-rose-400">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-rose-400 uppercase tracking-wider">
                      Bearish Breakdowns (SELL)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Closed {timeframe} candle BELOW ADR Support
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-rose-500/20 text-rose-300 font-bold px-2.5 py-1 rounded-full border border-rose-500/30 font-mono">
                  {sellSignals.length} Active
                </span>
              </div>

              <div className="flex-1 overflow-auto max-h-[62vh] relative">
                {sellSignals.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No Bearish breakdowns detected on current {timeframe} candles.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 z-20 bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800 shadow-md">
                      <tr>
                        <th 
                          className="py-2.5 px-3 cursor-pointer select-none hover:text-rose-300 transition-colors"
                          onClick={() => handleColumnHeaderClick('SYMBOL')}
                          title="Click to sort by Symbol (Ascending / Descending)"
                        >
                          Symbol {renderSortArrow('SYMBOL')}
                        </th>
                        <th 
                          className="py-2.5 px-3 cursor-pointer select-none hover:text-rose-300 transition-colors"
                          onClick={() => handleColumnHeaderClick('TIME')}
                          title="Click to sort by Signal Time (Ascending / Descending)"
                        >
                          Signal Time {renderSortArrow('TIME')}
                        </th>
                        <th 
                          className="py-2.5 px-3 cursor-pointer select-none hover:text-rose-300 transition-colors"
                          onClick={() => handleColumnHeaderClick('PRICE')}
                          title="Click to sort by Price (Ascending / Descending)"
                        >
                          LTP {renderSortArrow('PRICE')}
                        </th>
                        <th 
                          className="py-2.5 px-3 text-purple-300 cursor-pointer select-none hover:underline"
                          onClick={() => handleColumnHeaderClick('SENTIMENT')}
                          title="Click to sort by AI Sentiment Score"
                        >
                          AI Sentiment {renderSortArrow('SENTIMENT')}
                        </th>
                        <th 
                          className="py-2.5 px-3 text-rose-300 cursor-pointer select-none hover:underline"
                          onClick={() => handleColumnHeaderClick('MULTI_DAY')}
                          title="Click to sort by Multi-Day Breakdown context"
                        >
                          Breakdown Context {renderSortArrow('MULTI_DAY')}
                        </th>
                        <th 
                          className="py-2.5 px-3 text-amber-400 cursor-pointer select-none hover:underline"
                          onClick={() => handleColumnHeaderClick('RVOL')}
                          title="Click to sort by Relative Volume (RVOL)"
                        >
                          RVOL {renderSortArrow('RVOL')}
                        </th>
                        <th 
                          className="py-2.5 px-3 text-sky-400 cursor-pointer select-none hover:underline"
                          onClick={() => handleColumnHeaderClick('CVD')}
                          title="Click to sort by Cumulative Volume Delta (CVD)"
                        >
                          CVD Delta {renderSortArrow('CVD')}
                        </th>
                        <th className="py-2.5 px-3">Entry</th>
                        <th className="py-2.5 px-3 text-emerald-400">Target (-1%)</th>
                        <th className="py-2.5 px-3 text-rose-400">Stop Loss (+1%)</th>
                        <th className="py-2.5 px-3 text-right">Chart</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {sellSignals.map((item, idx) => {
                        const sig = item.activeSignal;
                        return (
                          <tr key={`${item.symbol}_sell_${idx}`} className="hover:bg-rose-500/5 transition-colors">
                            <td className="py-3 px-3 font-extrabold text-slate-100 font-sans">
                              <button
                                onClick={() => onSelectSymbolForChart(item.symbol)}
                                className="hover:text-rose-400 hover:underline cursor-pointer transition-colors text-left font-extrabold"
                                title={`Click to open chart for ${item.symbol}`}
                              >
                                {item.symbol}
                              </button>
                            </td>
                            <td className="py-3 px-3 text-rose-400 font-medium whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                <Clock className="w-3 h-3 text-rose-400" />
                                {formatSignalTime(sig?.timestamp || item.lastUpdated)}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-200">
                              ₹{item.latestPrice.toFixed(2)}
                            </td>
                            <td className="py-3 px-3">
                              <SentimentGauge
                                reasons={
                                  sig
                                    ? [
                                        sig.breakoutContextAtSignal || '',
                                        sig.breakoutShortTag || '',
                                        'ADR Breakdown Active',
                                        item.daysLowBroken && item.daysLowBroken >= 2
                                          ? `${item.daysLowBroken}-Day Low Broken`
                                          : '',
                                        (item.rvol || 1) >= 1.3 ? `${item.rvol?.toFixed(1)}x RVOL` : '',
                                        (item.cvd || 0) < 0 ? `${Math.round((item.cvd || 0) / 1000)}k Sell CVD` : ''
                                      ].filter(Boolean)
                                    : ['ADR Breakdown Active']
                                }
                                stock={item}
                                signalType="BEARISH"
                              />
                            </td>
                            <td className="py-3 px-3 font-sans">
                              {sig?.isInsidePdRangeAtBreakout || item.isInsidePdRangeAtBreakout ? (
                                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded inline-flex items-center gap-1 whitespace-nowrap" title={sig?.breakoutContextAtSignal || item.breakoutContextAtSignal || "Breakdown occurred inside yesterday's range (PDL - PDH)"}>
                                  <TrendingDown className="w-3 h-3 text-amber-400" />
                                  Inside Prev Day Range
                                </span>
                              ) : (sig?.breakoutShortTag || item.breakoutShortTag) ? (
                                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded inline-flex items-center gap-1 whitespace-nowrap" title={sig?.breakoutContextAtSignal || item.breakoutContextAtSignal}>
                                  <TrendingDown className="w-3 h-3 text-rose-400" />
                                  {sig?.breakoutShortTag || item.breakoutShortTag}
                                </span>
                              ) : item.daysLowBroken && item.daysLowBroken >= 2 ? (
                                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded inline-flex items-center gap-1 whitespace-nowrap" title={`Broke ${item.daysLowBroken} consecutive daily lows`}>
                                  <TrendingDown className="w-3 h-3 text-rose-400" />
                                  {item.daysLowBroken}-Day Low
                                </span>
                              ) : item.pdRangeStatus === 'BELOW_PDL' ? (
                                <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap" title={`Below Yesterday's Low ₹${item.pdl}`}>
                                  Broke PDL (₹{item.pdl})
                                </span>
                              ) : (
                                <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded whitespace-nowrap">
                                  Inside PD Range
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                (item.rvol || 1.0) >= 1.4
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : (item.rvol || 1.0) >= 1.1
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}>
                                {(item.rvol || 1.0).toFixed(2)}x
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                (item.cvd || 0) > 0
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : (item.cvd || 0) < 0
                                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}>
                                {(item.cvd || 0) > 0 ? `+${(item.cvd || 0).toLocaleString()}` : (item.cvd || 0).toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-100 font-bold">
                              ₹{sig?.entryPrice.toFixed(2) || item.latestPrice.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-emerald-400 font-bold">
                              ₹{sig?.targetPrice.toFixed(2) || (item.latestPrice * 0.99).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-rose-400 font-bold">
                              ₹{sig?.stopLossPrice.toFixed(2) || (item.latestPrice * 1.01).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => onOpenChartModal ? onOpenChartModal(item.symbol) : onSelectSymbolForChart(item.symbol)}
                                className="text-emerald-400 hover:text-emerald-300 p-1.5 rounded-md hover:bg-slate-800 transition-colors inline-flex items-center gap-0.5"
                                title="View Chart"
                              >
                                <BarChart3 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            )}

          </div>

          {/* UNUSUAL VOLUME & ORDER FLOW ALERTS RADAR TABLE */}
          {(scannerTableTab === 'ALL' || scannerTableTab === 'VOLUME') && (
          <div className="bg-slate-900 border border-amber-500/40 rounded-xl overflow-hidden shadow-lg">
            <div className="bg-amber-950/30 border-b border-amber-500/30 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-amber-500/20 rounded-lg text-amber-300">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    ⚡ Unusual Volume & Order Flow Alerts (RVOL / CVD Surge)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Real-time alerts for stocks exhibiting abnormal relative volume (RVOL ≥ 1.25x) or aggressive institutional order flow (CVD Surge)
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="bg-amber-500/20 text-amber-300 font-bold px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  {volumeAlertStocks.length} Volume Spike Alerts
                </span>
              </div>
            </div>

            <div className="overflow-auto max-h-[62vh] relative">
              {volumeAlertStocks.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No unusual RVOL or CVD volume spikes detected across scanned universe right now.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 z-20 bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800 shadow-md">
                    <tr>
                      <th className="py-2.5 px-3">Symbol</th>
                      <th 
                        className="py-2.5 px-3 cursor-pointer select-none hover:text-amber-300 transition-colors"
                        onClick={() => handleColumnHeaderClick('TIME')}
                        title="Click to sort by Alert Time"
                      >
                        Alert Time {renderSortArrow('TIME')}
                      </th>
                      <th 
                        className="py-2.5 px-3 text-purple-300 cursor-pointer select-none hover:underline"
                        onClick={() => handleColumnHeaderClick('SENTIMENT')}
                        title="Click to sort by AI Sentiment Score"
                      >
                        AI Sentiment {renderSortArrow('SENTIMENT')}
                      </th>
                      <th className="py-2.5 px-3">Alert Severity</th>
                      <th className="py-2.5 px-3">Alert Description & Spike Reason</th>
                      <th className="py-2.5 px-3 text-amber-400">RVOL</th>
                      <th className="py-2.5 px-3 text-sky-400">Net CVD Delta</th>
                      <th className="py-2.5 px-3">Price (Day %)</th>
                      <th className="py-2.5 px-3">Breakout Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {volumeAlertStocks.map((item, idx) => {
                      const alert = item.volumeAlert!;
                      const isExtreme = alert.severity === 'EXTREME';
                      const isHigh = alert.severity === 'HIGH';

                      return (
                        <tr key={`${item.symbol}_vol_${idx}`} className="hover:bg-amber-500/5 transition-colors">
                          <td className="py-3 px-3 font-extrabold text-slate-100 font-sans">
                            <button
                              onClick={() => onSelectSymbolForChart(item.symbol)}
                              className="hover:text-amber-400 hover:underline cursor-pointer transition-colors text-left font-extrabold text-sm flex items-center gap-1.5"
                              title={`Click to open chart for ${item.symbol}`}
                            >
                              <span>{item.symbol}</span>
                              {isExtreme && (
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-3 text-amber-300 font-medium whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[11px]">
                              <Clock className="w-3 h-3 text-amber-400" />
                              {formatSignalTime(item.volumeAlert?.timestamp || item.activeSignal?.timestamp || item.lastUpdated)}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <SentimentGauge
                              reasons={[
                                alert.title,
                                alert.description,
                                alert.type === 'CVD_BUY_SURGE'
                                  ? 'Buy Order Flow Surge'
                                  : alert.type === 'CVD_SELL_SURGE'
                                  ? 'Sell Order Flow Surge'
                                  : 'Abnormal RVOL Spike'
                              ]}
                              stock={item}
                            />
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded border text-[10px] ${
                              isExtreme
                                ? 'bg-amber-500/30 text-amber-300 border-amber-500/50 shadow-sm'
                                : isHigh
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              {alert.severity === 'EXTREME' ? '🔥 EXTREME' : alert.severity === 'HIGH' ? '⚡ HIGH' : 'MODERATE'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-sans text-xs max-w-sm">
                            <div className="font-bold text-amber-300 flex items-center gap-1 text-[11px]">
                              {alert.title}
                            </div>
                            <div className="text-[11px] text-slate-300">
                              {alert.description}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold border bg-amber-500/20 text-amber-300 border-amber-500/40">
                              {item.rvol?.toFixed(2)}x
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                              (item.cvd || 0) > 0
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : (item.cvd || 0) < 0
                                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {(item.cvd || 0) > 0 ? `+${(item.cvd || 0).toLocaleString()}` : (item.cvd || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-100 font-bold">
                            ₹{item.latestPrice.toFixed(2)}{' '}
                            <span className={`text-[10px] font-normal ${
                              (item.priceChangePct || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              ({(item.priceChangePct || 0) >= 0 ? '+' : ''}{item.priceChangePct}%)
                            </span>
                          </td>
                          <td className="py-3 px-3 font-sans">
                            {item.status === 'BUY_SIGNAL' && (
                              <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30 text-[10px]">
                                🟢 BREAKOUT
                              </span>
                            )}
                            {item.status === 'SELL_SIGNAL' && (
                              <span className="bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded border border-rose-500/30 text-[10px]">
                                🔴 BREAKDOWN
                              </span>
                            )}
                            {item.status === 'NEUTRAL' && (
                              <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px]">
                                NEUTRAL
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-sans">
                            <button
                              onClick={() => onOpenChartModal ? onOpenChartModal(item.symbol) : onSelectSymbolForChart(item.symbol)}
                              className="text-amber-400 hover:text-amber-300 font-bold text-xs hover:underline cursor-pointer inline-flex items-center gap-1"
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
              )}
            </div>
          </div>
          )}

          {/* SEPARATE REVERSAL SETUPS TABLE */}
          {(scannerTableTab === 'ALL' || scannerTableTab === 'MULTI_DAY') && (
          <div className="bg-slate-900 border border-purple-500/40 rounded-xl overflow-hidden shadow-lg">
            <div className="bg-purple-950/40 border-b border-purple-500/30 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-purple-500/20 rounded-lg text-purple-300">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-purple-300 uppercase tracking-wider flex items-center gap-2">
                    ADR Reversal Radar (Retesting & Turning at ADR Levels)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Stocks that tested ADR Resistance (Open + ADR) & rejected/falling, or tested ADR Support (Open - ADR) & bouncing up
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="bg-rose-500/20 text-rose-300 font-bold px-2.5 py-1 rounded-full border border-rose-500/30">
                  🔴 {resistanceReversals.length} Resistance Rejections
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
                  🟢 {supportReversals.length} Support Bounces
                </span>
              </div>
            </div>

            <div className="overflow-auto max-h-[62vh] relative">
              {reversalStocks.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No active ADR Reversal setups detected right now across scanned universe.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 z-20 bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800 shadow-md">
                    <tr>
                      <th className="py-2.5 px-3">Symbol</th>
                      <th className="py-2.5 px-3">Reversal Type</th>
                      <th 
                        className="py-2.5 px-3 text-purple-300 cursor-pointer select-none hover:underline"
                        onClick={() => handleColumnHeaderClick('SENTIMENT')}
                        title="Click to sort by AI Sentiment Score"
                      >
                        AI Sentiment {renderSortArrow('SENTIMENT')}
                      </th>
                      <th className="py-2.5 px-3">Tested Level</th>
                      <th className="py-2.5 px-3">Day Extreme (High/Low)</th>
                      <th className="py-2.5 px-3">LTP (Current)</th>
                      <th className="py-2.5 px-3">Reversal Movement / Reason</th>
                      <th className="py-2.5 px-3 text-amber-400">RVOL</th>
                      <th className="py-2.5 px-3 text-sky-400">CVD Delta</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {reversalStocks.map((item, idx) => {
                      const isRes = item.reversalType === 'RESISTANCE_REVERSAL';
                      return (
                        <tr key={`${item.symbol}_rev_${idx}`} className={isRes ? 'hover:bg-rose-500/5 transition-colors' : 'hover:bg-emerald-500/5 transition-colors'}>
                          <td className="py-3 px-3 font-extrabold text-slate-100 font-sans">
                            <button
                              onClick={() => onSelectSymbolForChart(item.symbol)}
                              className="hover:text-purple-400 hover:underline cursor-pointer transition-colors text-left font-extrabold text-sm"
                              title={`Click to open chart for ${item.symbol}`}
                            >
                              {item.symbol}
                            </button>
                          </td>
                          <td className="py-3 px-3">
                            {isRes ? (
                              <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded border border-rose-500/30 text-[10px]">
                                🔴 RESISTANCE REJECTION
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30 text-[10px]">
                                🟢 SUPPORT BOUNCE
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <SentimentGauge
                              reasons={[
                                item.reversalReason || '',
                                isRes ? 'Resistance Rejection' : 'Support Bounce',
                                (item.rvol || 1) >= 1.25 ? `${item.rvol?.toFixed(1)}x RVOL` : ''
                              ].filter(Boolean)}
                              stock={item}
                            />
                          </td>
                          <td className="py-3 px-3 font-bold">
                            {isRes ? (
                              <span className="text-emerald-400">Res ₹{item.resistance.toFixed(2)}</span>
                            ) : (
                              <span className="text-rose-400">Supp ₹{item.support.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            {isRes ? (
                              <span>Day High ₹{item.todaysHigh?.toFixed(2)}</span>
                            ) : (
                              <span>Day Low ₹{item.todaysLow?.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-100 font-bold">
                            ₹{item.latestPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 font-sans text-xs">
                            <span className={isRes ? 'text-rose-300 font-medium' : 'text-emerald-300 font-medium'}>
                              {item.reversalReason}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                              (item.rvol || 1.0) >= 1.4
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : (item.rvol || 1.0) >= 1.1
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {(item.rvol || 1.0).toFixed(2)}x
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                              (item.cvd || 0) > 0
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : (item.cvd || 0) < 0
                                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {(item.cvd || 0) > 0 ? `+${(item.cvd || 0).toLocaleString()}` : (item.cvd || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-sans">
                            <button
                              onClick={() => onOpenChartModal ? onOpenChartModal(item.symbol) : onSelectSymbolForChart(item.symbol)}
                              className="text-purple-400 hover:text-purple-300 p-1.5 rounded-md hover:bg-slate-800 transition-colors inline-flex items-center gap-1 font-medium text-xs hover:underline"
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
              )}
            </div>
          </div>
          )}

          {/* ALL MONITORED STOCKS MATRIX TABLE */}
          {(scannerTableTab === 'ALL' || scannerTableTab === 'WATCHLIST') && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="bg-slate-950/60 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-slate-400" />
                <h3 className="font-bold text-sm text-slate-200">
                  All Monitored Stock Levels ({filteredResults.length} Tickers)
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Fixed Daily Resistance (Open + ADR) & Support (Open - ADR)
              </span>
            </div>

            <div className="overflow-auto max-h-[62vh] relative">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-20 bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800 shadow-md">
                  <tr>
                    <th 
                      className="py-3 px-4 cursor-pointer select-none hover:text-slate-100 transition-colors"
                      onClick={() => handleColumnHeaderClick('SYMBOL')}
                      title="Click to sort by Symbol"
                    >
                      Symbol {renderSortArrow('SYMBOL')}
                    </th>
                    <th className="py-3 px-4">Status</th>
                    <th 
                      className="py-3 px-4 text-purple-300 cursor-pointer select-none hover:underline"
                      onClick={() => handleColumnHeaderClick('SENTIMENT')}
                      title="Click to sort by AI Sentiment Score"
                    >
                      AI Sentiment {renderSortArrow('SENTIMENT')}
                    </th>
                    <th 
                      className="py-3 px-4 cursor-pointer select-none hover:text-slate-100 transition-colors"
                      onClick={() => handleColumnHeaderClick('PRICE')}
                      title="Click to sort by LTP Price"
                    >
                      LTP {renderSortArrow('PRICE')}
                    </th>
                    <th 
                      className="py-3 px-3 text-emerald-300 cursor-pointer select-none hover:underline"
                      onClick={() => handleColumnHeaderClick('MULTI_DAY')}
                      title="Click to sort by Multi-Day status"
                    >
                      Multi-Day / PD Range {renderSortArrow('MULTI_DAY')}
                    </th>
                    <th 
                      className="py-3 px-3 text-amber-400 cursor-pointer select-none hover:underline"
                      onClick={() => handleColumnHeaderClick('RVOL')}
                      title="Click to sort by Relative Volume"
                    >
                      RVOL {renderSortArrow('RVOL')}
                    </th>
                    <th 
                      className="py-3 px-3 text-sky-400 cursor-pointer select-none hover:underline"
                      onClick={() => handleColumnHeaderClick('CVD')}
                      title="Click to sort by CVD Delta"
                    >
                      CVD Delta {renderSortArrow('CVD')}
                    </th>
                    <th className="py-3 px-4">Today Open</th>
                    <th className="py-3 px-4">ADR</th>
                    <th className="py-3 px-4 text-emerald-400">Resistance</th>
                    <th className="py-3 px-4 text-rose-400">Support</th>
                    <th className="py-3 px-4">Dist to Res</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredResults.map((item, idx) => {
                    const isBuy = item.status === 'BUY_SIGNAL';
                    const isSell = item.status === 'SELL_SIGNAL';
                    const distToResPct = (((item.resistance - item.latestPrice) / item.latestPrice) * 100).toFixed(2);

                    return (
                      <tr key={`${item.symbol}_filt_${idx}`} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-slate-100 font-sans">
                          <button
                            onClick={() => onOpenChartModal ? onOpenChartModal(item.symbol) : onSelectSymbolForChart(item.symbol)}
                            className="hover:text-emerald-400 hover:underline cursor-pointer transition-colors text-left font-bold"
                            title={`Click to open quick popup chart for ${item.symbol}`}
                          >
                            {item.symbol}
                          </button>
                        </td>
                        <td className="py-2.5 px-4 font-sans">
                          {isBuy && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                              BUY
                            </span>
                          )}
                          {isSell && (
                            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                              SELL
                            </span>
                          )}
                          {!isBuy && !isSell && (
                            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                              NEUTRAL
                            </span>
                          )}
                          {item.reversalType === 'RESISTANCE_REVERSAL' && (
                            <span className="text-[10px] font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30 ml-1" title={item.reversalReason}>
                              RES REJECT
                            </span>
                          )}
                          {item.reversalType === 'SUPPORT_REVERSAL' && (
                            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 ml-1" title={item.reversalReason}>
                              SUPP BOUNCE
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          <SentimentGauge
                            reasons={[
                              item.activeSignal?.breakoutContextAtSignal || '',
                              item.activeSignal?.breakoutShortTag || '',
                              item.volumeAlert?.title || '',
                              item.volumeAlert?.description || '',
                              item.reversalReason || '',
                              item.daysHighBroken && item.daysHighBroken >= 2 ? `${item.daysHighBroken}-Day High` : '',
                              item.daysLowBroken && item.daysLowBroken >= 2 ? `${item.daysLowBroken}-Day Low` : '',
                              (item.rvol || 1) >= 1.3 ? `${item.rvol?.toFixed(1)}x RVOL` : '',
                              (item.cvd || 0) > 0 ? `+${Math.round((item.cvd || 0) / 1000)}k Buy CVD` : (item.cvd || 0) < 0 ? `${Math.round((item.cvd || 0) / 1000)}k Sell CVD` : ''
                            ].filter(Boolean)}
                            stock={item}
                            signalType={isBuy ? 'BULLISH' : isSell ? 'BEARISH' : 'NEUTRAL'}
                          />
                        </td>
                        <td className="py-2.5 px-4 text-slate-200 font-semibold">
                          ₹{item.latestPrice.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          {item.daysHighBroken && item.daysHighBroken >= 2 ? (
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded inline-flex items-center gap-1 whitespace-nowrap" title={`Broke ${item.daysHighBroken} consecutive daily highs`}>
                              <Flame className="w-3 h-3 text-emerald-400" />
                              {item.daysHighBroken}-D High
                            </span>
                          ) : item.daysLowBroken && item.daysLowBroken >= 2 ? (
                            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded inline-flex items-center gap-1 whitespace-nowrap" title={`Broke ${item.daysLowBroken} consecutive daily lows`}>
                              <TrendingDown className="w-3 h-3 text-rose-400" />
                              {item.daysLowBroken}-D Low
                            </span>
                          ) : item.pdRangeStatus === 'ABOVE_PDH' ? (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap" title={`Above Yesterday's High ₹${item.pdh}`}>
                              Broke PDH
                            </span>
                          ) : item.pdRangeStatus === 'BELOW_PDL' ? (
                            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap" title={`Below Yesterday's Low ₹${item.pdl}`}>
                              Broke PDL
                            </span>
                          ) : (
                            <span className="bg-slate-800/80 text-slate-400 text-[10px] px-2 py-0.5 rounded whitespace-nowrap">
                              Inside Range
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                            (item.rvol || 1.0) >= 1.4
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : (item.rvol || 1.0) >= 1.1
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {(item.rvol || 1.0).toFixed(2)}x
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                            (item.cvd || 0) > 0
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : (item.cvd || 0) < 0
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {(item.cvd || 0) > 0 ? `+${(item.cvd || 0).toLocaleString()}` : (item.cvd || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-400">
                          ₹{item.todaysOpen.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-slate-300">
                          ₹{item.adr14.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-emerald-400 font-semibold">
                          ₹{item.resistance.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-rose-400 font-semibold">
                          ₹{item.support.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-slate-400">
                          {item.latestPrice > item.resistance ? (
                            <span className="text-emerald-400 font-bold">+Breakout</span>
                          ) : item.latestPrice < item.support ? (
                            <span className="text-rose-400 font-bold">-Breakdown</span>
                          ) : (
                            <span>{distToResPct}%</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right font-sans">
                          <button
                            onClick={() => onOpenChartModal ? onOpenChartModal(item.symbol) : onSelectSymbolForChart(item.symbol)}
                            className="text-amber-400 hover:text-amber-300 text-xs font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
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

        </div>
      ) : (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedFilteredResults.map((item, idx) => {
            const isBuy = item.status === 'BUY_SIGNAL';
            const isSell = item.status === 'SELL_SIGNAL';

            const distToResPct = (((item.resistance - item.latestPrice) / item.latestPrice) * 100).toFixed(2);
            const distToSuppPct = (((item.latestPrice - item.support) / item.latestPrice) * 100).toFixed(2);

            return (
              <div
                key={`${item.symbol}_grid_${idx}`}
                className={`bg-slate-900 border rounded-xl p-5 space-y-4 transition-all duration-200 hover:border-slate-700 shadow-md ${
                  isBuy
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : isSell
                    ? 'border-rose-500/40 bg-rose-950/10'
                    : 'border-slate-800'
                }`}
              >
                {/* Header: Symbol & Status Badge */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3
                      onClick={() => onOpenChartModal ? onOpenChartModal(item.symbol) : onSelectSymbolForChart(item.symbol)}
                      className="font-extrabold text-base text-slate-100 tracking-tight hover:text-emerald-400 cursor-pointer transition-colors"
                      title={`Click to open quick popup chart for ${item.symbol}`}
                    >
                      {item.symbol}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">LTP: ₹{item.latestPrice.toFixed(2)}</p>
                  </div>

                  {isBuy && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30">
                      <ArrowUpRight className="w-3.5 h-3.5" /> BUY SIGNAL
                    </span>
                  )}
                  {isSell && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/30">
                      <ArrowDownRight className="w-3.5 h-3.5" /> SELL SIGNAL
                    </span>
                  )}
                  {!isBuy && !isSell && (
                    <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                      NEUTRAL
                    </span>
                  )}
                </div>

                {/* Level Grid */}
                <div className="grid grid-cols-3 gap-2 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-medium">Today Open</span>
                    <span className="font-mono font-semibold text-slate-200">₹{item.todaysOpen.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-medium">ADR</span>
                    <span className="font-mono font-semibold text-slate-200">₹{item.adr14.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-emerald-400 text-[10px] block uppercase font-semibold">Resistance</span>
                    <span className="font-mono font-bold text-emerald-400">₹{item.resistance.toFixed(2)}</span>
                  </div>
                </div>

                {/* RVOL & Order Flow (CVD) Bar */}
                <div className="flex items-center justify-between text-xs bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-800/60 font-mono">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] text-slate-400">RVOL:</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                      (item.rvol || 1.0) >= 1.4
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    }`}>
                      {(item.rvol || 1.0).toFixed(2)}x
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] text-slate-400">CVD:</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                      (item.cvd || 0) > 0
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : (item.cvd || 0) < 0
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {(item.cvd || 0) > 0 ? `+${(item.cvd || 0).toLocaleString()}` : (item.cvd || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* AI Sentiment Gauge */}
                <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    AI Sentiment:
                  </span>
                  <SentimentGauge
                    reasons={[
                      item.activeSignal?.breakoutContextAtSignal || '',
                      item.activeSignal?.breakoutShortTag || '',
                      item.volumeAlert?.title || '',
                      item.volumeAlert?.description || '',
                      item.reversalReason || '',
                      item.daysHighBroken && item.daysHighBroken >= 2 ? `${item.daysHighBroken}-Day High` : '',
                      item.daysLowBroken && item.daysLowBroken >= 2 ? `${item.daysLowBroken}-Day Low` : '',
                      (item.rvol || 1) >= 1.3 ? `${item.rvol?.toFixed(1)}x RVOL` : '',
                      (item.cvd || 0) > 0 ? `+${Math.round((item.cvd || 0) / 1000)}k Buy CVD` : (item.cvd || 0) < 0 ? `${Math.round((item.cvd || 0) / 1000)}k Sell CVD` : ''
                    ].filter(Boolean)}
                    stock={item}
                    signalType={isBuy ? 'BULLISH' : isSell ? 'BEARISH' : 'NEUTRAL'}
                  />
                </div>

                {/* Active Signal Details Card if triggered */}
                {item.activeSignal && (
                  <div className={`p-3 rounded-lg border space-y-2 ${
                    isBuy ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">Confirmed Breakout Trigger</span>
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                        <Clock className="w-3 h-3" /> {formatSignalTime(item.activeSignal.timestamp)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Entry Price</span>
                        <span className="font-bold text-slate-100">₹{item.activeSignal.entryPrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-400 block">Target (+1%)</span>
                        <span className="font-bold text-emerald-400">₹{item.activeSignal.targetPrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-rose-400 block">Stop Loss (-1%)</span>
                        <span className="font-bold text-rose-400">₹{item.activeSignal.stopLossPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Breakout Context At Signal Time */}
                    <div className="text-[11px] font-sans font-bold py-1 px-2.5 rounded bg-slate-950/80 border border-slate-800 text-slate-200 flex items-center justify-between">
                      <span className="text-slate-400 font-normal">At Breakout:</span>
                      <span className={item.activeSignal.isInsidePdRangeAtBreakout ? 'text-amber-300 font-extrabold' : isBuy ? 'text-emerald-300 font-extrabold' : 'text-rose-300 font-extrabold'}>
                        {item.activeSignal.breakoutContextAtSignal || item.breakoutContextAtSignal || (item.activeSignal.isInsidePdRangeAtBreakout ? 'Inside Prev Day Range' : 'Multi-Day Breakout')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Distance & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <div className="text-slate-400 text-[11px]">
                    {item.latestPrice > item.resistance ? (
                      <span className="text-emerald-400 font-mono">Above Resistance (+{Math.abs(Number(distToResPct))}%)</span>
                    ) : item.latestPrice < item.support ? (
                      <span className="text-rose-400 font-mono">Below Support (-{Math.abs(Number(distToSuppPct))}%)</span>
                    ) : (
                      <span>To Res: <strong className="text-slate-200">{distToResPct}%</strong></span>
                    )}
                  </div>

                  <button
                    onClick={() => onOpenChartModal ? onOpenChartModal(item.symbol) : onSelectSymbolForChart(item.symbol)}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                    title="View Chart"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>View Chart</span>
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
