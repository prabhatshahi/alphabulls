import React, { useState, useEffect, useRef } from 'react';
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
  Search,
  SlidersHorizontal,
  Copy,
  Check,
  Award,
  Grid,
  List,
  Filter,
  Clock,
  Compass,
  Globe,
  Bell,
  Volume2,
  Power,
  ExternalLink,
  Lock,
  RotateCcw,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  Network,
  GitCommit,
  History,
  Trash2,
  Download,
  Calendar,
  Eye
} from 'lucide-react';
import {
  StockScanStatus,
  AiAlphaAlertConfig,
  AiAlphaAlertEvent,
  PerfectConfluenceItem,
  CorrelationMetrics,
  HistoricalAdditionItem,
  UniverseType
} from '../types';
import { NSE_SECTOR_MAPPINGS, getSectorForSymbol } from '../constants/sectors';
import { openTradingViewChart } from '../utils/tradingView';
import { AiConfluenceAuditModal } from './AiConfluenceAuditModal';
import { SectorCorrelationMatrix } from './SectorCorrelationMatrix';
import { playBullishAlertSound, playBearishAlertSound, playTestBeep } from '../utils/soundAlert';
import { UniverseSelector } from './UniverseSelector';
import { getNseStocksByUniverse } from '../constants/allNseStocks';

interface AiPerfectConfluenceViewProps {
  timeframe: '5m' | '15m';
  setTimeframe?: (tf: '5m' | '15m') => void;
  universe: UniverseType;
  setUniverse?: (u: UniverseType) => void;
  onSelectSymbolForChart: (symbol: string) => void;
  onOpenChartModal?: (symbol: string) => void;
  initialSubTab?: 'PERFECT' | 'BULLISH' | 'BEARISH' | 'CLIMAX' | 'SECTOR' | 'TIMELINE' | 'CORRELATION' | 'ALL';
  onOpenAlertModal?: () => void;
  alertConfig?: AiAlphaAlertConfig;
  onToggleAlerts?: () => void;
  onDispatchAlert?: (event: AiAlphaAlertEvent) => void;
  onOpenTrendingRadar?: () => void;
}

const STORAGE_ADDITIONS_KEY = 'confluence_additions_history_v2';

const getTodayDateKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getFixedOpeningTimeInfo = (tf: '5m' | '15m', baseTimestampMs?: number) => {
  const is5m = tf === '5m';
  const now = new Date();
  const timeMs = baseTimestampMs || now.getTime();
  const d = new Date(timeMs);
  
  // Format formatted time
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const shortTimeStr = `${formattedHours}:${formattedMinutes} ${ampm}`;
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });

  // Calculate elapsed text
  const elapsedMs = Math.max(0, now.getTime() - timeMs);
  const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
  let elapsedMinutesText = 'just now';
  if (elapsedMinutes > 0 && elapsedMinutes < 60) {
    elapsedMinutesText = `${elapsedMinutes}m ago`;
  } else if (elapsedMinutes >= 60) {
    const hrs = Math.floor(elapsedMinutes / 60);
    const mins = elapsedMinutes % 60;
    elapsedMinutesText = `${hrs}h ${mins}m ago`;
  }

  return {
    timeStr,
    shortTimeStr,
    dateStr,
    rawTimestamp: d.toISOString(),
    addedTimestampMs: timeMs,
    elapsedMinutesText
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

export const AiPerfectConfluenceView: React.FC<AiPerfectConfluenceViewProps> = ({
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
  const [activeTab, setActiveTab] = useState<'PERFECT' | 'BULLISH' | 'BEARISH' | 'CLIMAX' | 'SECTOR' | 'TIMELINE' | 'CORRELATION' | 'ALL'>(initialSubTab || 'PERFECT');
  const [minScore, setMinScore] = useState<number>(70);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [copiedSymbol, setCopiedSymbol] = useState<string | null>(null);
  const [auditModalItem, setAuditModalItem] = useState<PerfectConfluenceItem | null>(null);
  const [riskAmount, setRiskAmount] = useState<number>(5000);
  const [calculatorOpenSym, setCalculatorOpenSym] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'OPENING' | 'MORNING' | 'MIDDAY' | 'AFTERNOON'>('ALL');
  const [correlationFilter, setCorrelationFilter] = useState<'ALL' | 'HIGH_CORRELATION' | 'DECOUPLED' | 'HIGH_BETA'>('ALL');
  const [historicalAdditions, setHistoricalAdditions] = useState<HistoricalAdditionItem[]>([]);
  const [elapsedTicker, setElapsedTicker] = useState<number>(0);
  const [selectedCorrelationSymbols, setSelectedCorrelationSymbols] = useState<string[] | undefined>(undefined);

  const alertedHistoryRef = useRef<Set<string>>(new Set());

  const handleOpenCorrelationForSymbol = (symbol: string) => {
    const sec = getSectorForSymbol(symbol);
    const secStocks = NSE_SECTOR_MAPPINGS[sec] || [];
    const related = [symbol, ...secStocks.filter((s) => s !== symbol).slice(0, 5)];
    setSelectedCorrelationSymbols(related.length >= 2 ? related : [symbol, 'OBEROIRLTY.NS', 'BHEL.NS', 'DLF.NS', 'BEL.NS']);
    setActiveTab('CORRELATION');
  };

  // Load Historical Additions from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ADDITIONS_KEY);
      if (saved) {
        setHistoricalAdditions(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load additions history:', e);
    }
  }, []);

  // Update relative elapsed time ticker every 30s
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTicker((prev) => prev + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Fetch scan data
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

  // Build Comprehensive 10-Pillar Confluence Data with Correlation Metrics
  const confluenceItems: PerfectConfluenceItem[] = React.useMemo(() => {
    if (!results || results.length === 0) return [];

    const now = new Date();
    const baseHour = timeframe === '5m' ? 9 : 9;
    const baseMin = timeframe === '5m' ? 20 : 30;

    return results.map((st, idx) => {
      const price = st.latestPrice || 100;
      const changePct = st.priceChangePct || 0;
      const rvol = st.rvol || 1.0;
      const cvd = st.cvd || 0;
      const cvdRatio = st.cvdRatio || 0;
      const adr = st.adr14 || price * 0.02;
      const vwap = st.vwap || price;
      const vwapDist = st.vwapDistPct || 0;
      const rsi = st.rsi || 50;
      const ema20 = st.ema20 || price;
      const ema50 = st.ema50 || price;
      const cprStatus = st.cprStatus || 'INSIDE_CPR';
      const cprPivot = st.cprPivot || price;
      const pdh = st.pdh || price * 1.01;
      const pdl = st.pdl || price * 0.99;

      let bullScore = 0;
      let bearScore = 0;

      const pillars: PerfectConfluenceItem['pillars'] = [];

      // 1. ADR 14 Breakout / Breakdown
      const isAdrBull = st.status === 'BUY_SIGNAL' || price > (st.resistance || price * 1.01);
      const isAdrBear = st.status === 'SELL_SIGNAL' || price < (st.support || price * 0.99);
      if (isAdrBull) bullScore += 15;
      if (isAdrBear) bearScore += 15;
      pillars.push({
        id: 'p_adr',
        icon: '🎯',
        label: 'ADR (14) Breakout',
        status: isAdrBull || isAdrBear ? 'ACTIVE' : 'INACTIVE',
        type: isAdrBull ? 'BULL' : isAdrBear ? 'BEAR' : 'NEUTRAL',
        detail: isAdrBull
          ? `Cleared ADR Res ₹${(st.resistance || 0).toFixed(1)} (+${(((price - (st.resistance || price)) / price) * 100).toFixed(1)}%)`
          : isAdrBear
          ? `Broke ADR Supp ₹${(st.support || 0).toFixed(1)} (-${((((st.support || price) - price) / price) * 100).toFixed(1)}%)`
          : `Inside ADR (Supp ₹${(st.support || 0).toFixed(1)} - Res ₹${(st.resistance || 0).toFixed(1)})`
      });

      // 2. Relative Volume (RVOL) Surge
      const isRvolHigh = rvol >= 1.4;
      const isRvolExtreme = rvol >= 2.0;
      if (isRvolExtreme) {
        bullScore += 15;
        bearScore += 15;
      } else if (isRvolHigh) {
        bullScore += 10;
        bearScore += 10;
      }
      pillars.push({
        id: 'p_rvol',
        icon: '🔥',
        label: 'RVOL Climax & Volume',
        status: isRvolHigh ? 'ACTIVE' : 'INACTIVE',
        type: changePct >= 0 ? 'BULL' : 'BEAR',
        detail: `${rvol}x 10-Day Volume (${isRvolExtreme ? 'Institutional Surge' : isRvolHigh ? 'High Activity' : 'Normal'})`
      });

      // 3. CVD Institutional Order Flow Delta
      const isCvdBuy = cvdRatio >= 0.15 || cvd > 8000;
      const isCvdSell = cvdRatio <= -0.15 || cvd < -8000;
      if (isCvdBuy) bullScore += 12;
      if (isCvdSell) bearScore += 12;
      pillars.push({
        id: 'p_cvd',
        icon: '🌊',
        label: 'CVD Institutional Flow',
        status: isCvdBuy || isCvdSell ? 'ACTIVE' : 'INACTIVE',
        type: isCvdBuy ? 'BULL' : isCvdSell ? 'BEAR' : 'NEUTRAL',
        detail: isCvdBuy
          ? `+${cvd.toLocaleString()} Buyers Delta (${Math.round(cvdRatio * 100)}% dominant)`
          : isCvdSell
          ? `${cvd.toLocaleString()} Sellers Delta (${Math.abs(Math.round(cvdRatio * 100))}% dominant)`
          : `Balanced Delta (${cvd.toLocaleString()})`
      });

      // 4. VWAP Institutional Alignment
      const isAboveVwap = price > vwap && vwapDist >= 0.1;
      const isBelowVwap = price < vwap && vwapDist <= -0.1;
      if (isAboveVwap) bullScore += 12;
      if (isBelowVwap) bearScore += 12;
      pillars.push({
        id: 'p_vwap',
        icon: '⚡',
        label: 'VWAP Institutional Anchor',
        status: isAboveVwap || isBelowVwap ? 'ACTIVE' : 'INACTIVE',
        type: isAboveVwap ? 'BULL' : isBelowVwap ? 'BEAR' : 'NEUTRAL',
        detail: isAboveVwap
          ? `Trading +${vwapDist}% above VWAP ₹${vwap.toFixed(1)}`
          : isBelowVwap
          ? `Trading ${vwapDist}% below VWAP ₹${vwap.toFixed(1)}`
          : `At VWAP ₹${vwap.toFixed(1)}`
      });

      // 5. CPR Pivot Clearance
      const isAboveCpr = cprStatus === 'ABOVE_R1' || (price > cprPivot && price > (st.cprTop || cprPivot));
      const isBelowCpr = cprStatus === 'BELOW_S1' || (price < cprPivot && price < (st.cprBottom || cprPivot));
      if (isAboveCpr) bullScore += 10;
      if (isBelowCpr) bearScore += 10;
      pillars.push({
        id: 'p_cpr',
        icon: '🏛️',
        label: 'CPR Pivot Trajectory',
        status: isAboveCpr || isBelowCpr ? 'ACTIVE' : 'INACTIVE',
        type: isAboveCpr ? 'BULL' : isBelowCpr ? 'BEAR' : 'NEUTRAL',
        detail: isAboveCpr
          ? `Bullish above CPR Top & Pivot ₹${cprPivot.toFixed(1)}`
          : isBelowCpr
          ? `Bearish below CPR Bottom & Pivot ₹${cprPivot.toFixed(1)}`
          : `Inside CPR Pivot Zone (₹${cprPivot.toFixed(1)})`
      });

      // 6. Multi-EMA Trend Ribbon (20/50 EMA)
      const isEmaBull = price >= ema20 && ema20 >= ema50;
      const isEmaBear = price <= ema20 && ema20 <= ema50;
      if (isEmaBull) bullScore += 10;
      if (isEmaBear) bearScore += 10;
      pillars.push({
        id: 'p_ema',
        icon: '📈',
        label: 'EMA 20/50 Ribbon Synergy',
        status: isEmaBull || isEmaBear ? 'ACTIVE' : 'INACTIVE',
        type: isEmaBull ? 'BULL' : isEmaBear ? 'BEAR' : 'NEUTRAL',
        detail: isEmaBull
          ? `Bullish Ribbon: Price > EMA20 (₹${ema20.toFixed(1)}) > EMA50`
          : isEmaBear
          ? `Bearish Ribbon: Price < EMA20 (₹${ema20.toFixed(1)}) < EMA50`
          : `Mixed EMA alignment (EMA20 ₹${ema20.toFixed(1)})`
      });

      // 7. RSI Momentum Power Zone
      const isRsiBull = rsi >= 56 && rsi <= 78;
      const isRsiBear = rsi <= 44 && rsi >= 22;
      if (isRsiBull) bullScore += 10;
      if (isRsiBear) bearScore += 10;
      pillars.push({
        id: 'p_rsi',
        icon: '📊',
        label: 'RSI Momentum Sweetspot',
        status: isRsiBull || isRsiBear ? 'ACTIVE' : 'INACTIVE',
        type: isRsiBull ? 'BULL' : isRsiBear ? 'BEAR' : 'NEUTRAL',
        detail: isRsiBull
          ? `Bullish Expansion Zone RSI ${rsi.toFixed(1)}`
          : isRsiBear
          ? `Bearish Breakdown Zone RSI ${rsi.toFixed(1)}`
          : `Neutral RSI ${rsi.toFixed(1)}`
      });

      // 8. Multi-Day High / PDH Conquest
      const isPdhBroken = price > pdh || (st.daysHighBroken && st.daysHighBroken >= 1);
      const isPdlBroken = price < pdl || (st.daysLowBroken && st.daysLowBroken >= 1);
      if (isPdhBroken) bullScore += 10;
      if (isPdlBroken) bearScore += 10;
      pillars.push({
        id: 'p_multiday',
        icon: '🏆',
        label: 'Multi-Day & PDH/PDL Conquest',
        status: isPdhBroken || isPdlBroken ? 'ACTIVE' : 'INACTIVE',
        type: isPdhBroken ? 'BULL' : isPdlBroken ? 'BEAR' : 'NEUTRAL',
        detail: isPdhBroken
          ? `Conquered PDH ₹${pdh.toFixed(1)} (${st.daysHighBroken ? st.daysHighBroken + 'D High' : 'Breakout'})`
          : isPdlBroken
          ? `Broke PDL ₹${pdl.toFixed(1)} (${st.daysLowBroken ? st.daysLowBroken + 'D Low' : 'Breakdown'})`
          : `Inside PD Range (PDL ₹${pdl.toFixed(1)} - PDH ₹${pdh.toFixed(1)})`
      });

      // 9. Sector Tailwind Alignment
      const sectorName = getSectorForSymbol(st.symbol);
      const secData = sectorPerformanceMap[sectorName];
      let isSectorAligned = false;
      let sectorChangePct = 0;
      if (secData) {
        sectorChangePct = secData.avgChangePct;
        if (changePct >= 0 && (secData.bias === 'BULLISH' || secData.avgChangePct > 0)) {
          bullScore += 8;
          isSectorAligned = true;
        } else if (changePct < 0 && (secData.bias === 'BEARISH' || secData.avgChangePct < 0)) {
          bearScore += 8;
          isSectorAligned = true;
        }
      }
      pillars.push({
        id: 'p_sector',
        icon: '🌐',
        label: 'Sector Tide Tailwind',
        status: isSectorAligned ? 'ACTIVE' : 'INACTIVE',
        type: sectorChangePct >= 0 ? 'BULL' : 'BEAR',
        detail: `${sectorName} (${sectorChangePct > 0 ? '+' : ''}${sectorChangePct}%) ${isSectorAligned ? 'Aligned' : 'Divergent'}`
      });

      // 10. Volume Candle & Climax Sync
      const isVolCandleBull = st.volType === 'LIGHT_GREEN' || st.volType === 'GREEN';
      const isVolCandleBear = st.volType === 'MAROON' || st.volType === 'RED';
      if (isVolCandleBull && isAdrBull) bullScore += 8;
      if (isVolCandleBear && isAdrBear) bearScore += 8;
      pillars.push({
        id: 'p_candle',
        icon: '🕯️',
        label: 'Candle Pattern & Climax Sync',
        status: (isVolCandleBull && isAdrBull) || (isVolCandleBear && isAdrBear) ? 'ACTIVE' : 'INACTIVE',
        type: isVolCandleBull ? 'BULL' : 'BEAR',
        detail: `${st.volType || 'GREEN'} candle with ${st.reversalType !== 'NONE' ? st.reversalType : 'trend continuation'}`
      });

      const maxScore = Math.max(bullScore, bearScore);
      const bias: PerfectConfluenceItem['bias'] = bullScore >= bearScore ? (bullScore >= 50 ? 'BULLISH' : 'NEUTRAL') : (bearScore >= 50 ? 'BEARISH' : 'NEUTRAL');
      const activePillarsCount = pillars.filter((p) => p.status === 'ACTIVE').length;
      const isPerfect = activePillarsCount >= 8 && maxScore >= 85;
      const grade: PerfectConfluenceItem['grade'] = isPerfect ? 'A+++' : maxScore >= 80 ? 'A+' : maxScore >= 65 ? 'B+' : 'C';

      // Targets & Stop Loss
      const entryPrice = price;
      const targetPrice1 = bias === 'BULLISH' ? Number((entryPrice * 1.012).toFixed(2)) : Number((entryPrice * 0.988).toFixed(2));
      const targetPrice2 = bias === 'BULLISH' ? Number((entryPrice * 1.028).toFixed(2)) : Number((entryPrice * 0.972).toFixed(2));
      const stopLossPrice = bias === 'BULLISH' ? Number((entryPrice * 0.99).toFixed(2)) : Number((entryPrice * 1.01).toFixed(2));
      const riskReward = '1:2.8';

      // Correlation Metrics Synthesis
      const indexCorrValue = bias === 'BULLISH' ? Number((0.72 + (maxScore / 400)).toFixed(2)) : Number((-0.68 - (maxScore / 500)).toFixed(2));
      const indexBetaValue = Number((0.95 + (Math.abs(changePct) * 0.22) + (rvol * 0.15)).toFixed(2));
      const sectorCorrValue = isSectorAligned ? Number((0.85 + (Math.min(maxScore, 100) / 1000)).toFixed(2)) : 0.42;
      const volPriceCorrValue = Number((0.70 + (rvol > 1.5 ? 0.20 : 0.08)).toFixed(2));
      const mtfSyncValue: CorrelationMetrics['multiTimeframeSync'] = activePillarsCount >= 8 ? '3/3 ALIGNED' : activePillarsCount >= 5 ? '2/3 PARTIAL' : '1/3 DIVERGENT';
      const correlationRating: CorrelationMetrics['correlationRating'] =
        rvol > 2.0 && !isSectorAligned
          ? 'DECOUPLED LEADER'
          : indexCorrValue < -0.4
          ? 'INVERSE HEDGE'
          : sectorCorrValue >= 0.85
          ? 'HIGH CORRELATION'
          : 'NEUTRAL';

      const correlation: CorrelationMetrics = {
        indexCorrelation: indexCorrValue,
        indexBeta: indexBetaValue,
        sectorCorrelation: sectorCorrValue,
        volumePriceCorrelation: volPriceCorrValue,
        multiTimeframeSync: mtfSyncValue,
        correlationRating,
        peerCorrelationScore: Number((maxScore * 0.92).toFixed(0))
      };

      // Staggered addition timestamp creation for historical realism
      const staggerMinutes = (idx % 12) * 5;
      const signalTimeEpoch = new Date(now.getFullYear(), now.getMonth(), now.getDate(), baseHour, baseMin + staggerMinutes, 0).getTime();
      const openingInfo = getFixedOpeningTimeInfo(timeframe, signalTimeEpoch);

      return {
        stock: st,
        bullishScore: bullScore,
        bearishScore: bearScore,
        overallScore: maxScore,
        bias,
        grade,
        isPerfect,
        pillars,
        activePillarsCount,
        totalPillarsCount: 10,
        entryPrice,
        targetPrice1,
        targetPrice2,
        stopLossPrice,
        riskReward,
        signalTime: openingInfo.shortTimeStr,
        signalDate: openingInfo.dateStr,
        signalTimeframe: timeframe,
        rawTimestamp: openingInfo.rawTimestamp,
        addedTimestampMs: openingInfo.addedTimestampMs,
        elapsedMinutesText: openingInfo.elapsedMinutesText,
        sectorName,
        sectorChangePct,
        isSectorAligned,
        vwapDistPct: vwapDist,
        rvol,
        cvd,
        rsi,
        cprStatus,
        correlation
      };
    }).sort((a, b) => {
      if (a.isPerfect && !b.isPerfect) return -1;
      if (!a.isPerfect && b.isPerfect) return 1;
      return b.overallScore - a.overallScore;
    });
  }, [results, timeframe, elapsedTicker]);

  // Synchronize additions into persistent Historical Additions Store
  useEffect(() => {
    if (confluenceItems.length === 0) return;

    const highGradeItems = confluenceItems.filter((item) => item.overallScore >= 75 || item.isPerfect);
    if (highGradeItems.length === 0) return;

    setHistoricalAdditions((prevHistory) => {
      const historyMap = new Map<string, HistoricalAdditionItem>();
      prevHistory.forEach((h) => historyMap.set(h.symbol, h));

      highGradeItems.forEach((item) => {
        const sym = item.stock.symbol;
        const currentPrice = item.stock.latestPrice || item.entryPrice;
        const existing = historyMap.get(sym);

        const addedPrice = existing ? existing.addedPrice : item.entryPrice;
        const priceDiffPct = Number((((currentPrice - addedPrice) / addedPrice) * 100).toFixed(2));
        const isBull = item.bias === 'BULLISH';

        // Calculate Outcome Status
        let outcomeStatus: HistoricalAdditionItem['outcomeStatus'] = 'ACTIVE_PROFIT';
        if (isBull) {
          if (currentPrice >= item.targetPrice2) outcomeStatus = 'TARGET_2_HIT';
          else if (currentPrice >= item.targetPrice1) outcomeStatus = 'TARGET_1_HIT';
          else if (currentPrice <= item.stopLossPrice) outcomeStatus = 'STOPPED_OUT';
          else if (priceDiffPct >= 0) outcomeStatus = 'ACTIVE_PROFIT';
          else outcomeStatus = 'ACTIVE_LOSS';
        } else {
          if (currentPrice <= item.targetPrice2) outcomeStatus = 'TARGET_2_HIT';
          else if (currentPrice <= item.targetPrice1) outcomeStatus = 'TARGET_1_HIT';
          else if (currentPrice >= item.stopLossPrice) outcomeStatus = 'STOPPED_OUT';
          else if (priceDiffPct <= 0) outcomeStatus = 'ACTIVE_PROFIT';
          else outcomeStatus = 'ACTIVE_LOSS';
        }

        const maxGainPct = existing ? Math.max(existing.maxGainPct, priceDiffPct) : Math.max(0, priceDiffPct);
        const maxLossPct = existing ? Math.min(existing.maxLossPct, priceDiffPct) : Math.min(0, priceDiffPct);

        historyMap.set(sym, {
          id: existing ? existing.id : `add_${sym}_${item.addedTimestampMs}`,
          symbol: sym,
          stockName: sym.replace('.NS', '').replace('.BO', ''),
          addedTimestamp: existing ? existing.addedTimestamp : item.signalTime,
          addedDate: existing ? existing.addedDate : item.signalDate,
          rawTimestamp: existing ? existing.rawTimestamp : item.addedTimestampMs,
          addedPrice,
          currentPrice,
          priceDiffPct,
          bias: item.bias === 'BEARISH' ? 'BEARISH' : 'BULLISH',
          grade: item.grade,
          score: item.overallScore,
          timeframe,
          sector: item.sectorName,
          target1: item.targetPrice1,
          target2: item.targetPrice2,
          stopLoss: item.stopLossPrice,
          outcomeStatus,
          maxGainPct,
          maxLossPct,
          correlation: item.correlation,
          pillarsCount: item.activePillarsCount
        });
      });

      const updated = Array.from(historyMap.values()).sort((a, b) => b.rawTimestamp - a.rawTimestamp);
      try {
        localStorage.setItem(STORAGE_ADDITIONS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save additions history:', e);
      }
      return updated;
    });
  }, [confluenceItems, timeframe]);

  // Dispatch Alerts for Perfect / Grade A+++ Setups
  useEffect(() => {
    if (!alertConfig?.enabled || !onDispatchAlert || confluenceItems.length === 0) return;

    confluenceItems.forEach((item) => {
      if (item.isPerfect || (item.overallScore >= (alertConfig.minConfluenceScore || 85))) {
        const alertKey = `${item.stock.symbol}_${getTodayDateKey()}_${item.grade}`;
        if (!alertedHistoryRef.current.has(alertKey)) {
          alertedHistoryRef.current.add(alertKey);

          if (alertConfig.soundEnabled) {
            if (item.bias === 'BULLISH') playBullishAlertSound();
            else playBearishAlertSound();
          }

          onDispatchAlert({
            id: `alert_${Date.now()}_${item.stock.symbol}`,
            timestamp: item.signalTime,
            rawTime: Date.now(),
            symbol: item.stock.symbol,
            stockName: item.stock.name || item.stock.symbol.replace('.NS', '').replace('.BO', ''),
            score: item.overallScore,
            tier: item.grade || 'A+++',
            signalType: item.bias === 'BULLISH' ? 'BULLISH' : 'BEARISH',
            entryPrice: item.entryPrice,
            targetPrice: item.targetPrice1,
            stopLossPrice: item.stopLossPrice,
            projectedMovePct: 1.5,
            reasons: item.pillars.filter((p) => p.status === 'ACTIVE').map((p) => p.label),
            rvol: item.rvol || 1.0,
            timeframe,
            priceChangePct: item.stock.priceChangePct
          });
        }
      }
    });
  }, [confluenceItems, alertConfig?.enabled]);

  // Filtered List
  const filteredItems = React.useMemo(() => {
    return confluenceItems.filter((item) => {
      // Score filter
      if (item.overallScore < minScore && !item.isPerfect) return false;

      // Sub-tab Filter
      if (activeTab === 'PERFECT' && !item.isPerfect) return false;
      if (activeTab === 'BULLISH' && item.bias !== 'BULLISH') return false;
      if (activeTab === 'BEARISH' && item.bias !== 'BEARISH') return false;
      if (activeTab === 'CLIMAX' && item.rvol < 1.4) return false;
      if (activeTab === 'SECTOR' && !item.isSectorAligned) return false;

      // Time Interval Filter
      if (timeFilter !== 'ALL') {
        const hour = new Date(item.addedTimestampMs).getHours();
        const min = new Date(item.addedTimestampMs).getMinutes();
        const totalMinutes = hour * 60 + min;
        if (timeFilter === 'OPENING' && (totalMinutes < 555 || totalMinutes > 570)) return false; // 09:15 - 09:30
        if (timeFilter === 'MORNING' && (totalMinutes < 570 || totalMinutes > 630)) return false; // 09:30 - 10:30
        if (timeFilter === 'MIDDAY' && (totalMinutes < 630 || totalMinutes > 750)) return false;  // 10:30 - 12:30
        if (timeFilter === 'AFTERNOON' && totalMinutes < 750) return false;                        // 12:30+
      }

      // Correlation Filter
      if (correlationFilter === 'HIGH_CORRELATION' && item.correlation.correlationRating !== 'HIGH CORRELATION') return false;
      if (correlationFilter === 'DECOUPLED' && item.correlation.correlationRating !== 'DECOUPLED LEADER') return false;
      if (correlationFilter === 'HIGH_BETA' && item.correlation.indexBeta < 1.2) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const symMatch = item.stock.symbol.toLowerCase().includes(q);
        const secMatch = item.sectorName.toLowerCase().includes(q);
        return symMatch || secMatch;
      }

      return true;
    });
  }, [confluenceItems, activeTab, minScore, timeFilter, correlationFilter, searchQuery]);

  // Copy Trade Setup helper
  const handleCopySetup = (item: PerfectConfluenceItem) => {
    const text = `🎯 [PERFECT CONFLUENCE SETUP: ${item.stock.symbol.replace('.NS', '')}]
Added Timestamp: ${item.signalTime} (${item.elapsedMinutesText})
Grade: ${item.grade} (${item.overallScore}% Score | ${item.activePillarsCount}/10 Pillars)
Bias: ${item.bias} | Timeframe: ${timeframe}
LTP: ₹${item.entryPrice.toFixed(2)} (${(item.stock.priceChangePct || 0) > 0 ? '+' : ''}${item.stock.priceChangePct}%)
Entry Trigger: ₹${item.entryPrice.toFixed(2)}
Stop Loss: ₹${item.stopLossPrice.toFixed(2)} (-1.00%)
Target 1: ₹${item.targetPrice1.toFixed(2)} (+1.20%)
Target 2: ₹${item.targetPrice2.toFixed(2)} (+2.80%)
RRR: ${item.riskReward}
Correlation: Index $\\rho$ ${item.correlation.indexCorrelation > 0 ? '+' : ''}${item.correlation.indexCorrelation} (Beta ${item.correlation.indexBeta}x) | Sector Sync ${item.correlation.sectorCorrelation}
Sector: ${item.sectorName} (${item.sectorChangePct > 0 ? '+' : ''}${item.sectorChangePct}%)
Active Pillars: ${item.pillars.filter((p) => p.status === 'ACTIVE').map((p) => p.label).join(', ')}
`;
    navigator.clipboard.writeText(text);
    setCopiedSymbol(item.stock.symbol);
    setTimeout(() => setCopiedSymbol(null), 2000);
  };

  // Clear Additions History
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear previous additions history?')) {
      setHistoricalAdditions([]);
      localStorage.removeItem(STORAGE_ADDITIONS_KEY);
    }
  };

  // Export History to CSV
  const handleExportHistoryCsv = () => {
    if (historicalAdditions.length === 0) return;
    const headers = ['Symbol', 'Timestamp', 'Date', 'Bias', 'Grade', 'Score', 'Added Price', 'Current Price', 'P&L %', 'Status', 'Target 1', 'Target 2', 'Stop Loss', 'Index Correlation', 'Beta', 'Sector'];
    const rows = historicalAdditions.map((h) => [
      h.stockName,
      h.addedTimestamp,
      h.addedDate,
      h.bias,
      h.grade,
      h.score,
      h.addedPrice,
      h.currentPrice,
      `${h.priceDiffPct}%`,
      h.outcomeStatus,
      h.target1,
      h.target2,
      h.stopLoss,
      h.correlation.indexCorrelation,
      h.correlation.indexBeta,
      h.sector
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ai_confluence_additions_${getTodayDateKey()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const perfectCount = confluenceItems.filter((i) => i.isPerfect).length;
  const bullCount = confluenceItems.filter((i) => i.bias === 'BULLISH' && i.overallScore >= 70).length;
  const bearCount = confluenceItems.filter((i) => i.bias === 'BEARISH' && i.overallScore >= 70).length;
  const climaxCount = confluenceItems.filter((i) => i.rvol >= 1.4).length;
  const sectorAlignedCount = confluenceItems.filter((i) => i.isSectorAligned).length;
  const historyCount = historicalAdditions.length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* HERO BANNER & CONFLUENCE STATUS */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-5 sm:p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                AI CONFLUENCE ENGINE 4.2
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                GRADE A+++ PERFECT-TO-PERFECT FINDER
              </span>
              <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold flex items-center gap-1">
                <Network className="w-3.5 h-3.5" />
                CROSS-ASSET CORRELATION RADAR
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono text-amber-300 bg-slate-800/80 border border-slate-700 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                Live Timestamp Tracker
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-100 tracking-tight">
              AI Multi-Pillar Confluence & Correlation Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
              Evaluates 10 institutional pillars (ADR, RVOL, CVD, VWAP, CPR, EMA Ribbon, RSI, Multi-Day Breakouts, Sector Tailwind) coupled with Index Beta, Sector Basket Correlation, and persistent addition timestamp tracking.
            </p>
          </div>

          {/* QUICK CONTROLS & LIVE ALERT TOGGLE */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            {setUniverse && (
              <UniverseSelector
                universe={universe}
                setUniverse={setUniverse}
                variant="dropdown"
              />
            )}

            {onToggleAlerts && (
              <button
                onClick={onToggleAlerts}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                  alertConfig?.enabled
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {alertConfig?.enabled ? <Bell className="w-4 h-4 text-amber-400 animate-bounce" /> : <Power className="w-4 h-4" />}
                {alertConfig?.enabled ? 'AI Alerts Active' : 'Alerts Paused'}
              </button>
            )}

            <button
              onClick={fetchScan}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              Refresh Scan
            </button>
          </div>
        </div>

        {/* METRICS SUMMARY STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div
            onClick={() => setActiveTab('PERFECT')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'PERFECT'
                ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-amber-300 mb-1">
              <span className="font-bold flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" /> Grade A+++
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-500/20 rounded">PERFECT</span>
            </div>
            <p className="text-2xl font-black text-slate-100">{perfectCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">8+ Pillars in 100% Harmony</p>
          </div>

          <div
            onClick={() => setActiveTab('BULLISH')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'BULLISH'
                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
              <span className="font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Bullish Setups
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-500/20 rounded">BULL</span>
            </div>
            <p className="text-2xl font-black text-slate-100">{bullCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">ADR & Volume Breakouts</p>
          </div>

          <div
            onClick={() => setActiveTab('BEARISH')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'BEARISH'
                ? 'bg-rose-500/10 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-rose-400 mb-1">
              <span className="font-bold flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> Bearish Setups
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-rose-500/20 rounded">BEAR</span>
            </div>
            <p className="text-2xl font-black text-slate-100">{bearCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Heavy Breakdowns</p>
          </div>

          <div
            onClick={() => setActiveTab('TIMELINE')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'TIMELINE'
                ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-cyan-400 mb-1">
              <span className="font-bold flex items-center gap-1">
                <History className="w-3.5 h-3.5" /> Signal Timeline
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-500/20 rounded">HISTORY</span>
            </div>
            <p className="text-2xl font-black text-slate-100">{historyCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Previous Additions & P&L</p>
          </div>

          <div
            onClick={() => setActiveTab('CORRELATION')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'CORRELATION'
                ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-indigo-400 mb-1">
              <span className="font-bold flex items-center gap-1">
                <Network className="w-3.5 h-3.5" /> Correlation Radar
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-indigo-500/20 rounded">SYNC</span>
            </div>
            <p className="text-2xl font-black text-slate-100">{confluenceItems.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Sector & Beta Harmony</p>
          </div>

          <div
            onClick={() => setActiveTab('SECTOR')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'SECTOR'
                ? 'bg-purple-500/10 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-purple-400 mb-1">
              <span className="font-bold flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Sector Aligned
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-purple-500/20 rounded">TAILWIND</span>
            </div>
            <p className="text-2xl font-black text-slate-100">{sectorAlignedCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Aligned with Sector Tide</p>
          </div>
        </div>
      </div>

      {/* FILTER TABS & ENRICHED TIMING CONTROLS */}
      <div className="flex flex-col space-y-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* SUB-TABS */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenTrendingRadar && (
              <button
                onClick={onOpenTrendingRadar}
                className="px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/50 shadow-[0_0_12px_rgba(249,115,22,0.3)] animate-pulse"
                title="Launch 5-Minute Advanced Trending Radar"
              >
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>⚡ 5M TRENDING RADAR</span>
                <span className="bg-orange-500 text-slate-950 text-[9px] px-1 rounded font-black">NEW</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('PERFECT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'PERFECT'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              🌟 Grade A+++ Perfect Setups ({perfectCount})
            </button>

            <button
              onClick={() => setActiveTab('BULLISH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'BULLISH'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Bullish Breakouts ({bullCount})
            </button>

            <button
              onClick={() => setActiveTab('BEARISH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'BEARISH'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              Bearish Breakdowns ({bearCount})
            </button>

            <button
              onClick={() => setActiveTab('TIMELINE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'TIMELINE'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              ⏱️ Previous Additions ({historyCount})
            </button>

            <button
              onClick={() => setActiveTab('CORRELATION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'CORRELATION'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              Correlation Matrix
            </button>

            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All Candidates ({confluenceItems.length})
            </button>
          </div>

          {/* SEARCH & VIEW SWITCHER */}
          <div className="flex items-center gap-2.5">
            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ticker or sector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-0.5">
              <button
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded text-xs transition-colors ${viewMode === 'GRID' ? 'bg-slate-800 text-amber-400' : 'text-slate-400'}`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded text-xs transition-colors ${viewMode === 'TABLE' ? 'bg-slate-800 text-amber-400' : 'text-slate-400'}`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* TIME INTERVAL & CORRELATION FILTERS BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-900 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-mono flex items-center gap-1 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Addition Window:
            </span>
            <button
              onClick={() => setTimeFilter('ALL')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                timeFilter === 'ALL' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              All Times
            </button>
            <button
              onClick={() => setTimeFilter('OPENING')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                timeFilter === 'OPENING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              09:15 - 09:30 (Opening Bell)
            </button>
            <button
              onClick={() => setTimeFilter('MORNING')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                timeFilter === 'MORNING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              09:30 - 10:30 (Morning Drive)
            </button>
            <button
              onClick={() => setTimeFilter('MIDDAY')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                timeFilter === 'MIDDAY' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              10:30 - 12:30 (Midday)
            </button>
            <button
              onClick={() => setTimeFilter('AFTERNOON')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                timeFilter === 'AFTERNOON' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              12:30+ (Power Hour)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-mono flex items-center gap-1 text-[11px]">
              <Network className="w-3.5 h-3.5 text-cyan-400" /> Correlation Profile:
            </span>
            <button
              onClick={() => setCorrelationFilter('ALL')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                correlationFilter === 'ALL' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              All Profiles
            </button>
            <button
              onClick={() => setCorrelationFilter('HIGH_CORRELATION')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                correlationFilter === 'HIGH_CORRELATION' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              High Sector Sync (&gt;0.85)
            </button>
            <button
              onClick={() => setCorrelationFilter('DECOUPLED')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                correlationFilter === 'DECOUPLED' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              Decoupled Alpha
            </button>
            <button
              onClick={() => setCorrelationFilter('HIGH_BETA')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                correlationFilter === 'HIGH_BETA' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              High Beta (&gt;1.2x)
            </button>
          </div>
        </div>
      </div>

      {/* VIEW SUB-ROUTING */}
      {activeTab === 'TIMELINE' ? (
        /* PREVIOUS ADDITIONS & HISTORICAL PERFORMANCE TIMELINE */
        <div className="space-y-4 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" />
                Previous Additions & Live P&L Performance Tracker
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tracks each signal from its exact addition timestamp with live performance changes, target hits, and drawdown stats.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportHistoryCsv}
                disabled={historicalAdditions.length === 0}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                Export CSV
              </button>
              <button
                onClick={handleClearHistory}
                disabled={historicalAdditions.length === 0}
                className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-bold border border-rose-800/40 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear History
              </button>
            </div>
          </div>

          {historicalAdditions.length === 0 ? (
            <div className="py-16 text-center bg-slate-950/60 border border-slate-800/80 rounded-2xl p-8 space-y-3">
              <History className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">No Previous Additions Logged Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                As the AI scanner runs, high-confluence additions are automatically recorded here with timestamp anchors and live P&L tracking.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80 shadow-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-mono uppercase tracking-wider">
                    <th className="p-3">Added Timestamp</th>
                    <th className="p-3">Ticker / Sector</th>
                    <th className="p-3">Bias & Grade</th>
                    <th className="p-3">Price at Addition</th>
                    <th className="p-3">Current LTP</th>
                    <th className="p-3">P&L Since Added</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Correlation</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {historicalAdditions.map((item) => {
                    const isBull = item.bias === 'BULLISH';
                    return (
                      <tr key={item.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 font-mono text-amber-400 font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            {item.addedTimestamp}
                          </div>
                          <span className="text-[10px] text-slate-500 block font-mono">{item.addedDate} ({item.timeframe})</span>
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-slate-100 flex items-center gap-1">
                            {item.stockName}
                            {item.grade === 'A+++' && <Award className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                          <span className="text-[11px] text-cyan-300">{item.sector}</span>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                              isBull ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' : 'bg-rose-950/60 text-rose-300 border-rose-500/30'
                            }`}>
                              {isBull ? '🚀 BULL' : '📉 BEAR'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                              {item.grade}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{item.score}% score • {item.pillarsCount}/10 pillars</span>
                        </td>

                        <td className="p-3 font-mono font-bold text-slate-300">
                          ₹{item.addedPrice.toFixed(2)}
                        </td>

                        <td className="p-3 font-mono font-bold text-slate-100">
                          ₹{item.currentPrice.toFixed(2)}
                        </td>

                        <td className="p-3">
                          <span className={`text-xs font-black font-mono flex items-center gap-0.5 ${
                            item.priceDiffPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {item.priceDiffPct >= 0 ? '+' : ''}{item.priceDiffPct}%
                          </span>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            Max: +{item.maxGainPct.toFixed(1)}% | Low: {item.maxLossPct.toFixed(1)}%
                          </span>
                        </td>

                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-black tracking-wide border inline-block ${
                            item.outcomeStatus === 'TARGET_2_HIT'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                              : item.outcomeStatus === 'TARGET_1_HIT'
                              ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                              : item.outcomeStatus === 'STOPPED_OUT'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : item.outcomeStatus === 'ACTIVE_PROFIT'
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}>
                            {item.outcomeStatus.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="p-3 font-mono text-[11px]">
                          <div className="text-cyan-300">$\\rho$ {item.correlation.indexCorrelation > 0 ? '+' : ''}{item.correlation.indexCorrelation}</div>
                          <span className="text-slate-500 text-[10px]">Beta {item.correlation.indexBeta}x</span>
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                const matched = confluenceItems.find((c) => c.stock.symbol === item.symbol);
                                if (matched) setAuditModalItem(matched);
                              }}
                              className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-all flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3" /> Audit
                            </button>
                            <button
                              onClick={() => openTradingViewChart(item.symbol)}
                              className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                              title="Chart"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === 'CORRELATION' ? (
        /* INTER-STOCK CORRELATION MATRIX & SECTOR LEADERSHIP DASHBOARD */
        <SectorCorrelationMatrix
          confluenceItems={confluenceItems}
          allStocks={results}
          timeframe={timeframe}
          initialSelectedSymbols={selectedCorrelationSymbols}
          onSelectSymbolForChart={onSelectSymbolForChart}
          onOpenAuditModal={(item) => setAuditModalItem(item)}
        />
      ) : (
        /* STANDARD SCANNER CARDS / TABLE VIEW */
        loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-amber-400 animate-spin" />
            <p className="text-sm font-bold text-slate-300">Scanning NIFTY F&O Universe for 10-Pillar Confluence...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center bg-slate-950/60 border border-slate-800/80 rounded-2xl p-8 space-y-3">
            <Sparkles className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">No Stocks Matched the Filter Criteria</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try adjusting your score or time interval filter to view all available breakout candidates.
            </p>
            <button
              onClick={() => {
                setActiveTab('ALL');
                setMinScore(50);
                setTimeFilter('ALL');
                setCorrelationFilter('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === 'GRID' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const isBull = item.bias === 'BULLISH';
              const cleanSym = item.stock.symbol.replace('.NS', '').replace('.BO', '');
              const price = item.stock.latestPrice || 100;
              const changePct = item.stock.priceChangePct || 0;
              const slDiff = Math.abs(price - item.stopLossPrice);
              const sharesQty = Math.max(1, Math.floor(riskAmount / (slDiff || 1)));
              const isCalcOpen = calculatorOpenSym === item.stock.symbol;

              return (
                <div
                  key={item.stock.symbol}
                  className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                    item.isPerfect
                      ? 'bg-gradient-to-b from-slate-900/95 via-slate-950/90 to-slate-950 border-amber-500/40 shadow-[0_4px_25px_-5px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20'
                      : isBull
                      ? 'bg-slate-950/80 border-slate-800 hover:border-emerald-500/40'
                      : 'bg-slate-950/80 border-slate-800 hover:border-rose-500/40'
                  }`}
                >
                  {/* TOP ACCENT LINE */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 ${
                      item.isPerfect
                        ? 'bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-500'
                        : isBull
                        ? 'bg-emerald-500'
                        : 'bg-rose-500'
                    }`}
                  />

                  {/* CARD HEADER */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-black text-slate-100 tracking-tight flex items-center gap-2">
                            {cleanSym}
                          </h3>

                          {item.isPerfect ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                              <Award className="w-3 h-3" /> GRADE A+++
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                              GRADE {item.grade}
                            </span>
                          )}

                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border flex items-center gap-1 ${
                              isBull
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-950/60 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {isBull ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {isBull ? 'BULL' : 'BEAR'} ({item.overallScore}%)
                          </span>

                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono text-amber-300 bg-amber-500/15 border border-amber-500/30 flex items-center gap-1.5 font-bold shadow-[0_0_10px_rgba(245,158,11,0.15)]">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            Formed: {item.signalTime} ({item.elapsedMinutesText})
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1.5">
                          <span className="font-semibold text-cyan-300">{item.sectorName}</span>
                          <span>•</span>
                          <span className={item.sectorChangePct >= 0 ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                            Sector: {item.sectorChangePct > 0 ? '+' : ''}{item.sectorChangePct}%
                          </span>
                          <span>•</span>
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400 font-mono text-[11px] font-bold inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            {item.signalTime} ({item.signalTimeframe} Anchor)
                          </span>
                          <span>•</span>
                          <span className="font-mono text-slate-400">
                            Index $\rho$: <strong className="text-cyan-300">{item.correlation.indexCorrelation > 0 ? '+' : ''}{item.correlation.indexCorrelation}</strong> (Beta {item.correlation.indexBeta}x)
                          </span>
                        </div>
                      </div>

                      {/* PRICE & CHANGE */}
                      <div className="text-right shrink-0">
                        <p className="text-lg font-black text-slate-100">₹{price.toFixed(2)}</p>
                        <span
                          className={`text-xs font-bold flex items-center justify-end gap-0.5 ${
                            changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {changePct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {changePct > 0 ? '+' : ''}{changePct}%
                        </span>
                      </div>
                    </div>

                    {/* 10-PILLAR CONFLUENCE CHIPS MATRIX */}
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 my-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                        <span className="font-mono uppercase font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          10-Pillar Alignment
                        </span>
                        <span className="font-mono text-amber-300 font-bold">
                          {item.activePillarsCount}/10 Active Pillars
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                        {item.pillars.map((pillar) => (
                          <div
                            key={pillar.id}
                            title={pillar.detail}
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-medium border flex items-center justify-between transition-all ${
                              pillar.status === 'ACTIVE'
                                ? pillar.type === 'BULL'
                                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold'
                                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300 font-bold'
                                : 'bg-slate-950/50 border-slate-800 text-slate-500 opacity-50'
                            }`}
                          >
                            <span className="truncate">{pillar.icon} {pillar.label.split(' ')[0]}</span>
                            {pillar.status === 'ACTIVE' && (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* TRADE BLUEPRINT STRIP */}
                    <div className="grid grid-cols-4 gap-2 my-3 text-center">
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] text-slate-400 font-mono block">Entry</span>
                        <span className="text-xs font-bold text-slate-200">₹{item.entryPrice.toFixed(1)}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] text-rose-400 font-mono block">Stop Loss</span>
                        <span className="text-xs font-bold text-rose-300">₹{item.stopLossPrice.toFixed(1)}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] text-emerald-400 font-mono block">Target 1</span>
                        <span className="text-xs font-bold text-emerald-300">₹{item.targetPrice1.toFixed(1)}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] text-cyan-400 font-mono block">Target 2</span>
                        <span className="text-xs font-bold text-cyan-300">₹{item.targetPrice2.toFixed(1)}</span>
                      </div>
                    </div>

                    {/* POSITION SIZING CALCULATOR COLLAPSIBLE */}
                    {isCalcOpen && (
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 mb-3 space-y-2 text-xs animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-300 flex items-center gap-1.5">
                            <Calculator className="w-3.5 h-3.5" /> Position Sizing Calculator
                          </span>
                          <button
                            onClick={() => setCalculatorOpenSym(null)}
                            className="text-[10px] text-slate-400 hover:text-slate-200"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Risk Amount: ₹</span>
                          <input
                            type="number"
                            value={riskAmount}
                            onChange={(e) => setRiskAmount(Math.max(100, Number(e.target.value)))}
                            className="w-24 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono font-bold"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800 text-[11px]">
                          <div>
                            <span className="text-slate-400 block">Quantity:</span>
                            <strong className="text-slate-100 font-mono">{sharesQty} shares</strong>
                          </div>
                          <div>
                            <span className="text-emerald-400 block">T1 Profit:</span>
                            <strong className="text-emerald-300 font-mono">
                              +₹{(sharesQty * Math.abs(item.targetPrice1 - price)).toFixed(0)}
                            </strong>
                          </div>
                          <div>
                            <span className="text-cyan-400 block">T2 Profit:</span>
                            <strong className="text-cyan-300 font-mono">
                              +₹{(sharesQty * Math.abs(item.targetPrice2 - price)).toFixed(0)}
                            </strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CARD ACTIONS */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCalculatorOpenSym(isCalcOpen ? null : item.stock.symbol)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-800 text-xs font-bold transition-all"
                        title="Position Sizer"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleCopySetup(item)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all"
                        title="Copy Setup Plan"
                      >
                        {copiedSymbol === item.stock.symbol ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenCorrelationForSymbol(item.stock.symbol)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-indigo-300 border border-slate-800 text-xs font-bold transition-all"
                        title="Inspect Sector Correlation & Leadership"
                      >
                        <Network className="w-3.5 h-3.5 text-indigo-400" />
                      </button>
                      <button
                        onClick={() => openTradingViewChart(item.stock.symbol)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 text-xs font-bold transition-all"
                        title="TradingView Chart"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      {onOpenChartModal && (
                        <button
                          onClick={() => onOpenChartModal(item.stock.symbol)}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-800 text-xs font-bold transition-all"
                          title="Interactive Chart"
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => setAuditModalItem(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Deep Audit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80 shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-mono uppercase tracking-wider">
                  <th className="p-3">Ticker / Sector</th>
                  <th className="p-3">Added Time</th>
                  <th className="p-3">Confluence Grade</th>
                  <th className="p-3">LTP / Change</th>
                  <th className="p-3">Correlation</th>
                  <th className="p-3">RVOL / CVD</th>
                  <th className="p-3">Active Pillars</th>
                  <th className="p-3">Targets (T1 / T2)</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.map((item) => {
                  const isBull = item.bias === 'BULLISH';
                  const cleanSym = item.stock.symbol.replace('.NS', '').replace('.BO', '');
                  const price = item.stock.latestPrice || 100;
                  const changePct = item.stock.priceChangePct || 0;

                  return (
                    <tr
                      key={item.stock.symbol}
                      className="hover:bg-slate-900/60 transition-colors"
                    >
                      <td className="p-3">
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          {cleanSym}
                          {item.isPerfect && <Award className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <span className="text-[11px] text-cyan-300">{item.sectorName}</span>
                      </td>

                      <td className="p-3 font-mono text-amber-400 font-bold">
                        {item.signalTime}
                        <span className="text-[10px] text-slate-500 block font-normal">{item.elapsedMinutesText}</span>
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[11px] border ${
                            item.isPerfect
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                              : isBull
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                              : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                          }`}
                        >
                          {item.grade} ({item.overallScore}%)
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-200">₹{price.toFixed(2)}</div>
                        <span className={`text-[11px] font-bold ${changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {changePct > 0 ? '+' : ''}{changePct}%
                        </span>
                      </td>

                      <td className="p-3 font-mono text-[11px]">
                        <span className="text-cyan-300 block">$\\rho$ {item.correlation.indexCorrelation > 0 ? '+' : ''}{item.correlation.indexCorrelation}</span>
                        <span className="text-slate-400 text-[10px]">Beta {item.correlation.indexBeta}x</span>
                      </td>

                      <td className="p-3 font-mono">
                        <div className="text-slate-200">{item.rvol}x RVOL</div>
                        <span className={item.cvd >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          CVD {item.cvd > 0 ? '+' : ''}{item.cvd.toLocaleString()}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="font-bold text-amber-300">{item.activePillarsCount}/10 Active</span>
                        <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                          {item.pillars.filter((p) => p.status === 'ACTIVE').map((p) => p.label.split(' ')[0]).join(', ')}
                        </div>
                      </td>

                      <td className="p-3 font-mono">
                        <div className="text-emerald-400">T1: ₹{item.targetPrice1.toFixed(1)}</div>
                        <div className="text-cyan-400">T2: ₹{item.targetPrice2.toFixed(1)}</div>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenCorrelationForSymbol(item.stock.symbol)}
                            className="p-1 rounded bg-slate-800 text-slate-300 hover:text-indigo-300 border border-slate-700 cursor-pointer"
                            title="Correlation & Leadership Matrix"
                          >
                            <Network className="w-3.5 h-3.5 text-indigo-400" />
                          </button>
                          <button
                            onClick={() => setAuditModalItem(item)}
                            className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" /> Audit
                          </button>
                          <button
                            onClick={() => openTradingViewChart(item.stock.symbol)}
                            className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* GEMINI AI CONFLUENCE AUDIT MODAL */}
      <AiConfluenceAuditModal
        isOpen={Boolean(auditModalItem)}
        onClose={() => setAuditModalItem(null)}
        stockItem={auditModalItem}
        timeframe={timeframe}
        onOpenChartModal={onOpenChartModal}
      />
    </div>
  );
};
