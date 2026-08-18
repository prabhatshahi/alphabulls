import React, { useState, useEffect } from 'react';
import { StockScanStatus, UniverseType, AiAlphaAlertConfig } from '../types';
import { NSE_SECTOR_MAPPINGS, getSectorForSymbol } from '../constants/sectors';
import { UniverseSelector } from './UniverseSelector';
import { getNseStocksByUniverse } from '../constants/allNseStocks';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Zap,
  Flame,
  Activity,
  Target,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  BarChart2,
  BarChart3,
  Search,
  SlidersHorizontal,
  Copy,
  Check,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  Grid,
  List,
  Filter,
  Clock,
  Compass,
  Globe,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  History,
  Power,
  ExternalLink,
  Lock,
  RotateCcw
} from 'lucide-react';
import { openTradingViewChart } from '../utils/tradingView';

interface IntradayConfluenceViewProps {
  timeframe: '5m' | '15m';
  setTimeframe?: (tf: '5m' | '15m') => void;
  universe: UniverseType;
  setUniverse?: (u: UniverseType) => void;
  onSelectSymbolForChart: (symbol: string) => void;
  onOpenChartModal?: (symbol: string) => void;
  initialSubTab?: 'ALL' | 'BULLISH' | 'BEARISH' | 'HIGH_RVOL' | 'ULTRA_80' | 'SECTOR_ALIGNED';
  onOpenAlertModal?: () => void;
  alertConfig?: AiAlphaAlertConfig;
  onToggleAlerts?: () => void;
  onDispatchAlert?: (event: import('../types').AiAlphaAlertEvent) => void;
  onOpenTrendingRadar?: () => void;
}

export interface ConfluenceItem {
  stock: StockScanStatus;
  bullishScore: number;
  bearishScore: number;
  overallScore: number;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confluenceLevel: 'ULTRA' | 'HIGH' | 'MODERATE' | 'WEAK';
  pillars: {
    icon: string;
    label: string;
    type: 'BULL' | 'BEAR' | 'NEUTRAL';
  }[];
  entryPrice: number;
  targetPrice1: number;
  targetPrice2: number;
  stopLossPrice: number;
  riskReward: string;
  signalTime: string;
  signalDate: string;
  signalTimeframe: '5m' | '15m';
  rawTimestamp: string;
  sectorName: string;
  sectorChangePct: number;
  isSectorAligned: boolean;
}

interface LockedConfluenceRecord {
  symbol: string;
  stockName?: string;
  bullishScore: number;
  bearishScore: number;
  overallScore: number;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confluenceLevel: 'ULTRA' | 'HIGH' | 'MODERATE' | 'WEAK';
  pillars: {
    icon: string;
    label: string;
    type: 'BULL' | 'BEAR' | 'NEUTRAL';
  }[];
  entryPrice: number;
  targetPrice1: number;
  targetPrice2: number;
  stopLossPrice: number;
  riskReward: string;
  signalTime: string;
  signalDate: string;
  signalTimeframe: '5m' | '15m';
  rawTimestamp: string;
  sectorName: string;
  sectorChangePct: number;
  isSectorAligned: boolean;
  initialPrice: number;
  initialPriceChangePct?: number;
  vwap?: number;
  rsi?: number;
  rvol?: number;
  cprPivot?: number;
}

const getTodayDateKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getFixedOpeningTimeInfo = (tf: '5m' | '15m') => {
  const is5m = tf === '5m';
  const timeStr = is5m ? '09:20:00 AM' : '09:30:00 AM';
  const shortTimeStr = is5m ? '09:20 AM' : '09:30 AM';
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, is5m ? 20 : 30, 0, 0);
  const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return {
    timeStr,
    shortTimeStr,
    dateStr,
    rawTimestamp: d.toISOString(),
    candleTime: is5m ? '09:20' : '09:30'
  };
};

