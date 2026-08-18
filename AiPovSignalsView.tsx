import React, { useState, useEffect, useRef } from 'react';
import { StockScanStatus, AiAlphaAlertConfig, AiAlphaAlertEvent, UniverseType } from '../types';
import { UniverseSelector } from './UniverseSelector';
import { getNseStocksByUniverse } from '../constants/allNseStocks';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowUpDown,
  RefreshCw,
  AlertCircle,
  Filter,
  CheckCircle2,
  ShieldCheck,
  Flame,
  Target,
  BarChart2,
  Bell,
  BellOff,
  Power,
  Volume2,
  VolumeX,
  Sliders,
  History,
  Zap,
  Play,
  Settings,
  ExternalLink,
  Lock,
  RotateCcw
} from 'lucide-react';
import { AiAlphaAlertModal } from './AiAlphaAlertModal';
import { AiAlphaAlertTriggerPopup } from './AiAlphaAlertTriggerPopup';
import { AiAlphaAlertHistoryModal } from './AiAlphaAlertHistoryModal';
import { SentimentGauge } from './SentimentGauge';
import { playBullishAlertSound, playBearishAlertSound, playTestBeep } from '../utils/soundAlert';
import { openTradingViewChart } from '../utils/tradingView';

interface AiPovSignalsViewProps {
  timeframe: '5m' | '15m';
  setTimeframe: (tf: '5m' | '15m') => void;
  universe: UniverseType;
  setUniverse?: (u: UniverseType) => void;
  onSelectSymbolForChart: (symbol: string) => void;
  onOpenChartModal?: (symbol: string) => void;
  initialSubTab?: 'BOTH' | 'BULLISH' | 'BEARISH';
  onOpenAlertModal?: () => void;
  alertConfig?: AiAlphaAlertConfig;
  onToggleAlerts?: () => void;
  onDispatchAlert?: (event: AiAlphaAlertEvent) => void;
}

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

export interface LockedSignalRecord {
  symbol: string;
  stockName?: string;
  signalType: 'BULLISH' | 'BEARISH';
  timestamp: string;
  rawTimestamp: number;
  convictionScore: number;
  tier: 'STRONG' | 'HIGH' | 'MODERATE';
  projectedMovePct: number;
  entryPrice: number;
  targetPrice: number;
  stopLossPrice: number;
  riskReward: string;
  reasons: string[];
  initialPriceChangePct?: number;
  initialPrice: number;
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
  return {
    timeStr,
    shortTimeStr,
    rawTimestamp: d.getTime(),
    candleTime: is5m ? '09:20' : '09:30'
  };
};

const NIFTY_200_STOCKS = Array.from(new Set([
  'ABB.NS', 'ACC.NS', 'AUBANK.NS', 'ABBOTINDIA.NS', 'ADANIENSOL.NS', 'ADANIENT.NS', 'ADANIGREEN.NS', 'ADANIPORTS.NS',
  'ADANIPOWER.NS', 'ATGL.NS', 'ABCAPITAL.NS', 'ABFRL.NS', 'ALKEM.NS', 'AMBUJACEM.NS', 'APOLLOHOSP.NS', 'APOLLOTYRE.NS',
  'ASHOKLEY.NS', 'ASIANPAINT.NS', 'ASTRAL.NS', 'ATUL.NS', 'AUROPHARMA.NS', 'AXISBANK.NS', 'BAJAJ-AUTO.NS', 'BAJFINANCE.NS',
  'BAJAJFINSV.NS', 'BAJAJHLDNG.NS', 'BALKRISIND.NS', 'BANDHANBNK.NS', 'BANKBARODA.NS', 'BANKINDIA.NS', 'BERGEPAINT.NS',
  'BEL.NS', 'BHARATFORG.NS', 'BHEL.NS', 'BPCL.NS', 'BHARTIARTL.NS', 'BIOCON.NS', 'BOSCHLTD.NS', 'BRITANNIA.NS',
  'CGPOWER.NS', 'CANBK.NS', 'CHOLAFIN.NS', 'CIPLA.NS', 'COALINDIA.NS', 'COFORGE.NS', 'COLPAL.NS', 'CONCOR.NS',
  'CUMMINSIND.NS', 'DLF.NS', 'DABUR.NS', 'DIVISLAB.NS', 'DIXON.NS', 'LALPATHLAB.NS', 'DRREDDY.NS',
  'EICHERMOT.NS', 'ESCORTS.NS', 'EXIDEIND.NS', 'GAIL.NS', 'GLENMARK.NS', 'GODREJCP.NS', 'GODREJPROP.NS', 'GRASIM.NS',
  'GUJGASLTD.NS', 'HCLTECH.NS', 'HDFCAMC.NS', 'HDFCBANK.NS', 'HDFCLIFE.NS', 'HAVELLS.NS', 'HEROMOTOCO.NS', 'HINDALCO.NS',
  'HAL.NS', 'HINDCOPPER.NS', 'HINDPETRO.NS', 'HINDUNILVR.NS', 'ICICIBANK.NS', 'ICICIGI.NS', 'ICICIPRULI.NS', 'IDFCFIRSTB.NS',
  'IPCALAB.NS', 'IRCTC.NS', 'IRFC.NS', 'ITC.NS', 'INDIAMART.NS', 'INDHOTEL.NS', 'IOC.NS', 'IOB.NS',
  'INDUSINDBK.NS', 'NAUKRI.NS', 'INFY.NS', 'INDIGO.NS', 'JISLJALEQS.NS', 'JSL.NS', 'JSWSTEEL.NS', 'JINDALSTEL.NS',
  'JIOFIN.NS', 'JUBLFOOD.NS', 'KEI.NS', 'KPRMILL.NS', 'KALYANKJIL.NS', 'KPITTECH.NS', 'KOTAKBANK.NS', 'LTF.NS',
  'LTIM.NS', 'LT.NS', 'LTS.NS', 'LUPIN.NS', 'MM.NS', 'MAXHEALTH.NS', 'MAZDOCK.NS', 'METROPOLIS.NS', 'MFSL.NS',
  'MGL.NS', 'MOTHERSON.NS', 'MPHASIS.NS', 'MRF.NS', 'MUTHOOTFIN.NS', 'NATCOPHARM.NS', 'NATIONALUM.NS', 'NAVINFLUOR.NS',
  'NESTLEIND.NS', 'NHPC.NS', 'NMDC.NS', 'NTPC.NS', 'OBEROIRLTY.NS', 'ONGC.NS', 'OIL.NS', 'PAYTM.NS', 'OFSS.NS',
  'POLICYBZR.NS', 'PIIND.NS', 'PAGEIND.NS', 'PATANJALI.NS', 'PERSISTENT.NS', 'PETRONET.NS', 'PFC.NS', 'PHOENIXLTD.NS',
  'PIDILITIND.NS', 'PEL.NS', 'POLYCAB.NS', 'POONAWALLA.NS', 'POWERGRID.NS', 'PRESTAGE.NS', 'PNB.NS',
  'RECLTD.NS', 'RELIANCE.NS', 'SBICARD.NS', 'SBILIFE.NS', 'SJVN.NS', 'SRF.NS', 'SHREECEM.NS',
  'SHRIRAMFIN.NS', 'SIEMENS.NS', 'SOLARINDS.NS', 'SONACOMS.NS', 'SBIN.NS', 'SAIL.NS', 'SUNPHARMA.NS', 'SUNTV.NS',
  'SUPREMEIND.NS', 'SUZLON.NS', 'SYNGENE.NS', 'TATACOMM.NS', 'TATACONSUM.NS', 'TATAELXSI.NS', 'TATAMOTORS.NS',
  'TATAPOWER.NS', 'TATASTEEL.NS', 'TCS.NS', 'TECHM.NS', 'FEDERALBNK.NS', 'RAMCOCEM.NS', 'TITAN.NS',
  'TORNTPHARM.NS', 'TORNTPOWER.NS', 'TRENT.NS', 'TIINDIA.NS', 'UPL.NS', 'ULTRACEMCO.NS', 'UNIONBANK.NS', 'UNITDSPR.NS',
  'UBL.NS', 'VBL.NS', 'VEDL.NS', 'VOLTAS.NS', 'WIPRO.NS', 'ZEEL.NS', 'ZYDUSLIFE.NS'
]));

export const AiPovSignalsView: React.FC<AiPovSignalsViewProps> = ({
  timeframe,
  setTimeframe,
  universe,
  setUniverse,
  onSelectSymbolForChart,
  onOpenChartModal,
  initialSubTab,
  onOpenAlertModal,
  alertConfig: propAlertConfig,
  onToggleAlerts,
  onDispatchAlert
}) => {
  const [results, setResults] = useState<StockScanStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [aiTab, setAiTab] = useState<'BOTH' | 'BULLISH' | 'BEARISH'>(initialSubTab || 'BOTH');
  const [aiSortBy, setAiSortBy] = useState<'SCORE' | 'MOVE' | 'TIME' | 'SYMBOL'>('SCORE');
  const [aiSortOrder, setAiSortOrder] = useState<'DESC' | 'ASC'>('DESC');

  // Session-Anchored Signals Registry: Fixed at 09:20 AM for 5m and 09:30 AM for 15m (No Addition, No Deletion)
  const [lockedPicksMap, setLockedPicksMap] = useState<Record<string, LockedSignalRecord>>(() => {
    try {
      const todayKey = `ai_alpha_fixed_signals_${universe}_${timeframe}_${getTodayDateKey()}`;
      const saved = localStorage.getItem(todayKey);
      if (saved) return JSON.parse(saved);
      const legacyKey = `ai_alpha_locked_picks_${universe}_${timeframe}`;
      const legacySaved = localStorage.getItem(legacyKey);
      if (legacySaved) return JSON.parse(legacySaved);
    } catch {}
    return {};
  });

  // Sync locked picks when universe or timeframe changes
  useEffect(() => {
    try {
      const todayKey = `ai_alpha_fixed_signals_${universe}_${timeframe}_${getTodayDateKey()}`;
      const saved = localStorage.getItem(todayKey);
      if (saved) {
        setLockedPicksMap(JSON.parse(saved));
      } else {
        const legacyKey = `ai_alpha_locked_picks_${universe}_${timeframe}`;
        const legacySaved = localStorage.getItem(legacyKey);
        if (legacySaved) {
          setLockedPicksMap(JSON.parse(legacySaved));
        } else {
          setLockedPicksMap({});
        }
      }
    } catch {
      setLockedPicksMap({});
    }
  }, [universe, timeframe]);

  // AI Alpha Score Alert States & Persistence
  const [localAlertConfig, setLocalAlertConfig] = useState<AiAlphaAlertConfig>(() => {
    try {
      const saved = localStorage.getItem('ai_alpha_alert_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      enabled: true,
      minScore: 80,
      direction: 'ALL',
      soundEnabled: true,
      showPopup: true,
      minRvol: 1.0,
      browserNotifications: false,
      autoDismissSec: 0
    };
  });

  const alertConfig = propAlertConfig || localAlertConfig;

  const [alertHistory, setAlertHistory] = useState<AiAlphaAlertEvent[]>(() => {
    try {
      const saved = localStorage.getItem('ai_alpha_alert_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
  const [isAlertHistoryOpen, setIsAlertHistoryOpen] = useState<boolean>(false);
  const [activeAlertPopup, setActiveAlertPopup] = useState<AiAlphaAlertEvent | null>(null);
  
  // Track already alerted signature IDs (e.g. `${symbol}_${score}`) to prevent spamming while allowing new signals
  const alertedSignaturesRef = useRef<Set<string>>(new Set());
  const snoozedSymbolsRef = useRef<Map<string, number>>(new Map());

  // Save config changes
  const handleSaveAlertConfig = (newConfig: AiAlphaAlertConfig) => {
    setLocalAlertConfig(newConfig);
    try {
      localStorage.setItem('ai_alpha_alert_config', JSON.stringify(newConfig));
    } catch {}
  };

  const handleClearAlertHistory = () => {
    setAlertHistory([]);
    try {
      localStorage.removeItem('ai_alpha_alert_history');
    } catch {}
  };

  const handleResetSessionSignals = () => {
    setLockedPicksMap({});
    try {
      const todayKey = `ai_alpha_fixed_signals_${universe}_${timeframe}_${getTodayDateKey()}`;
      localStorage.removeItem(todayKey);
      const legacyKey = `ai_alpha_locked_picks_${universe}_${timeframe}`;
      localStorage.removeItem(legacyKey);
    } catch {}
    fetchScan();
  };

  const handleSnoozeSymbol = (sym: string) => {
    // Snooze for 10 minutes (600,000 ms)
    snoozedSymbolsRef.current.set(sym, Date.now() + 10 * 60 * 1000);
    setActiveAlertPopup(null);
  };

  const handleTriggerTestAlert = () => {
    const testPick = aiAlphaPicks.bullish[0] || aiAlphaPicks.bearish[0] || {
      stock: { symbol: 'RELIANCE.NS', name: 'Reliance Industries', latestPrice: 2980.5, priceChangePct: 1.85 },
      convictionScore: 92,
      tier: 'STRONG' as const,
      projectedMovePct: 2.15,
      signalType: 'BULLISH' as const,
      rawTimestamp: Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reasons: ['Active ADR Breakout', '2.4x Heavy RVOL', 'Bullish CVD (+450k)', 'PDH Cleared'],
      entryPrice: 2980.5,
      targetPrice: 3025.2,
      stopLossPrice: 2950.7,
      riskReward: '1 : 1.85'
    };

    const testEvent: AiAlphaAlertEvent = {
      id: `alert_${Date.now()}_test`,
      timestamp: testPick.timestamp,
      rawTime: Date.now(),
      symbol: testPick.stock.symbol,
      stockName: testPick.stock.name,
      score: testPick.convictionScore,
      tier: testPick.tier,
      signalType: testPick.signalType,
      entryPrice: testPick.entryPrice,
      targetPrice: testPick.targetPrice,
      stopLossPrice: testPick.stopLossPrice,
      projectedMovePct: testPick.projectedMovePct,
      reasons: testPick.reasons,
      rvol: (testPick.stock as any).rvol || 2.4,
      timeframe,
      priceChangePct: testPick.stock.priceChangePct
    };

    if (alertConfig.soundEnabled) {
      if (testEvent.signalType === 'BULLISH') playBullishAlertSound();
      else playBearishAlertSound();
    }

    setActiveAlertPopup(testEvent);
  };

  useEffect(() => {
    if (initialSubTab) {
      setAiTab(initialSubTab);
    }
  }, [initialSubTab]);

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
        symbols = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS'];
      } else {
        symbols = getNseStocksByUniverse(universe);
      }

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols, timeframe, universe }),
      });

      if (!res.ok) throw new Error(`Scanner server error: HTTP ${res.status}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Error loading AI signals');
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
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '--:--';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  // Update & Anchor Session Signals: Strictly fixed at 09:20 AM (5m) and 09:30 AM (15m) with ZERO additions and ZERO deletions
  useEffect(() => {
    if (!results || results.length === 0) return;

    setLockedPicksMap((prevLocked) => {
      // STRICT CORE MANDATE: Once signals for the session exist, NO ADDITIONS and NO DELETIONS are permitted!
      if (prevLocked && Object.keys(prevLocked).length > 0) {
        return prevLocked;
      }

      const nextLocked: Record<string, LockedSignalRecord> = {};
      const openingInfo = getFixedOpeningTimeInfo(timeframe);

      for (const item of results) {
        const symKey = item.symbol;
        const rvol = item.rvol || 1.0;
        const cvd = item.cvd || 0;
        const cvdRatio = item.cvdRatio || 50;
        const sig = item.activeSignal;
        const price = item.latestPrice;
        const openPrice = item.todaysOpen || price;
        if (!price || price <= 0) continue;

        // Bullish Opening Evaluation with Strict Multi-Factor Confluence
        const isBuySignal = item.status === 'BUY_SIGNAL' || (sig && sig.type === 'BUY');
        const isBullishVol = rvol >= 1.15 && (cvd > 0 || cvdRatio >= 52);
        const isBullishBreakout = (item.daysHighBroken && item.daysHighBroken >= 1) || item.pdRangeStatus === 'ABOVE_PDH' || item.reversalType === 'SUPPORT_REVERSAL';
        const isPricePositive = (item.priceChangePct || 0) >= 0.2;

        if (isBuySignal || isBullishBreakout || (isBullishVol && isPricePositive)) {
          let score = 72;
          const reasons: string[] = [];

          if (isBuySignal) {
            score += 15;
            reasons.push('Active ADR Breakout');
          }
          if (rvol >= 2.0) {
            score += 12;
            reasons.push(`${rvol.toFixed(1)}x Heavy Open Vol`);
          } else if (rvol >= 1.2) {
            score += 6;
            reasons.push(`${rvol.toFixed(1)}x Open RVOL`);
          }

          if (cvd > 0 && cvdRatio >= 55) {
            score += 10;
            reasons.push(`Bullish CVD (+${Math.round(cvd / 1000)}k)`);
          } else if (cvd > 0) {
            score += 5;
            reasons.push(`Buy Delta (+${Math.round(cvd / 1000)}k)`);
          }

          if (item.daysHighBroken && item.daysHighBroken >= 1) {
            score += 10;
            reasons.push(`${item.daysHighBroken}-Day High Cleared`);
          } else if (item.pdRangeStatus === 'ABOVE_PDH') {
            score += 6;
            reasons.push('PDH Cleared');
          }

          if (item.reversalType === 'SUPPORT_REVERSAL') {
            score += 8;
            reasons.push('Support Reversal');
          }

          if (reasons.length === 0) {
            reasons.push('Positive Opening Inflow');
          }

          score = Math.min(score, 98);

          const adrPct = item.adr14 ? (item.adr14 / price) * 100 : 2.5;
          const projectedMove = Number((adrPct * (rvol > 1.3 ? 1.2 : 0.9)).toFixed(2));

          const entry = sig ? sig.entryPrice : openPrice;
          const target = sig ? sig.targetPrice : Number((entry * (1 + (projectedMove / 100) * 0.65)).toFixed(2));
          const stop = sig ? sig.stopLossPrice : Number((entry * (1 - (adrPct / 100) * 0.35)).toFixed(2));

          nextLocked[symKey] = {
            symbol: item.symbol,
            stockName: item.name,
            signalType: 'BULLISH',
            timestamp: openingInfo.timeStr,
            rawTimestamp: openingInfo.rawTimestamp,
            convictionScore: score,
            tier: score >= 88 ? 'STRONG' : score >= 78 ? 'HIGH' : 'MODERATE',
            projectedMovePct: Math.max(projectedMove, 1.2),
            entryPrice: entry,
            targetPrice: target,
            stopLossPrice: stop,
            riskReward: '1 : 1.85',
            reasons,
            initialPriceChangePct: item.priceChangePct,
            initialPrice: entry
          };
          continue;
        }

        // Bearish Opening Evaluation with Strict Multi-Factor Confluence
        const isSellSignal = item.status === 'SELL_SIGNAL' || (sig && sig.type === 'SELL');
        const isBearishVol = rvol >= 1.15 && (cvd < 0 || cvdRatio <= 48);
        const isBearishBreakdown = (item.daysLowBroken && item.daysLowBroken >= 1) || item.pdRangeStatus === 'BELOW_PDL' || item.reversalType === 'RESISTANCE_REVERSAL';
        const isPriceNegative = (item.priceChangePct || 0) <= -0.2;

        if (isSellSignal || isBearishBreakdown || (isBearishVol && isPriceNegative)) {
          let score = 72;
          const reasons: string[] = [];

          if (isSellSignal) {
            score += 15;
            reasons.push('Active ADR Breakdown');
          }
          if (rvol >= 2.0) {
            score += 12;
            reasons.push(`${rvol.toFixed(1)}x Heavy Open Vol`);
          } else if (rvol >= 1.2) {
            score += 6;
            reasons.push(`${rvol.toFixed(1)}x Open RVOL`);
          }

          if (cvd < 0 && cvdRatio <= 45) {
            score += 10;
            reasons.push(`Bearish CVD (${Math.round(cvd / 1000)}k)`);
          } else if (cvd < 0) {
            score += 5;
            reasons.push(`Sell Delta (${Math.round(cvd / 1000)}k)`);
          }

          if (item.daysLowBroken && item.daysLowBroken >= 1) {
            score += 10;
            reasons.push(`${item.daysLowBroken}-Day Low Broken`);
          } else if (item.pdRangeStatus === 'BELOW_PDL') {
            score += 6;
            reasons.push('PDL Broken');
          }

          if (item.reversalType === 'RESISTANCE_REVERSAL') {
            score += 8;
            reasons.push('Resistance Reject');
          }

          if (reasons.length === 0) {
            reasons.push('Negative Opening Outflow');
          }

          score = Math.min(score, 98);

          const adrPct = item.adr14 ? (item.adr14 / price) * 100 : 2.5;
          const projectedMove = Number((adrPct * (rvol > 1.3 ? 1.2 : 0.9)).toFixed(2));

          const entry = sig ? sig.entryPrice : openPrice;
          const target = sig ? sig.targetPrice : Number((entry * (1 - (projectedMove / 100) * 0.65)).toFixed(2));
          const stop = sig ? sig.stopLossPrice : Number((entry * (1 + (adrPct / 100) * 0.35)).toFixed(2));

          nextLocked[symKey] = {
            symbol: item.symbol,
            stockName: item.name,
            signalType: 'BEARISH',
            timestamp: openingInfo.timeStr,
            rawTimestamp: openingInfo.rawTimestamp,
            convictionScore: score,
            tier: score >= 90 ? 'STRONG' : score >= 80 ? 'HIGH' : 'MODERATE',
            projectedMovePct: Math.max(projectedMove, 1.5),
            entryPrice: entry,
            targetPrice: target,
            stopLossPrice: stop,
            riskReward: '1 : 1.85',
            reasons,
            initialPriceChangePct: item.priceChangePct,
            initialPrice: entry
          };
        }
      }

      if (Object.keys(nextLocked).length > 0) {
        try {
          const todayKey = `ai_alpha_fixed_signals_${universe}_${timeframe}_${getTodayDateKey()}`;
          localStorage.setItem(todayKey, JSON.stringify(nextLocked));
          const legacyKey = `ai_alpha_locked_picks_${universe}_${timeframe}`;
          localStorage.setItem(legacyKey, JSON.stringify(nextLocked));
        } catch {}
        return nextLocked;
      }

      return prevLocked;
    });
  }, [results, universe, timeframe]);

  // AI POV Alpha Picks: Derived from Session Locked Signals + Live LTP merge
  const aiAlphaPicks = React.useMemo(() => {
    const bullish: AIAlphaPick[] = [];
    const bearish: AIAlphaPick[] = [];

    const resultsMap = new Map<string, StockScanStatus>();
    for (const r of results) {
      resultsMap.set(r.symbol, r);
    }

    // Build picks from anchored session records, merging live prices from latest scan
    (Object.values(lockedPicksMap) as LockedSignalRecord[]).forEach((record) => {
      const liveItem = resultsMap.get(record.symbol);

      const stock: StockScanStatus = liveItem ? {
        ...liveItem,
        latestPrice: liveItem.latestPrice || record.initialPrice,
        priceChangePct: liveItem.priceChangePct !== undefined ? liveItem.priceChangePct : record.initialPriceChangePct
      } : {
        symbol: record.symbol,
        name: record.stockName || record.symbol.replace('.NS', ''),
        lastUpdated: new Date().toISOString(),
        latestPrice: record.initialPrice,
        todaysOpen: record.entryPrice,
        adr14: record.initialPrice * 0.025,
        resistance: record.targetPrice,
        support: record.stopLossPrice,
        priceChangePct: record.initialPriceChangePct || 0,
        rvol: 1.5,
        cvd: record.signalType === 'BULLISH' ? 25000 : -25000,
        cvdRatio: record.signalType === 'BULLISH' ? 60 : 40,
        status: record.signalType === 'BULLISH' ? 'BUY_SIGNAL' : 'SELL_SIGNAL',
        recentSignals: []
      };

      const pick: AIAlphaPick = {
        stock,
        convictionScore: record.convictionScore,
        tier: record.tier,
        projectedMovePct: record.projectedMovePct,
        signalType: record.signalType,
        rawTimestamp: record.rawTimestamp,
        timestamp: record.timestamp,
        reasons: record.reasons,
        entryPrice: record.entryPrice,
        targetPrice: record.targetPrice,
        stopLossPrice: record.stopLossPrice,
        riskReward: record.riskReward
      };

      if (record.signalType === 'BULLISH') {
        bullish.push(pick);
      } else {
        bearish.push(pick);
      }
    });

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
  }, [lockedPicksMap, results, aiSortBy, aiSortOrder]);

  // Automatic Alert Trigger Engine
  useEffect(() => {
    if (!alertConfig.enabled || loading) return;

    // Check timeframe filter setting
    if (alertConfig.timeframe && alertConfig.timeframe !== 'ALL' && alertConfig.timeframe !== timeframe) {
      return;
    }

    const allPicks: AIAlphaPick[] = [];
    if (alertConfig.direction === 'ALL' || alertConfig.direction === 'BULLISH') {
      allPicks.push(...aiAlphaPicks.bullish);
    }
    if (alertConfig.direction === 'ALL' || alertConfig.direction === 'BEARISH') {
      allPicks.push(...aiAlphaPicks.bearish);
    }

    const now = Date.now();

    for (const pick of allPicks) {
      if (pick.convictionScore < alertConfig.minScore) continue;
      const rvol = pick.stock.rvol || 1.0;
      if (rvol < alertConfig.minRvol) continue;

      // Check snooze
      const snoozeUntil = snoozedSymbolsRef.current.get(pick.stock.symbol);
      if (snoozeUntil && snoozeUntil > now) continue;

      // Check if signature already alerted in this session
      const signature = `${pick.stock.symbol}_${pick.convictionScore}_${pick.rawTimestamp}`;
      if (alertedSignaturesRef.current.has(signature)) continue;

      // Mark as alerted
      alertedSignaturesRef.current.add(signature);

      const alertEvent: AiAlphaAlertEvent = {
        id: `alert_${now}_${pick.stock.symbol}`,
        timestamp: pick.timestamp,
        rawTime: pick.rawTimestamp || now,
        symbol: pick.stock.symbol,
        stockName: pick.stock.name,
        score: pick.convictionScore,
        tier: pick.tier,
        signalType: pick.signalType,
        entryPrice: pick.entryPrice,
        targetPrice: pick.targetPrice,
        stopLossPrice: pick.stopLossPrice,
        projectedMovePct: pick.projectedMovePct,
        reasons: pick.reasons,
        rvol: rvol,
        timeframe,
        priceChangePct: pick.stock.priceChangePct
      };

      if (onDispatchAlert) {
        onDispatchAlert(alertEvent);
      } else {
        // Sound notification
        if (alertConfig.soundEnabled) {
          if (pick.signalType === 'BULLISH') playBullishAlertSound();
          else playBearishAlertSound();
        }

        // Browser push notification
        if (alertConfig.browserNotifications && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`🚨 AI Alpha Alert: ${pick.stock.symbol} (${pick.convictionScore}%)`, {
              body: `${pick.signalType} Conviction @ ₹${pick.entryPrice.toFixed(2)} | Target: ₹${pick.targetPrice.toFixed(2)} | RVOL: ${rvol.toFixed(1)}x`,
              icon: '/favicon.ico'
            });
          } catch {}
        }

        // Add to alert history (keep max 50)
        setAlertHistory(prev => {
          const updated = [alertEvent, ...prev].slice(0, 50);
          try {
            localStorage.setItem('ai_alpha_alert_history', JSON.stringify(updated));
          } catch {}
          return updated;
        });

        // Show Popup Modal if configured
        if (alertConfig.showPopup && !activeAlertPopup) {
          setActiveAlertPopup(alertEvent);
        }
      }

      // Only popup one primary highest-score pick per scan cycle to avoid modal collision
      break;
    }
  }, [aiAlphaPicks, alertConfig, loading, timeframe]);

  return (
    <div className="space-y-6">
      {/* Standalone View Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border-2 border-emerald-500/50 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shadow-inner">
            <Sparkles className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-100 tracking-wide uppercase">
                AI POV: High-Conviction Intraday Alpha Signals
              </h2>
              <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                DEDICATED AI TAB
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Algorithmic model analyzing multi-day prior data: <strong className="text-amber-300">RVOL Volume Surges</strong> + <strong className="text-sky-300 font-mono">CVD Order Flow Delta</strong> + <strong className="text-emerald-300">PDH/PDL Range Breaks</strong> for high % intraday moves with exact timestamps.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {setUniverse && (
            <UniverseSelector
              universe={universe}
              setUniverse={setUniverse}
              variant="dropdown"
            />
          )}

          <button
            onClick={() => setIsAlertModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer shrink-0"
          >
            <Bell className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Set Score Alert</span>
          </button>

          <button
            onClick={fetchScan}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl border border-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Signals</span>
          </button>
        </div>
      </div>

      {/* AI ALPHA SCORE ALERT RIBBON & QUICK CONTROLS */}
      <div className={`p-4 rounded-xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl ${
        alertConfig.enabled
          ? 'bg-slate-900/90 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.12)]'
          : 'bg-slate-950 border-slate-800'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl border ${
            alertConfig.enabled
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : 'bg-slate-800 text-slate-500 border-slate-700'
          }`}>
            <Bell className={`w-5 h-5 ${alertConfig.enabled ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-xs uppercase tracking-wider text-slate-100 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                AI Score Alert Monitor:
              </span>
              <span className={`px-2 py-0.5 rounded font-mono font-black text-[11px] border ${
                alertConfig.enabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {alertConfig.enabled ? `ACTIVE (≥ ${alertConfig.minScore}%)` : 'PAUSED'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Filter: <strong className="text-slate-200">{alertConfig.direction === 'ALL' ? 'Both' : alertConfig.direction}</strong>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Plays institutional audio chime and pops up trade card whenever a stock scores <strong className="text-emerald-300 font-mono">≥{alertConfig.minScore}%</strong>.
            </p>
          </div>
        </div>

        {/* Quick Alert Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
          {/* Main Master ON/OFF Toggle Switch Button */}
          <button
            type="button"
            onClick={() => handleSaveAlertConfig({ ...alertConfig, enabled: !alertConfig.enabled })}
            className={`px-3.5 py-1.5 rounded-xl font-mono font-bold text-xs flex items-center gap-2 transition-all cursor-pointer select-none active:scale-95 shadow-md ${
              alertConfig.enabled
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
            }`}
            title={alertConfig.enabled ? 'Click to Turn OFF AI Alerts' : 'Click to Turn ON AI Alerts'}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{alertConfig.enabled ? 'ALERTS ON' : 'ALERTS OFF'}</span>
          </button>

          {/* Quick Score Chips */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-lg">
            {[75, 80, 85, 90, 95].map(score => (
              <button
                key={score}
                onClick={() => handleSaveAlertConfig({ ...alertConfig, minScore: score, enabled: true })}
                className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  alertConfig.enabled && alertConfig.minScore === score
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
                title={`Set Alert threshold to ≥ ${score}%`}
              >
                {score}%
              </button>
            ))}
          </div>

          {/* Sound Mute/Unmute toggle */}
          <button
            onClick={() => handleSaveAlertConfig({ ...alertConfig, soundEnabled: !alertConfig.soundEnabled })}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              alertConfig.soundEnabled
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
            title={alertConfig.soundEnabled ? 'Alert Sound ON (Click to Mute)' : 'Alert Sound Muted (Click to Enable)'}
          >
            {alertConfig.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* History Button */}
          <button
            onClick={() => setIsAlertHistoryOpen(true)}
            className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer relative"
            title="View triggered alerts history"
          >
            <History className="w-3.5 h-3.5 text-sky-400" />
            <span>Alert Log</span>
            {alertHistory.length > 0 && (
              <span className="bg-emerald-500 text-slate-950 text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full">
                {alertHistory.length}
              </span>
            )}
          </button>

          {/* Config Modal Button */}
          <button
            onClick={() => setIsAlertModalOpen(true)}
            className="bg-slate-850 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-emerald-400" />
            <span>Configure</span>
          </button>

          {/* Test Alert Button */}
          <button
            onClick={handleTriggerTestAlert}
            className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            title="Test preview alert popup and audio chime"
          >
            <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>Test</span>
          </button>
        </div>
      </div>


      {/* Control Bar: Filter by Bullish/Bearish, Timeframe, Universe & Sort Options */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-md">
        
        {/* Table Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setAiTab('BOTH')}
              className={`px-3 py-1.5 rounded font-extrabold text-xs transition-colors cursor-pointer ${
                aiTab === 'BOTH'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Both Views ({aiAlphaPicks.bullish.length + aiAlphaPicks.bearish.length})
            </button>
            <button
              onClick={() => setAiTab('BULLISH')}
              className={`px-3 py-1.5 rounded font-extrabold text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                aiTab === 'BULLISH'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              🔥 Bullish Longs ({aiAlphaPicks.bullish.length})
            </button>
            <button
              onClick={() => setAiTab('BEARISH')}
              className={`px-3 py-1.5 rounded font-extrabold text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                aiTab === 'BEARISH'
                  ? 'bg-rose-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              🔻 Bearish Shorts ({aiAlphaPicks.bearish.length})
            </button>
          </div>

          {/* Timeframe Selector Direct Controls */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg text-xs">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 font-bold hidden sm:inline">Timeframe:</span>
            <button
              onClick={() => setTimeframe('5m')}
              className={`px-2 py-0.5 rounded text-xs font-mono font-black transition-all cursor-pointer ${
                timeframe === '5m'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="5-minute fast scalp candle timeframe"
            >
              5m
            </button>
            <button
              onClick={() => setTimeframe('15m')}
              className={`px-2 py-0.5 rounded text-xs font-mono font-black transition-all cursor-pointer ${
                timeframe === '15m'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="15-minute primary ADR breakout candle timeframe"
            >
              15m
            </button>
          </div>

          {/* Market Universe Direct Selector */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setUniverse('NIFTY_200')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                universe === 'NIFTY_200'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Nifty 200
            </button>
            <button
              onClick={() => setUniverse('US_TECH')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                universe === 'US_TECH'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              US Tech
            </button>
            <button
              onClick={() => setUniverse('CUSTOM')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                universe === 'CUSTOM'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Top 5
            </button>
          </div>
        </div>

        {/* Global Sort controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400 font-medium">Sort By:</span>
            <select
              value={aiSortBy}
              onChange={(e) => setAiSortBy(e.target.value as any)}
              className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value="SCORE" className="bg-slate-900 text-slate-200">AI Conviction Score</option>
              <option value="MOVE" className="bg-slate-900 text-slate-200">Est. % Intraday Move</option>
              <option value="TIME" className="bg-slate-900 text-slate-200">Signal Timestamp</option>
              <option value="SYMBOL" className="bg-slate-900 text-slate-200">Symbol Name</option>
            </select>
          </div>

          <button
            onClick={() => setAiSortOrder((prev) => (prev === 'DESC' ? 'ASC' : 'DESC'))}
            className="bg-slate-950 border border-slate-800 text-slate-200 font-extrabold text-xs px-3 py-1.5 rounded-lg hover:border-slate-700 cursor-pointer flex items-center gap-1"
          >
            <span>{aiSortOrder === 'DESC' ? 'High → Low' : 'Low → High'}</span>
            <span className="text-emerald-400">{aiSortOrder === 'DESC' ? '▼' : '▲'}</span>
          </button>
        </div>
      </div>

      {/* Session Signal Lock Status Banner */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100">Fixed Opening Signal Engine:</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {timeframe === '5m' ? 'Fixed @ 09:20 AM' : 'Fixed @ 09:30 AM'}
              </span>
              <span className="text-emerald-400 font-extrabold text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                🔒 Zero Additions • Zero Deletions
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Signals are anchored permanently at <strong className="text-amber-300">{timeframe === '5m' ? '09:20:00 AM (5m open)' : '09:30:00 AM (15m open)'}</strong>. No new stocks will be added or deleted during the day. Live LTP and P&L update in real time.
            </p>
          </div>
        </div>

        {Object.keys(lockedPicksMap).length > 0 && (
          <button
            onClick={handleResetSessionSignals}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm ml-auto"
            title="Reset opening signals for this universe & timeframe"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Opening Signals</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-400" />
          <p className="font-semibold text-slate-200">Analyzing prior stock data and computing AI POV Alpha Signals...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-950/40 border border-rose-500/50 p-4 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      ) : (
        /* TABLES GRID */
        <div className={`grid grid-cols-1 ${aiTab === 'BOTH' ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
          
          {/* BULLISH AI ALPHA TABLE */}
          {(aiTab === 'BOTH' || aiTab === 'BULLISH') && (
            <div className="bg-slate-950/90 border-2 border-emerald-500/40 rounded-xl overflow-hidden shadow-2xl flex flex-col">
              <div className="bg-emerald-950/70 border-b border-emerald-500/40 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-black text-xs sm:text-sm text-emerald-400 uppercase tracking-wider">
                    🔥 AI Bullish Alpha Table (High % Longs)
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded border border-emerald-500/30">
                  {aiAlphaPicks.bullish.length} Active Signals
                </span>
              </div>

              <div className="overflow-auto flex-1 max-h-[62vh] relative">
                {aiAlphaPicks.bullish.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No stocks currently meet AI's strict Bullish Alpha thresholds on {timeframe} timeframe.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 z-20 bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800 shadow-md">
                      <tr>
                        <th 
                          className="py-3 px-3 cursor-pointer select-none hover:text-slate-100 transition-colors"
                          onClick={() => handleAiHeaderClick('TIME')}
                        >
                          Signal Time {renderAiSortArrow('TIME')}
                        </th>
                        <th 
                          className="py-3 px-3 cursor-pointer select-none hover:text-slate-100 transition-colors"
                          onClick={() => handleAiHeaderClick('SYMBOL')}
                        >
                          Symbol {renderAiSortArrow('SYMBOL')}
                        </th>
                        <th className="py-3 px-3">LTP</th>
                        <th 
                          className="py-3 px-3 text-emerald-300 cursor-pointer select-none hover:text-emerald-100 transition-colors"
                          onClick={() => handleAiHeaderClick('SCORE')}
                        >
                          AI Conviction {renderAiSortArrow('SCORE')}
                        </th>
                        <th 
                          className="py-3 px-3 text-amber-300 cursor-pointer select-none hover:text-amber-100 transition-colors"
                          onClick={() => handleAiHeaderClick('MOVE')}
                        >
                          Est. % Move {renderAiSortArrow('MOVE')}
                        </th>
                        <th className="py-3 px-3">AI Confluence Analysis</th>
                        <th className="py-3 px-3 text-emerald-400">Target (+1.5%)</th>
                        <th className="py-3 px-3 text-rose-400">Stop Loss (-1%)</th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono">
                      {aiAlphaPicks.bullish.map((pick, idx) => (
                        <tr key={`${pick.stock.symbol}_${idx}`} className="hover:bg-slate-900/80 transition-colors">
                          <td className="py-3 px-3 text-slate-300 text-[11px] whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="flex items-center gap-1 font-sans font-bold text-slate-100">
                                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                                {pick.timestamp}
                              </span>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300 font-bold mt-0.5 w-fit">
                                Fixed @ {timeframe === '5m' ? '09:20 AM' : '09:30 AM'}
                              </span>
                              <span className="text-[10px] font-sans font-semibold text-emerald-400/90 mt-0.5 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                                Score: <strong className="text-emerald-300 font-extrabold">{pick.convictionScore}%</strong>
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-extrabold text-slate-100">
                            <div>
                              <button
                                onClick={() => onOpenChartModal ? onOpenChartModal(pick.stock.symbol) : onSelectSymbolForChart(pick.stock.symbol)}
                                className="text-emerald-300 hover:text-amber-400 font-sans font-extrabold hover:underline cursor-pointer text-left"
                                title={`Quick popup chart for ${pick.stock.symbol}`}
                              >
                                {pick.stock.symbol}
                              </button>
                              {pick.stock.name && <div className="text-[9px] text-slate-500 font-sans truncate max-w-[100px]">{pick.stock.name}</div>}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-100">
                            ₹{pick.stock.latestPrice.toFixed(2)}
                            {pick.stock.priceChangePct !== undefined && (
                              <span className={`text-[10px] ml-1 font-semibold ${pick.stock.priceChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {pick.stock.priceChangePct >= 0 ? '+' : ''}{pick.stock.priceChangePct.toFixed(2)}%
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex flex-col items-start gap-0.5">
                              <span className={`px-2 py-0.5 rounded font-black text-[10px] tracking-wide inline-flex items-center gap-1 border ${
                                pick.convictionScore >= 90
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}>
                                <Sparkles className="w-2.5 h-2.5" />
                                {pick.convictionScore}% {pick.tier}
                              </span>
                              <span className="text-[9px] font-sans text-slate-400">
                                Captured at {pick.timestamp}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-extrabold text-emerald-400 whitespace-nowrap">
                            +{pick.projectedMovePct.toFixed(2)}%
                          </td>
                          <td className="py-3 px-3">
                            <div className="space-y-1.5 max-w-[220px]">
                              <SentimentGauge
                                reasons={pick.reasons}
                                stock={pick.stock}
                                signalType="BULLISH"
                              />
                              <div className="flex flex-wrap gap-1">
                                {pick.reasons.map((r, idx) => (
                                  <span key={idx} className="bg-slate-900 border border-slate-700 text-slate-300 text-[9px] font-sans px-1.5 py-0.5 rounded whitespace-nowrap">
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-emerald-400 font-bold">
                            ₹{pick.targetPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-rose-400 font-semibold">
                            ₹{pick.stopLossPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openTradingViewChart(pick.stock.symbol, timeframe)}
                                className="bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 px-2 py-1 rounded text-[10px] font-bold font-mono cursor-pointer transition-colors flex items-center gap-1 active:scale-95"
                                title={`Open ${pick.stock.symbol} chart on TradingView`}
                              >
                                <ExternalLink className="w-2.5 h-2.5 text-blue-400" />
                                <span>TV ↗</span>
                              </button>
                              <button
                                onClick={() => onSelectSymbolForChart(pick.stock.symbol)}
                                className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded text-[11px] font-extrabold cursor-pointer transition-colors"
                                title="View Chart"
                              >
                                Chart
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* BEARISH AI ALPHA TABLE */}
          {(aiTab === 'BOTH' || aiTab === 'BEARISH') && (
            <div className="bg-slate-950/90 border-2 border-rose-500/40 rounded-xl overflow-hidden shadow-2xl flex flex-col">
              <div className="bg-rose-950/70 border-b border-rose-500/40 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  <h3 className="font-black text-xs sm:text-sm text-rose-400 uppercase tracking-wider">
                    🔻 AI Bearish Alpha Table (High % Shorts)
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-rose-300 bg-rose-500/20 px-2.5 py-0.5 rounded border border-rose-500/30">
                  {aiAlphaPicks.bearish.length} Active Signals
                </span>
              </div>

              <div className="overflow-auto flex-1 max-h-[62vh] relative">
                {aiAlphaPicks.bearish.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No stocks currently meet AI's strict Bearish Alpha thresholds on {timeframe} timeframe.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 z-20 bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800 shadow-md">
                      <tr>
                        <th 
                          className="py-3 px-3 cursor-pointer select-none hover:text-slate-100 transition-colors"
                          onClick={() => handleAiHeaderClick('TIME')}
                        >
                          Signal Time {renderAiSortArrow('TIME')}
                        </th>
                        <th 
                          className="py-3 px-3 cursor-pointer select-none hover:text-slate-100 transition-colors"
                          onClick={() => handleAiHeaderClick('SYMBOL')}
                        >
                          Symbol {renderAiSortArrow('SYMBOL')}
                        </th>
                        <th className="py-3 px-3">LTP</th>
                        <th 
                          className="py-3 px-3 text-rose-300 cursor-pointer select-none hover:text-rose-100 transition-colors"
                          onClick={() => handleAiHeaderClick('SCORE')}
                        >
                          AI Conviction {renderAiSortArrow('SCORE')}
                        </th>
                        <th 
                          className="py-3 px-3 text-rose-300 cursor-pointer select-none hover:text-amber-100 transition-colors"
                          onClick={() => handleAiHeaderClick('MOVE')}
                        >
                          Est. % Move {renderAiSortArrow('MOVE')}
                        </th>
                        <th className="py-3 px-3">AI Confluence Analysis</th>
                        <th className="py-3 px-3 text-emerald-400">Target (-1.5%)</th>
                        <th className="py-3 px-3 text-rose-400">Stop Loss (+1%)</th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono">
                      {aiAlphaPicks.bearish.map((pick, idx) => (
                        <tr key={`${pick.stock.symbol}_${idx}`} className="hover:bg-slate-900/80 transition-colors">
                          <td className="py-3 px-3 text-slate-300 text-[11px] whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="flex items-center gap-1 font-sans font-bold text-slate-100">
                                <Clock className="w-3.5 h-3.5 text-rose-400" />
                                {pick.timestamp}
                              </span>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300 font-bold mt-0.5 w-fit">
                                Fixed @ {timeframe === '5m' ? '09:20 AM' : '09:30 AM'}
                              </span>
                              <span className="text-[10px] font-sans font-semibold text-rose-400/90 mt-0.5 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                                Score: <strong className="text-rose-300 font-extrabold">{pick.convictionScore}%</strong>
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-extrabold text-slate-100">
                            <div>
                              <button
                                onClick={() => onOpenChartModal ? onOpenChartModal(pick.stock.symbol) : onSelectSymbolForChart(pick.stock.symbol)}
                                className="text-rose-300 hover:text-amber-400 font-sans font-extrabold hover:underline cursor-pointer text-left"
                                title={`Quick popup chart for ${pick.stock.symbol}`}
                              >
                                {pick.stock.symbol}
                              </button>
                              {pick.stock.name && <div className="text-[9px] text-slate-500 font-sans truncate max-w-[100px]">{pick.stock.name}</div>}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-100">
                            ₹{pick.stock.latestPrice.toFixed(2)}
                            {pick.stock.priceChangePct !== undefined && (
                              <span className={`text-[10px] ml-1 font-semibold ${pick.stock.priceChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {pick.stock.priceChangePct >= 0 ? '+' : ''}{pick.stock.priceChangePct.toFixed(2)}%
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex flex-col items-start gap-0.5">
                              <span className={`px-2 py-0.5 rounded font-black text-[10px] tracking-wide inline-flex items-center gap-1 border ${
                                pick.convictionScore >= 90
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}>
                                <Sparkles className="w-2.5 h-2.5" />
                                {pick.convictionScore}% {pick.tier}
                              </span>
                              <span className="text-[9px] font-sans text-slate-400">
                                Captured at {pick.timestamp}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-extrabold text-rose-400 whitespace-nowrap">
                            -{pick.projectedMovePct.toFixed(2)}%
                          </td>
                          <td className="py-3 px-3">
                            <div className="space-y-1.5 max-w-[220px]">
                              <SentimentGauge
                                reasons={pick.reasons}
                                stock={pick.stock}
                                signalType="BEARISH"
                              />
                              <div className="flex flex-wrap gap-1">
                                {pick.reasons.map((r, idx) => (
                                  <span key={idx} className="bg-slate-900 border border-slate-700 text-slate-300 text-[9px] font-sans px-1.5 py-0.5 rounded whitespace-nowrap">
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-emerald-400 font-bold">
                            ₹{pick.targetPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-rose-400 font-semibold">
                            ₹{pick.stopLossPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openTradingViewChart(pick.stock.symbol, timeframe)}
                                className="bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 px-2 py-1 rounded text-[10px] font-bold font-mono cursor-pointer transition-colors flex items-center gap-1 active:scale-95"
                                title={`Open ${pick.stock.symbol} chart on TradingView`}
                              >
                                <ExternalLink className="w-2.5 h-2.5 text-blue-400" />
                                <span>TV ↗</span>
                              </button>
                              <button
                                onClick={() => onSelectSymbolForChart(pick.stock.symbol)}
                                className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded text-[11px] font-extrabold cursor-pointer transition-colors"
                                title="View Chart"
                              >
                                Chart
                              </button>
                            </div>
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

      {/* AI ALPHA SCORE ALERT CONFIGURATION MODAL */}
      <AiAlphaAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        config={alertConfig}
        onSaveConfig={handleSaveAlertConfig}
        onTriggerTestAlert={handleTriggerTestAlert}
      />

      {/* LIVE AI ALPHA ALERT TRIGGER POPUP (when used standalone) */}
      {!onDispatchAlert && (
        <AiAlphaAlertTriggerPopup
          alertEvent={activeAlertPopup}
          onClose={() => setActiveAlertPopup(null)}
          onOpenChart={(sym) => {
            if (onOpenChartModal) onOpenChartModal(sym);
            else onSelectSymbolForChart(sym);
          }}
          onSnooze={handleSnoozeSymbol}
        />
      )}

      {/* AI ALPHA ALERT HISTORY MODAL */}
      <AiAlphaAlertHistoryModal
        isOpen={isAlertHistoryOpen}
        onClose={() => setIsAlertHistoryOpen(false)}
        history={alertHistory}
        onClearHistory={handleClearAlertHistory}
        onSelectSymbolForChart={(sym) => {
          if (onOpenChartModal) onOpenChartModal(sym);
          else onSelectSymbolForChart(sym);
        }}
      />
    </div>
  );
};