const NIFTY_FNO_STOCKS = Array.from(new Set([
  'AARTIIND.NS', 'ABB.NS', 'ABBOTINDIA.NS', 'ABCAPITAL.NS', 'ABFRL.NS', 'ACC.NS', 'ADANIENT.NS', 'ADANIPORTS.NS',
  'ALKEM.NS', 'AMBUJACEM.NS', 'APOLLOHOSP.NS', 'APOLLOTYRE.NS', 'ASHOKLEY.NS', 'ASIANPAINT.NS', 'ASTRAL.NS',
  'ATUL.NS', 'AUBANK.NS', 'AUROPHARMA.NS', 'AXISBANK.NS', 'BAJAJ-AUTO.NS', 'BAJAJFINSV.NS', 'BAJFINANCE.NS',
  'BALKRISIND.NS', 'BALRAMCHIN.NS', 'BANDHANBNK.NS', 'BANKBARODA.NS', 'BATAINDIA.NS', 'BEL.NS', 'BHARATFORG.NS',
  'BHARTIARTL.NS', 'BHEL.NS', 'BIOCON.NS', 'BPCL.NS', 'BRITANNIA.NS', 'BSOFT.NS', 'CANBK.NS', 'CANFINHOME.NS',
  'CHAMBLFERT.NS', 'CHOLAFIN.NS', 'CIPLA.NS', 'COALINDIA.NS', 'COFORGE.NS', 'COLPAL.NS', 'CONCOR.NS', 'COROMANDEL.NS',
  'CROMPTON.NS', 'CUMMINSIND.NS', 'DABUR.NS', 'DALBHARAT.NS', 'DEEPAKNTR.NS', 'DIVISLAB.NS', 'DIXON.NS', 'DLF.NS',
  'DRREDDY.NS', 'EICHERMOT.NS', 'ESCORTS.NS', 'EXIDEIND.NS', 'FEDERALBNK.NS', 'GAIL.NS', 'GLENMARK.NS', 'GMRAIRPORT.NS',
  'GNFC.NS', 'GODREJCP.NS', 'GODREJPROP.NS', 'GRANULES.NS', 'GRASIM.NS', 'HAL.NS', 'HAVELLS.NS',
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

export const IntradayConfluenceView: React.FC<IntradayConfluenceViewProps> = ({
  timeframe,
  setTimeframe,
  universe,
  setUniverse,
  onSelectSymbolForChart,
  onOpenChartModal,
  initialSubTab,
  onOpenAlertModal,
  alertConfig,
  onToggleAlerts,
  onDispatchAlert,
  onOpenTrendingRadar
}) => {
  const [results, setResults] = useState<StockScanStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const alertedHistoryRef = React.useRef<Set<string>>(new Set());

  // Session-Anchored Signals Registry: Fixed at 09:20 AM for 5m and 09:30 AM for 15m (No Addition, No Deletion)
  const [lockedConfluenceMap, setLockedConfluenceMap] = useState<Record<string, LockedConfluenceRecord>>(() => {
    try {
      const todayKey = `intraday_confluence_fixed_signals_${universe}_${timeframe}_${getTodayDateKey()}`;
      const saved = localStorage.getItem(todayKey);
      if (saved) return JSON.parse(saved);
      const legacyKey = `intraday_confluence_locked_picks_${universe}_${timeframe}`;
      const legacySaved = localStorage.getItem(legacyKey);
      if (legacySaved) return JSON.parse(legacySaved);
    } catch {}
    return {};
  });

  // Sync locked picks when universe or timeframe changes
  useEffect(() => {
    try {
      const todayKey = `intraday_confluence_fixed_signals_${universe}_${timeframe}_${getTodayDateKey()}`;
      const saved = localStorage.getItem(todayKey);
      if (saved) {
        setLockedConfluenceMap(JSON.parse(saved));
      } else {
        const legacyKey = `intraday_confluence_locked_picks_${universe}_${timeframe}`;
        const legacySaved = localStorage.getItem(legacyKey);
        if (legacySaved) {
          setLockedConfluenceMap(JSON.parse(legacySaved));
        } else {
          setLockedConfluenceMap({});
        }
      }
    } catch {
      setLockedConfluenceMap({});
    }
  }, [universe, timeframe]);

  // Filters & State
  const [activeTab, setActiveTab] = useState<'ALL' | 'BULLISH' | 'BEARISH' | 'HIGH_RVOL' | 'ULTRA_80' | 'SECTOR_ALIGNED'>(initialSubTab || 'SECTOR_ALIGNED');
  const [minScore, setMinScore] = useState<number>(60);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [copied, setCopied] = useState<boolean>(false);

  // Fetch scanning data
  const fetchScan = async () => {
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
        body: JSON.stringify({ symbols, timeframe, universe })
      });

      if (!res.ok) {
        throw new Error(`Scan failed with status HTTP ${res.status}`);
      }

      const data = await res.json();
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch scan results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScan();
  }, [timeframe, universe]);

  const handleResetSessionSignals = () => {
    setLockedConfluenceMap({});
    try {
      const todayKey = `intraday_confluence_fixed_signals_${universe}_${timeframe}_${getTodayDateKey()}`;
      localStorage.removeItem(todayKey);
      const legacyKey = `intraday_confluence_locked_picks_${universe}_${timeframe}`;
      localStorage.removeItem(legacyKey);
    } catch {}
    fetchScan();
  };

  const formatSignalTime = (tsString?: string) => {
    if (!tsString) return { time: 'Live', date: '' };
    try {
      const d = new Date(tsString);
      if (isNaN(d.getTime())) return { time: tsString, date: '' };
      const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      const date = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      return { time, date };
    } catch {
      return { time: tsString || 'Live', date: '' };
    }
  };

  // Precompute Sector Performance & Momentum
  const sectorPerformanceMap: Record<string, { name: string; avgChangePct: number; advCount: number; decCount: number; bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' }> = {};

  Object.entries(NSE_SECTOR_MAPPINGS).forEach(([secName, secSymbols]) => {
    const matched = results.filter((st) =>
      secSymbols.some((sym) => st.symbol.toUpperCase().includes(sym.replace('.NS', '').toUpperCase()))
    );
    if (matched.length > 0) {
      const sumPct = matched.reduce((acc, m) => acc + (m.priceChangePct || 0), 0);
      const avgPct = sumPct / matched.length;
      let adv = 0;
      let dec = 0;
      matched.forEach((m) => {
        if ((m.priceChangePct || 0) > 0.01) adv++;
        else if ((m.priceChangePct || 0) < -0.01) dec++;
      });
      const bias = avgPct > 0.1 || adv > dec ? 'BULLISH' : avgPct < -0.1 || dec > adv ? 'BEARISH' : 'NEUTRAL';
      sectorPerformanceMap[secName] = {
        name: secName,
        avgChangePct: Number(avgPct.toFixed(2)),
        advCount: adv,
        decCount: dec,
        bias
      };
    }
  });

  // Anchor and lock initial opening signals: strictly fixed at 09:20 for 5m and 09:30 for 15m (ZERO ADDITIONS, ZERO DELETIONS)
  useEffect(() => {
    if (!results || results.length === 0) return;

    setLockedConfluenceMap((prevLocked) => {
      // STRICT CORE MANDATE: Once signals for the session exist, NO ADDITIONS and NO DELETIONS are permitted!
      if (prevLocked && Object.keys(prevLocked).length > 0) {
        return prevLocked;
      }

      const nextLocked: Record<string, LockedConfluenceRecord> = {};
      const openingInfo = getFixedOpeningTimeInfo(timeframe);

      for (const st of results) {
        const symKey = st.symbol;
        const price = st.latestPrice || 100;
        const open = st.todaysOpen || price;
        const changePct = st.priceChangePct || 0;
        const rvol = st.rvol || 1.0;
        const cvd = st.cvd || 0;
        const cvdRatio = st.cvdRatio || 1.0;
        const adr = st.adr14 || (price * 0.02);

        let bullPts = 0;
        let bearPts = 0;
        const pillars: ConfluenceItem['pillars'] = [];

        // Sector Alignment Analysis
        const sectorName = getSectorForSymbol(st.symbol);
        const secData = sectorPerformanceMap[sectorName];
        let isSectorAligned = false;
        let sectorChangePct = 0;

        if (secData) {
          sectorChangePct = secData.avgChangePct;
          const isBullCandidate = changePct >= 0 || st.status === 'BUY_SIGNAL';
          const isBearCandidate = changePct < 0 || st.status === 'SELL_SIGNAL';

          if (isBullCandidate && (secData.bias === 'BULLISH' || secData.avgChangePct > 0)) {
            bullPts += 15;
            isSectorAligned = true;
            pillars.push({
              icon: '🌐',
              label: `Sector Inflow Aligned: ${sectorName} (+${secData.avgChangePct}%)`,
              type: 'BULL'
            });
          } else if (isBearCandidate && (secData.bias === 'BEARISH' || secData.avgChangePct < 0)) {
            bearPts += 15;
            isSectorAligned = true;
            pillars.push({
              icon: '🌐',
              label: `Sector Outflow Aligned: ${sectorName} (${secData.avgChangePct}%)`,
              type: 'BEAR'
            });
          } else if (secData.avgChangePct !== 0) {
            pillars.push({
              icon: '⚡',
              label: `Sector Trend: ${sectorName} (${secData.avgChangePct >= 0 ? '+' : ''}${secData.avgChangePct}%)`,
              type: 'NEUTRAL'
            });
          }
        }

        // Opening Candle / Signal Time Indicator
        pillars.push({
          icon: '⏱️',
          label: `Fixed Opening Setup @ ${openingInfo.timeStr} (${timeframe} TF)`,
          type: (st.status === 'BUY_SIGNAL' || changePct >= 0) ? 'BULL' : 'BEAR'
        });

        // 1. VWAP & Moving Averages Trend
        const vwap = st.vwap;
        const ema20 = st.ema20;

        if (vwap && open >= vwap) {
          bullPts += 8;
          if (ema20 && open >= ema20) {
            bullPts += 7;
            pillars.push({ icon: '📈', label: `Trend Bullish: Above VWAP (₹${vwap}) & EMA 20 (₹${ema20})`, type: 'BULL' });
          } else {
            pillars.push({ icon: '📈', label: `Above VWAP (₹${vwap})`, type: 'BULL' });
          }
        } else if (vwap && open < vwap) {
          bearPts += 8;
          if (ema20 && open < ema20) {
            bearPts += 7;
            pillars.push({ icon: '📉', label: `Trend Bearish: Below VWAP (₹${vwap}) & EMA 20 (₹${ema20})`, type: 'BEAR' });
          } else {
            pillars.push({ icon: '📉', label: `Below VWAP (₹${vwap})`, type: 'BEAR' });
          }
        }

        // 2. RSI & MACD Momentum
        const rsi = st.rsi;
        const macdHist = st.macdHist;

        if (rsi && rsi >= 60) {
          bullPts += 8;
          pillars.push({ icon: '⚡', label: `Strong RSI Momentum (${rsi})`, type: 'BULL' });
        } else if (rsi && rsi <= 40) {
          bearPts += 8;
          pillars.push({ icon: '⚡', label: `Weak RSI Pressure (${rsi})`, type: 'BEAR' });
        }

        if (macdHist !== undefined && macdHist > 0) {
          bullPts += 7;
          pillars.push({ icon: '📊', label: `MACD Histogram Positive (+${macdHist})`, type: 'BULL' });
        } else if (macdHist !== undefined && macdHist < 0) {
          bearPts += 7;
          pillars.push({ icon: '📊', label: `MACD Histogram Negative (${macdHist})`, type: 'BEAR' });
        }

        // 3. CPR & Pivot Points Structure
        if (st.cprStatus === 'ABOVE_R1') {
          bullPts += 15;
          pillars.push({ icon: '🏰', label: `CPR R1 Pivot Breakout (R1 ₹${st.cprR1})`, type: 'BULL' });
        } else if (st.cprStatus === 'ABOVE_CPR') {
          bullPts += 10;
          pillars.push({ icon: '🏰', label: `Trading Above CPR Level (Pivot ₹${st.cprPivot})`, type: 'BULL' });
        } else if (st.cprStatus === 'BELOW_S1') {
          bearPts += 15;
          pillars.push({ icon: '🏰', label: `CPR S1 Pivot Breakdown (S1 ₹${st.cprS1})`, type: 'BEAR' });
        } else if (st.cprStatus === 'BELOW_CPR') {
          bearPts += 10;
          pillars.push({ icon: '🏰', label: `Trading Below CPR Level (Pivot ₹${st.cprPivot})`, type: 'BEAR' });
        }

        // 4. Volume & Volume 4-Types Intelligence
        if (st.volType === 'LIGHT_GREEN' || (changePct > 0.5 && rvol >= 1.5)) {
          bullPts += 15;
          pillars.push({ icon: '🟩', label: `Institutional Vol Accumulation (${rvol.toFixed(1)}x RVOL)`, type: 'BULL' });
        } else if (st.volType === 'MAROON' || (changePct < -0.5 && rvol >= 1.5)) {
          bearPts += 15;
          pillars.push({ icon: '🔴', label: `Institutional Vol Distribution (${rvol.toFixed(1)}x RVOL)`, type: 'BEAR' });
        } else if (rvol >= 2.0) {
          bullPts += 8;
          bearPts += 8;
          pillars.push({ icon: '🔥', label: `Volume Surge (${rvol.toFixed(1)}x RVOL)`, type: 'NEUTRAL' });
        }

        // 5. CVD Delta & Order Flow
        if (cvdRatio >= 1.25 && cvd > 0) {
          bullPts += 15;
          pillars.push({ icon: '🌊', label: `Buyer Delta Aggression (CVD Ratio ${cvdRatio.toFixed(2)})`, type: 'BULL' });
        } else if (cvdRatio <= 0.75 && cvd < 0) {
          bearPts += 15;
          pillars.push({ icon: '🩸', label: `Seller Delta Pressure (CVD Ratio ${cvdRatio.toFixed(2)})`, type: 'BEAR' });
        }

        // 6. Multi-Day Structure (PDH / PDL)
        if (st.daysHighBroken && st.daysHighBroken >= 1) {
          bullPts += 15;
          pillars.push({ icon: '🚀', label: `Cleared ${st.daysHighBroken}-Day High Level`, type: 'BULL' });
        } else if (st.pdRangeStatus === 'ABOVE_PDH') {
          bullPts += 10;
          pillars.push({ icon: '🚀', label: `Trading Above Prev Day High (₹${st.pdh})`, type: 'BULL' });
        }

        if (st.daysLowBroken && st.daysLowBroken >= 1) {
          bearPts += 15;
          pillars.push({ icon: '🔻', label: `Broke Below ${st.daysLowBroken}-Day Low`, type: 'BEAR' });
        } else if (st.pdRangeStatus === 'BELOW_PDL') {
          bearPts += 10;
          pillars.push({ icon: '🔻', label: `Trading Below Prev Day Low (₹${st.pdl})`, type: 'BEAR' });
        }

        // 7. ADR 14 Levels & Signals
        if (st.status === 'BUY_SIGNAL') {
          bullPts += 10;
          pillars.push({ icon: '🎯', label: 'ADR 14 Breakout Level Active', type: 'BULL' });
        } else if (st.status === 'SELL_SIGNAL') {
          bearPts += 10;
          pillars.push({ icon: '🎯', label: 'ADR 14 Breakdown Level Active', type: 'BEAR' });
        }

        // Cap scores at 100
        const finalBullScore = Math.min(100, Math.round(bullPts));
        const finalBearScore = Math.min(100, Math.round(bearPts));

        let bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
        let overallScore = 0;

        if (finalBullScore > finalBearScore && finalBullScore >= 50) {
          bias = 'BULLISH';
          overallScore = finalBullScore;
        } else if (finalBearScore > finalBullScore && finalBearScore >= 50) {
          bias = 'BEARISH';
          overallScore = finalBearScore;
        } else {
          bias = finalBullScore >= finalBearScore ? 'BULLISH' : 'BEARISH';
          overallScore = Math.max(finalBullScore, finalBearScore);
        }

        let confluenceLevel: 'ULTRA' | 'HIGH' | 'MODERATE' | 'WEAK' = 'WEAK';
        if (overallScore >= 85) confluenceLevel = 'ULTRA';
        else if (overallScore >= 70) confluenceLevel = 'HIGH';
        else if (overallScore >= 55) confluenceLevel = 'MODERATE';

        // Trade Plan targets anchored at opening price
        const entryPrice = open;
        const targetPrice1 = bias === 'BULLISH' ? Number((entryPrice + adr * 0.8).toFixed(2)) : Number((entryPrice - adr * 0.8).toFixed(2));
        const targetPrice2 = bias === 'BULLISH' ? Number((entryPrice + adr * 1.5).toFixed(2)) : Number((entryPrice - adr * 1.5).toFixed(2));
        const stopLossPrice = bias === 'BULLISH' ? Number((entryPrice - adr * 0.5).toFixed(2)) : Number((entryPrice + adr * 0.5).toFixed(2));
        const riskReward = '1 : 2.2';

        nextLocked[symKey] = {
          symbol: st.symbol,
          stockName: st.name,
          bullishScore: finalBullScore,
          bearishScore: finalBearScore,
          overallScore,
          bias,
          confluenceLevel,
          pillars,
          entryPrice,
          targetPrice1,
          targetPrice2,
          stopLossPrice,
          riskReward,
          signalTime: openingInfo.timeStr,
          signalDate: openingInfo.dateStr,
          signalTimeframe: timeframe,
          rawTimestamp: openingInfo.rawTimestamp,
          sectorName,
          sectorChangePct,
          isSectorAligned,
          initialPrice: entryPrice,
          initialPriceChangePct: changePct,
          vwap: st.vwap,
          rsi: st.rsi,
          rvol: st.rvol,
          cprPivot: st.cprPivot
        };
      }

      if (Object.keys(nextLocked).length > 0) {
        try {
          const todayKey = `intraday_confluence_fixed_signals_${universe}_${timeframe}_${getTodayDateKey()}`;
          localStorage.setItem(todayKey, JSON.stringify(nextLocked));
          const legacyKey = `intraday_confluence_locked_picks_${universe}_${timeframe}`;
          localStorage.setItem(legacyKey, JSON.stringify(nextLocked));
        } catch {}
        return nextLocked;
      }
      return prevLocked;
    });
  }, [results, timeframe, universe]);

  // Lookup map for live scan results
  const resultsMap = React.useMemo(() => {
    const map = new Map<string, StockScanStatus>();
    results.forEach((r) => map.set(r.symbol, r));
    return map;
  }, [results]);

  // Compute Confluence Items: Strictly anchored with live LTP updating continuously
  const confluenceItems: ConfluenceItem[] = React.useMemo(() => {
    const hasLocked = Object.keys(lockedConfluenceMap).length > 0;
    if (hasLocked) {
      return (Object.values(lockedConfluenceMap) as LockedConfluenceRecord[]).map((rec) => {
        const liveStock = resultsMap.get(rec.symbol);
        const livePrice = liveStock?.latestPrice || rec.initialPrice;
        const liveChangePct = liveStock?.priceChangePct !== undefined ? liveStock.priceChangePct : (rec.initialPriceChangePct || 0);

        const stock: StockScanStatus = liveStock ? {
          ...liveStock,
          latestPrice: livePrice,
          priceChangePct: liveChangePct
        } : {
          symbol: rec.symbol,
          name: rec.stockName || rec.symbol,
          latestPrice: livePrice,
          priceChangePct: liveChangePct,
          vwap: rec.vwap,
          rsi: rec.rsi,
          rvol: rec.rvol,
          cprPivot: rec.cprPivot,
          lastUpdated: rec.rawTimestamp
        } as any;

        return {
          stock,
          bullishScore: rec.bullishScore,
          bearishScore: rec.bearishScore,
          overallScore: rec.overallScore,
          bias: rec.bias,
          confluenceLevel: rec.confluenceLevel,
          pillars: rec.pillars,
          entryPrice: rec.entryPrice,
          targetPrice1: rec.targetPrice1,
          targetPrice2: rec.targetPrice2,
          stopLossPrice: rec.stopLossPrice,
          riskReward: rec.riskReward,
          signalTime: rec.signalTime,
          signalDate: rec.signalDate,
          signalTimeframe: rec.signalTimeframe,
          rawTimestamp: rec.rawTimestamp,
          sectorName: rec.sectorName,
          sectorChangePct: rec.sectorChangePct,
          isSectorAligned: rec.isSectorAligned
        };
      });
    }

    const openingInfo = getFixedOpeningTimeInfo(timeframe);
    return results.map((st) => {
      const price = st.latestPrice || 100;
      const open = st.todaysOpen || price;
      const adr = st.adr14 || (price * 0.02);
      const isBull = (st.priceChangePct || 0) >= 0;
      const entryPrice = open;
      const targetPrice1 = isBull ? Number((entryPrice + adr * 0.8).toFixed(2)) : Number((entryPrice - adr * 0.8).toFixed(2));
      const targetPrice2 = isBull ? Number((entryPrice + adr * 1.5).toFixed(2)) : Number((entryPrice - adr * 1.5).toFixed(2));
      const stopLossPrice = isBull ? Number((entryPrice - adr * 0.5).toFixed(2)) : Number((entryPrice + adr * 0.5).toFixed(2));

      return {
        stock: st,
        bullishScore: isBull ? 75 : 30,
        bearishScore: isBull ? 25 : 75,
        overallScore: 75,
        bias: isBull ? 'BULLISH' : 'BEARISH',
        confluenceLevel: 'HIGH',
        pillars: [{ icon: '⏱️', label: `Opening Setup @ ${openingInfo.timeStr}`, type: isBull ? 'BULL' : 'BEAR' }],
        entryPrice,
        targetPrice1,
        targetPrice2,
        stopLossPrice,
        riskReward: '1 : 2.2',
        signalTime: openingInfo.timeStr,
        signalDate: openingInfo.dateStr,
        signalTimeframe: timeframe,
        rawTimestamp: openingInfo.rawTimestamp,
        sectorName: getSectorForSymbol(st.symbol),
        sectorChangePct: 0,
        isSectorAligned: false
      };
    });
  }, [lockedConfluenceMap, resultsMap, results, timeframe]);

  // Filter items
  const filteredItems = confluenceItems.filter((item) => {
    const sym = item.stock.symbol.toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    if (q && !sym.includes(q)) return false;

    if (item.overallScore < minScore) return false;

    if (activeTab === 'SECTOR_ALIGNED') return item.isSectorAligned;
    if (activeTab === 'BULLISH') return item.bias === 'BULLISH';
    if (activeTab === 'BEARISH') return item.bias === 'BEARISH';
    if (activeTab === 'HIGH_RVOL') return (item.stock.rvol || 0) >= 2.0;
    if (activeTab === 'ULTRA_80') return item.overallScore >= 80;

    return true;
  }).sort((a, b) => b.overallScore - a.overallScore);

  // Automated High-Score Alert Trigger
  useEffect(() => {
    if (!alertConfig?.enabled || !onDispatchAlert || results.length === 0) return;

    confluenceItems.forEach((item) => {
      if (item.overallScore >= (alertConfig.minScore || 80)) {
        const meetsDirection =
          alertConfig.direction === 'ALL' ||
          (alertConfig.direction === 'BULLISH' && item.bias === 'BULLISH') ||
          (alertConfig.direction === 'BEARISH' && item.bias === 'BEARISH');

        const meetsTimeframe =
          !alertConfig.timeframe ||
          alertConfig.timeframe === 'ALL' ||
          alertConfig.timeframe === item.signalTimeframe;

        const meetsRvol = (item.stock.rvol || 1.0) >= (alertConfig.minRvol || 1.0);

        const alertKey = `${item.stock.symbol}_${item.signalTimeframe}_${Math.floor(Date.now() / (10 * 60 * 1000))}`;

        if (meetsDirection && meetsTimeframe && meetsRvol && !alertedHistoryRef.current.has(alertKey)) {
          alertedHistoryRef.current.add(alertKey);
          const topReasons = item.pillars.map(p => p.label).slice(0, 4);

          onDispatchAlert({
            id: `alert_${Date.now()}_${item.stock.symbol}`,
            timestamp: item.signalTime,
            rawTime: Date.now(),
            symbol: item.stock.symbol,
            stockName: item.stock.name,
            score: item.overallScore,
            tier: item.confluenceLevel,
            signalType: item.bias === 'BEARISH' ? 'BEARISH' : 'BULLISH',
            entryPrice: item.entryPrice,
            targetPrice: item.targetPrice1,
            stopLossPrice: item.stopLossPrice,
            projectedMovePct: Number((Math.abs(item.targetPrice1 - item.entryPrice) / item.entryPrice * 100).toFixed(2)),
            reasons: topReasons.length > 0 ? topReasons : ['High Confluence Score Breakout'],
            rvol: item.stock.rvol || 1.0,
            timeframe: item.signalTimeframe,
            priceChangePct: item.stock.priceChangePct
          });
        }
      }
    });
  }, [results, alertConfig?.enabled, alertConfig?.minScore, alertConfig?.direction, alertConfig?.timeframe, alertConfig?.minRvol]);

  const sectorAlignedList = confluenceItems.filter(i => i.isSectorAligned);

  const topBullish = confluenceItems
    .filter((i) => i.bias === 'BULLISH')
    .sort((a, b) => b.bullishScore - a.bullishScore);

  const topBearish = confluenceItems
    .filter((i) => i.bias === 'BEARISH')
    .sort((a, b) => b.bearishScore - a.bearishScore);

  const copyTopPicks = () => {
    const bulls = topBullish.slice(0, 5).map(b => `${b.stock.symbol} (Score: ${b.bullishScore}%, Time: ${b.signalTime}, TF: ${b.signalTimeframe}, Entry: ${b.entryPrice}, Tgt: ${b.targetPrice1}, SL: ${b.stopLossPrice})`).join('\n');
    const bears = topBearish.slice(0, 5).map(b => `${b.stock.symbol} (Score: ${b.bearishScore}%, Time: ${b.signalTime}, TF: ${b.signalTimeframe}, Entry: ${b.entryPrice}, Tgt: ${b.targetPrice1}, SL: ${b.stopLossPrice})`).join('\n');

    const text = `🔥 INTRADAY CONFLUENCE TOP PICKS (${new Date().toLocaleTimeString()}):\n\n🚀 BULLISH:\n${bulls}\n\n📉 BEARISH:\n${bears}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-4">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-bold uppercase tracking-widest shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              Multi-Strategy Confluence Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Intraday Master Confluence Hub
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Conflating <span className="text-emerald-400 font-semibold">ADR Breakouts</span>, <span className="text-amber-400 font-semibold">Volume Profile (VPVR) S/R</span>, <span className="text-amber-300 font-semibold">RVOL Spikes</span>, <span className="text-indigo-400 font-semibold">CVD Delta Order Flow</span>, <span className="text-sky-400 font-semibold">4-Type Volume Candles</span>, <span className="text-purple-400 font-semibold">Type 5 Volume Climax</span>, and <span className="text-rose-400 font-semibold">Multi-Day Structure</span> into unified high-probability Intraday setups.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {setUniverse && (
              <UniverseSelector
                universe={universe}
                setUniverse={setUniverse}
                variant="dropdown"
              />
            )}

            {/* 1-Click Alert Toggle & Configure Pill */}
            <div className="flex items-center bg-slate-900 border border-slate-700/80 p-1 rounded-xl shadow-lg">
              <button
                type="button"
                onClick={() => onToggleAlerts ? onToggleAlerts() : onOpenAlertModal?.()}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer select-none active:scale-95 ${
                  alertConfig?.enabled
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
                title={alertConfig?.enabled ? 'AI Alerts are ACTIVE. Click to Turn OFF' : 'AI Alerts are MUTED. Click to Turn ON'}
              >
                {alertConfig?.enabled ? (
                  <>
                    <Power className="w-3.5 h-3.5" />
                    <span>ALERTS ON (≥{alertConfig?.minScore || 80}%)</span>
                  </>
                ) : (
                  <>
                    <BellOff className="w-3.5 h-3.5 text-slate-500" />
                    <span>ALERTS OFF</span>
                  </>
                )}
              </button>

              {onOpenAlertModal && (
                <button
                  type="button"
                  onClick={onOpenAlertModal}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors cursor-pointer ml-1"
                  title="Configure Alert Threshold, Sounds & Display"
                >
                  <Bell className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={fetchScan}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Scanning Markets...' : 'Refresh Confluence'}</span>
            </button>

            <button
              onClick={copyTopPicks}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              title="Copy Top Intraday Picks to Clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Top Picks'}</span>
            </button>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          {/* Sector Aligned Card */}
          <div className="bg-slate-900/90 border border-cyan-500/40 p-3.5 rounded-xl flex items-center justify-between col-span-2 sm:col-span-1 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <div>
              <div className="text-[10px] font-bold uppercase text-cyan-300 tracking-wider flex items-center gap-1">
                <Globe className="w-3 h-3 text-cyan-400 animate-pulse" /> Sector Aligned
              </div>
              <div className="text-lg font-black text-white mt-0.5">
                {sectorAlignedList.length} Stocks
              </div>
              <div className="text-[11px] text-cyan-300/80 font-mono font-bold mt-0.5">
                Aligned with Sector Tide
              </div>
            </div>
            <div className="p-2.5 bg-cyan-500/20 text-cyan-300 rounded-xl border border-cyan-500/30">
              <Globe className="w-5 h-5" />
            </div>
          </div>

          {/* Top Bullish Pick */}
          <div className="bg-slate-900/90 border border-emerald-500/30 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> #1 Bullish Confluence
              </div>
              <div className="text-lg font-black text-white mt-0.5">
                {topBullish[0] ? topBullish[0].stock.symbol : 'Scanning...'}
              </div>
              <div className="text-[11px] text-emerald-300 font-mono font-bold mt-0.5 flex items-center gap-2">
                <span>{topBullish[0] ? `Score: ${topBullish[0].bullishScore}%` : '--'}</span>
                {topBullish[0] && (
                  <span className="text-[10px] text-amber-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 flex items-center gap-1 font-mono">
                    <Clock className="w-2.5 h-2.5 text-amber-400" />
                    {topBullish[0].signalTime} ({topBullish[0].signalTimeframe})
                  </span>
                )}
              </div>
            </div>
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Zap className="w-5 h-5" />
            </div>
          </div>

          {/* Top Bearish Pick */}
          <div className="bg-slate-900/90 border border-rose-500/30 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-rose-400 tracking-wider flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> #1 Bearish Confluence
              </div>
              <div className="text-lg font-black text-white mt-0.5">
                {topBearish[0] ? topBearish[0].stock.symbol : 'Scanning...'}
              </div>
              <div className="text-[11px] text-rose-300 font-mono font-bold mt-0.5 flex items-center gap-2">
                <span>{topBearish[0] ? `Score: ${topBearish[0].bearishScore}%` : '--'}</span>
                {topBearish[0] && (
                  <span className="text-[10px] text-amber-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 flex items-center gap-1 font-mono">
                    <Clock className="w-2.5 h-2.5 text-amber-400" />
                    {topBearish[0].signalTime} ({topBearish[0].signalTimeframe})
                  </span>
                )}
              </div>
            </div>
            <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <Flame className="w-5 h-5" />
            </div>
          </div>

          {/* Market Bias Ratio */}
          <div className="bg-slate-900/90 border border-indigo-500/30 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-indigo-300 tracking-wider flex items-center gap-1">
                <Activity className="w-3 h-3" /> Market Confluence Bias
              </div>
              <div className="text-lg font-black text-white mt-0.5">
                {topBullish.length >= topBearish.length ? 'Bullish Dominant' : 'Bearish Dominant'}
              </div>
              <div className="text-[11px] text-slate-400 font-mono font-bold mt-0.5">
                Bull: {topBullish.length} | Bear: {topBearish.length}
              </div>
            </div>
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Target className="w-5 h-5" />
            </div>
          </div>

          {/* Scanned Universe */}
          <div className="bg-slate-900/90 border border-amber-500/30 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-amber-400 tracking-wider flex items-center gap-1">
                <Compass className="w-3 h-3" /> Scanned Universe
              </div>
              <div className="text-lg font-black text-white mt-0.5">
                {results.length} Stocks
              </div>
              <div className="text-[11px] text-amber-300/80 font-mono font-bold mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                Timeframe: {timeframe}
              </div>
            </div>
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <BarChart2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Session Signal Lock Status Banner: Fixed at 09:20 (5m) & 09:30 (15m) */}
      <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-indigo-500/15 border border-amber-500/40 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/40 shadow-sm">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-extrabold text-sm tracking-wide flex items-center gap-1.5">
                Fixed Opening Signal Engine
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                  {timeframe === '5m' ? 'Fixed @ 09:20 AM (5m)' : 'Fixed @ 09:30 AM (15m)'}
                </span>
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                🔒 Zero Additions • Zero Deletions
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Confluence signals are permanently anchored at the opening candle ({timeframe === '5m' ? '09:20 AM' : '09:30 AM'}). No new stocks will appear and no anchored stocks will disappear during the session. Live LTP updates in real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            onClick={handleResetSessionSignals}
            className="px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
            title="Reset and re-anchor opening signals for the current timeframe"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Opening Signals</span>
          </button>
        </div>
      </div>

      {/* Control Bar & Filter Tabs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Main Sub Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            {onOpenTrendingRadar && (
              <button
                onClick={onOpenTrendingRadar}
                className="px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/60 shadow-[0_0_12px_rgba(249,115,22,0.3)] animate-pulse"
                title="Launch 5-Minute Advanced Trending Radar"
              >
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>⚡ 5M TRENDING RADAR</span>
                <span className="bg-orange-500 text-slate-950 text-[9px] px-1 rounded font-black">NEW</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('SECTOR_ALIGNED')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'SECTOR_ALIGNED'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold ring-2 ring-cyan-300'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>🌐 Sector Aligned Stocks ({sectorAlignedList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('BULLISH')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'BULLISH'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>🚀 Top Intraday Bullish ({topBullish.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('BEARISH')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'BEARISH'
                  ? 'bg-rose-500 text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>📉 Top Intraday Bearish ({topBearish.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ULTRA_80')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ULTRA_80'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>🏆 Extreme 80%+ Confluence</span>
            </button>

            <button
              onClick={() => setActiveTab('HIGH_RVOL')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'HIGH_RVOL'
                  ? 'bg-indigo-600 text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>⚡ High RVOL Surges</span>
            </button>

            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-slate-700 text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Candidates ({confluenceItems.length})</span>
            </button>
          </div>

          {/* Search & Layout Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white text-xs pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500 w-full font-mono"
              />
            </div>

            {/* Timeframe Quick Toggle */}
            {setTimeframe && (
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400 font-bold hidden sm:inline">Timeframe:</span>
                <button
                  onClick={() => setTimeframe('5m')}
                  className={`px-2 py-0.5 rounded-lg text-xs font-mono font-black transition-all cursor-pointer ${
                    timeframe === '5m'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  5m
                </button>
                <button
                  onClick={() => setTimeframe('15m')}
                  className={`px-2 py-0.5 rounded-lg text-xs font-mono font-black transition-all cursor-pointer ${
                    timeframe === '15m'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  15m
                </button>
              </div>
            )}

            {/* Min Confluence Score Selector */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 font-bold hidden sm:inline">Min Score:</span>
              <select
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="bg-transparent text-emerald-400 font-bold font-mono focus:outline-none cursor-pointer"
              >
                <option value={50} className="bg-slate-900 text-white">50% (Moderate)</option>
                <option value={60} className="bg-slate-900 text-white">60% (High)</option>
                <option value={70} className="bg-slate-900 text-white">70% (Very High)</option>
                <option value={80} className="bg-slate-900 text-white">80% (Extreme)</option>
              </select>
            </div>

            {/* Grid vs Table Toggle */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'GRID' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid Cards View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'TABLE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <div className="text-white font-extrabold text-base">Running Confluence Analysis Across Entire Universe...</div>
          <div className="text-slate-400 text-xs">Evaluating ADR levels, RVOL, CVD order flow, and multi-day breakouts...</div>
        </div>
      ) : error ? (
        <div className="bg-rose-950/30 border border-rose-500/40 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <div className="text-rose-200 font-bold">{error}</div>
          <button
            onClick={fetchScan}
            className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
          >
            Retry Scan
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Target className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-white font-extrabold text-base">No Stocks Match Current Confluence Criteria</div>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            Try adjusting the minimum confluence score threshold or switching market universe to view more candidates.
          </p>
        </div>
      ) : viewMode === 'GRID' ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item, idx) => {
            const isBull = item.bias === 'BULLISH';
            const scoreColor = item.overallScore >= 80 ? 'text-amber-400 border-amber-500/40 bg-amber-500/10' : item.overallScore >= 65 ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' : 'text-slate-300 border-slate-700 bg-slate-800';

            return (
              <div
                key={`${item.stock.symbol}_${idx}`}
                className={`bg-slate-900/90 border ${
                  isBull ? 'border-emerald-500/30 hover:border-emerald-500/60' : 'border-rose-500/30 hover:border-rose-500/60'
                } rounded-2xl p-4 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between space-y-4 relative overflow-hidden group`}
              >
                {/* Background Glow */}
                <div className={`absolute -right-12 -top-12 w-32 h-32 ${isBull ? 'bg-emerald-500/10' : 'bg-rose-500/10'} rounded-full blur-2xl pointer-events-none`}></div>

                {/* Top Header Card Info */}
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => onOpenChartModal ? onOpenChartModal(item.stock.symbol) : onSelectSymbolForChart(item.stock.symbol)}
                        className="text-lg font-black text-white hover:text-indigo-300 hover:underline cursor-pointer flex items-center gap-1 font-mono tracking-tight"
                        title="Click to view chart modal"
                      >
                        {item.stock.symbol}
                      </button>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        isBull ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}>
                        {isBull ? '🚀 Bullish' : '📉 Bearish'}
                      </span>
                      {item.isSectorAligned && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center gap-1 shadow-sm">
                          <Globe className="w-3 h-3 text-cyan-300 animate-pulse" />
                          <span>{item.sectorName} ({item.sectorChangePct >= 0 ? '+' : ''}{item.sectorChangePct.toFixed(2)}%)</span>
                        </span>
                      )}
                    </div>

                    {/* Confluence Score Pill */}
                    <div className={`px-2.5 py-1 rounded-xl border text-xs font-mono font-black flex items-center gap-1 ${scoreColor}`}>
                      <Sparkles className="w-3 h-3 animate-pulse" />
                      <span>{item.overallScore}%</span>
                    </div>
                  </div>

                  {/* Signal Time & Timeframe Badge Row */}
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/60">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono font-bold text-amber-300 shadow-inner">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Signal Came: {item.signalTime}</span>
                      {item.signalDate && <span className="text-[10px] text-slate-400 font-normal">({item.signalDate})</span>}
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 text-[10px] border border-indigo-500/30 font-mono font-extrabold uppercase tracking-wider">
                      TF: {item.signalTimeframe}
                    </span>
                  </div>

                  {/* Price & Change Details */}
                  <div className="flex items-baseline justify-between mt-2 font-mono">
                    <div className="text-xl font-extrabold text-white">
                      ₹{item.stock.latestPrice.toFixed(2)}
                    </div>
                    <div className={`text-xs font-bold flex items-center gap-1 ${
                      (item.stock.priceChangePct || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {(item.stock.priceChangePct || 0) >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      <span>{(item.stock.priceChangePct || 0) >= 0 ? '+' : ''}{(item.stock.priceChangePct || 0).toFixed(2)}%</span>
                    </div>
                  </div>

                  {/* Technical Indicator Metrics 4-Grid Row */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-[11px] font-mono">
                    <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
                      <span className="text-slate-500 block text-[9px] font-bold uppercase">VWAP Trend</span>
                      <span className={`font-extrabold ${item.stock.vwap && item.entryPrice >= item.stock.vwap ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.stock.vwap ? `₹${item.stock.vwap.toFixed(1)}` : 'VWAP N/A'}
                      </span>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
                      <span className="text-slate-500 block text-[9px] font-bold uppercase">RSI (14)</span>
                      <span className={`font-extrabold ${item.stock.rsi && item.stock.rsi >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.stock.rsi ? `${item.stock.rsi.toFixed(0)}` : '50'} {item.stock.rsi && item.stock.rsi >= 60 ? '⚡' : ''}
                      </span>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
                      <span className="text-slate-500 block text-[9px] font-bold uppercase">Relative Volume</span>
                      <span className="text-amber-300 font-extrabold">{(item.stock.rvol || 1.0).toFixed(1)}x Normal</span>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
                      <span className="text-slate-500 block text-[9px] font-bold uppercase">CPR Level</span>
                      <span className="text-indigo-300 font-extrabold truncate block">
                        {item.stock.cprPivot ? `₹${item.stock.cprPivot.toFixed(0)}` : 'Pivot N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Confluence Pillars List */}
                  <div className="mt-3 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                      Confluence Reasons ({item.pillars.length})
                    </div>
                    <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                      {item.pillars.map((p, pIdx) => (
                        <div
                          key={pIdx}
                          className="text-[11px] text-slate-200 bg-slate-950/90 border border-slate-800/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium leading-tight"
                        >
                          <span>{p.icon}</span>
                          <span className="truncate">{p.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Intraday Execution Plan & Action Button */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
                    <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[8px] uppercase font-bold">Entry</span>
                      <span className="text-slate-200 font-bold">₹{item.entryPrice}</span>
                    </div>
                    <div className="bg-emerald-950/30 p-1.5 rounded-lg border border-emerald-500/20">
                      <span className="text-emerald-400 block text-[8px] uppercase font-bold">Target 1</span>
                      <span className="text-emerald-300 font-bold">₹{item.targetPrice1}</span>
                    </div>
                    <div className="bg-rose-950/30 p-1.5 rounded-lg border border-rose-500/20">
                      <span className="text-rose-400 block text-[8px] uppercase font-bold">Stop Loss</span>
                      <span className="text-rose-300 font-bold">₹{item.stopLossPrice}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openTradingViewChart(item.stock.symbol, timeframe)}
                      className="px-2.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shrink-0"
                      title={`Open ${item.stock.symbol} chart on TradingView`}
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                      <span>TV ↗</span>
                    </button>
                    <button
                      onClick={() => onOpenChartModal ? onOpenChartModal(item.stock.symbol) : onSelectSymbolForChart(item.stock.symbol)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                        isBull
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>📊 Volume Profile</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Symbol</th>
                  <th className="py-3.5 px-4 text-center">Bias</th>
                  <th className="py-3.5 px-4 text-center">Sector Alignment</th>
                  <th className="py-3.5 px-4 text-center">Signal Time & TF</th>
                  <th className="py-3.5 px-4 text-center">Confluence Score</th>
                  <th className="py-3.5 px-4 text-right">LTP</th>
                  <th className="py-3.5 px-4 text-right">Change %</th>
                  <th className="py-3.5 px-4 text-center">VWAP</th>
                  <th className="py-3.5 px-4 text-center">RSI</th>
                  <th className="py-3.5 px-4 text-center">CPR</th>
                  <th className="py-3.5 px-4 text-center">RVOL</th>
                  <th className="py-3.5 px-4">Primary Reasons</th>
                  <th className="py-3.5 px-4 text-center">Target / SL</th>
                  <th className="py-3.5 px-4 text-center">Chart</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredItems.map((item, idx) => {
                  const isBull = item.bias === 'BULLISH';
                  return (
                    <tr key={`${item.stock.symbol}_tbl_${idx}`} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-extrabold text-white">
                        <button
                          onClick={() => onOpenChartModal ? onOpenChartModal(item.stock.symbol) : onSelectSymbolForChart(item.stock.symbol)}
                          className="hover:text-indigo-400 hover:underline text-left cursor-pointer font-bold"
                          title="Open Chart Modal"
                        >
                          {item.stock.symbol}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isBull ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {item.bias}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.isSectorAligned ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 inline-flex items-center gap-1">
                            <Globe className="w-3 h-3 text-cyan-300" />
                            <span>{item.sectorName} ({item.sectorChangePct >= 0 ? '+' : ''}{item.sectorChangePct.toFixed(2)}%)</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.sectorName || 'N/A'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs font-bold text-amber-300 shadow-sm">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>{item.signalTime}</span>
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold">
                            {item.signalTimeframe}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-extrabold text-amber-300 text-sm">{item.overallScore}%</span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-200 font-bold">
                        ₹{item.stock.latestPrice.toFixed(2)}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${
                        (item.stock.priceChangePct || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {(item.stock.priceChangePct || 0) >= 0 ? '+' : ''}{(item.stock.priceChangePct || 0).toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-center font-extrabold text-slate-200">
                        {item.stock.vwap ? `₹${item.stock.vwap.toFixed(1)}` : 'N/A'}
                      </td>
                      <td className={`py-3 px-4 text-center font-extrabold ${
                        (item.stock.rsi || 50) >= 50 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {item.stock.rsi ? item.stock.rsi.toFixed(0) : '50'}
                      </td>
                      <td className="py-3 px-4 text-center text-indigo-300 font-extrabold">
                        {item.stock.cprPivot ? `₹${item.stock.cprPivot.toFixed(0)}` : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-center text-amber-300 font-bold">
                        {(item.stock.rvol || 1.0).toFixed(1)}x
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-300">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {item.pillars.slice(0, 2).map((p, pIdx) => (
                            <span key={pIdx} className="bg-slate-950 text-[10px] px-2 py-0.5 rounded border border-slate-800 truncate">
                              {p.icon} {p.label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-[11px]">
                        <span className="text-emerald-400 font-bold">T: ₹{item.targetPrice1}</span> | <span className="text-rose-400 font-bold">SL: ₹{item.stopLossPrice}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openTradingViewChart(item.stock.symbol, timeframe)}
                            className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 px-2 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer inline-flex items-center gap-1 active:scale-95"
                            title={`Open ${item.stock.symbol} chart on TradingView`}
                          >
                            <ExternalLink className="w-2.5 h-2.5 text-blue-400" />
                            <span>TV ↗</span>
                          </button>
                          <button
                            onClick={() => onOpenChartModal ? onOpenChartModal(item.stock.symbol) : onSelectSymbolForChart(item.stock.symbol)}
                            className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Chart</span>
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
      )}
    </div>
  );
};
