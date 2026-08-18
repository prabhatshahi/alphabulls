export interface Candle {
  datetime: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DailyLevel {
  date: string;
  open: number;
  adr14: number;
  avgHigh: number;
  avgLow: number;
  resistance: number;
  support: number;
}

export interface Signal {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  timestamp: string;
  candleCloseTime: string;
  entryPrice: number;
  targetPrice: number;
  stopLossPrice: number;
  resistance: number;
  support: number;
  adr14: number;
  prevClose: number;
  candleClose: number;
  timeframe: '5m' | '15m';
  pdh?: number;
  pdl?: number;
  daysHighBroken?: number;
  daysLowBroken?: number;
  pdRangeText?: string;
  isInsidePdRangeAtBreakout?: boolean;
  breakoutContextAtSignal?: string;
  breakoutShortTag?: string;
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  entryTimestamp: string;
  exitTimestamp: string;
  entryPrice: number;
  exitPrice: number;
  targetPrice: number;
  stopLossPrice: number;
  result: 'WIN' | 'LOSS';
  returnPct: number; // +1.0 or -1.0
  holdingCandles: number;
  timeframe: '5m' | '15m';
}

export interface StockBacktestResult {
  symbol: string;
  totalTrades: number;
  buyTrades: number;
  sellTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRatePct: number;
  totalPlPct: number;
  avgTradePct: number;
  profitFactor: number;
  maxDrawdownPct: number;
  trades: Trade[];
}

export interface BacktestSummary {
  totalTrades: number;
  buyTrades: number;
  sellTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRatePct: number;
  totalPlPct: number;
  avgTradePct: number;
  profitFactor: number;
  maxDrawdownPct: number;
  stockBreakdown: Array<{
    symbol: string;
    totalTrades: number;
    winRatePct: number;
    totalPlPct: number;
    profitFactor: number;
  }>;
  monthlyBreakdown: Array<{
    month: string;
    trades: number;
    winRatePct: number;
    totalPlPct: number;
  }>;
  buyVsSellBreakdown: {
    buy: { trades: number; winRatePct: number; totalPlPct: number };
    sell: { trades: number; winRatePct: number; totalPlPct: number };
  };
  trades: Trade[];
}

export interface VolumeAlert {
  type: 'RVOL_SPIKE' | 'CVD_BUY_SURGE' | 'CVD_SELL_SURGE' | 'DUAL_VOL_SURGE';
  severity: 'EXTREME' | 'HIGH' | 'MODERATE';
  title: string;
  description: string;
  timestamp: string;
  rvol: number;
  cvd: number;
  cvdRatio: number;
  latestCandleVol?: number;
  avgCandleVol?: number;
}

export interface MultiDayBreakoutInfo {
  pdh: number;
  pdl: number;
  pdc: number;
  daysHighBroken: number;
  daysLowBroken: number;
  maxDaysHighTouched: number;
  maxDaysLowTouched: number;
  pdRangeStatus: 'ABOVE_PDH' | 'BELOW_PDL' | 'INSIDE_PD_RANGE';
  pdRangeText: string;
}

export interface StockScanStatus {
  symbol: string;
  name?: string;
  lastUpdated: string;
  latestPrice: number;
  todaysOpen: number;
  adr14: number;
  resistance: number;
  support: number;
  status: 'BUY_SIGNAL' | 'SELL_SIGNAL' | 'NEUTRAL';
  activeSignal?: Signal;
  recentSignals: Signal[];
  volume?: number;
  todayVolume?: number;
  avgVolume10d?: number;
  rvol?: number;
  cvd?: number;
  cvdRatio?: number;
  priceChangePct?: number;
  distToResistancePct?: number;
  distToSupportPct?: number;
  reversalType?: 'RESISTANCE_REVERSAL' | 'SUPPORT_REVERSAL' | 'NONE';
  todaysHigh?: number;
  todaysLow?: number;
  reversalReason?: string;
  reversalRetestPrice?: number;
  reversalPctFromLevel?: number;
  volumeAlert?: VolumeAlert;
  pdh?: number;
  pdl?: number;
  pdc?: number;
  daysHighBroken?: number;
  daysLowBroken?: number;
  maxDaysHighTouched?: number;
  maxDaysLowTouched?: number;
  pdRangeStatus?: 'ABOVE_PDH' | 'BELOW_PDL' | 'INSIDE_PD_RANGE';
  pdRangeText?: string;
  isInsidePdRangeAtBreakout?: boolean;
  breakoutContextAtSignal?: string;
  breakoutShortTag?: string;
  multiDayInfo?: MultiDayBreakoutInfo;
  // Multi-Indicator Confluence fields
  vwap?: number;
  vwapDistPct?: number;
  ema20?: number;
  ema50?: number;
  rsi?: number;
  macdLine?: number;
  macdSignal?: number;
  macdHist?: number;
  cprPivot?: number;
  cprTop?: number;
  cprBottom?: number;
  cprR1?: number;
  cprS1?: number;
  cprR2?: number;
  cprS2?: number;
  cprStatus?: 'ABOVE_CPR' | 'BELOW_CPR' | 'INSIDE_CPR' | 'ABOVE_R1' | 'BELOW_S1';
  superTrend?: 'BULLISH' | 'BEARISH';
  volType?: 'LIGHT_GREEN' | 'MAROON' | 'GREEN' | 'RED';
}

export interface AiAlphaAlertConfig {
  enabled: boolean;
  minScore: number;
  minConfluenceScore?: number;
  direction: 'ALL' | 'BULLISH' | 'BEARISH';
  timeframe?: '5m' | '15m' | 'ALL';
  soundEnabled: boolean;
  showPopup: boolean;
  minRvol: number;
  browserNotifications: boolean;
  autoDismissSec: number;
  position: 'RIGHT_TOAST' | 'RIGHT_DRAWER' | 'TOP_RIGHT_COMPACT' | 'CENTER_MODAL';
}

export interface AiAlphaAlertEvent {
  id: string;
  timestamp: string;
  rawTime: number;
  symbol: string;
  stockName?: string;
  score: number;
  tier: string;
  signalType: 'BULLISH' | 'BEARISH';
  entryPrice: number;
  targetPrice: number;
  stopLossPrice: number;
  projectedMovePct: number;
  reasons: string[];
  rvol: number;
  timeframe: string;
  priceChangePct?: number;
}

export interface CorrelationMetrics {
  indexCorrelation: number; // e.g. +0.88 (-1.0 to +1.0)
  indexBeta: number; // e.g. 1.25x
  sectorCorrelation: number; // e.g. +0.94
  volumePriceCorrelation: number; // e.g. +0.82
  multiTimeframeSync: '3/3 ALIGNED' | '2/3 PARTIAL' | '1/3 DIVERGENT';
  correlationRating: 'HIGH CORRELATION' | 'DECOUPLED LEADER' | 'INVERSE HEDGE' | 'NEUTRAL';
  peerCorrelationScore: number;
}

export interface HistoricalAdditionItem {
  id: string;
  symbol: string;
  stockName: string;
  addedTimestamp: string;
  addedDate: string;
  rawTimestamp: number;
  addedPrice: number;
  currentPrice: number;
  priceDiffPct: number;
  bias: 'BULLISH' | 'BEARISH';
  grade: 'A+++' | 'A+' | 'B+' | 'C';
  score: number;
  timeframe: '5m' | '15m';
  sector: string;
  target1: number;
  target2: number;
  stopLoss: number;
  outcomeStatus: 'TARGET_1_HIT' | 'TARGET_2_HIT' | 'STOPPED_OUT' | 'ACTIVE_PROFIT' | 'ACTIVE_LOSS';
  maxGainPct: number;
  maxLossPct: number;
  correlation: CorrelationMetrics;
  pillarsCount: number;
}

export interface AiConfluenceAuditResult {
  symbol: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confluenceGrade: 'A+++ (PERFECT SETUP)' | 'A+ (ULTRA ALPHA)' | 'B+ (STRONG CONFLUENCE)' | 'C (MIXED)';
  aiConfidenceScore: number;
  executiveSummary: string;
  institutionalFootprint: string;
  patternThesis: string;
  correlationInsights?: {
    indexBetaAnalysis: string;
    sectorBasketSync: string;
    peerDecouplingStatus: string;
  };
  executionBlueprint: {
    entryTrigger: string;
    stopLoss: string;
    target1: string;
    target2: string;
    riskRewardRatio: string;
    tradeInvalidationRule: string;
  };
  tradeChecklist: string[];
  riskWarnings: string[];
  sectorContext: string;
  isAiGenerated: boolean;
}

export interface PerfectConfluenceItem {
  stock: StockScanStatus;
  bullishScore: number;
  bearishScore: number;
  overallScore: number;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  grade: 'A+++' | 'A+' | 'B+' | 'C';
  isPerfect: boolean;
  pillars: {
    id: string;
    icon: string;
    label: string;
    status: 'ACTIVE' | 'INACTIVE';
    type: 'BULL' | 'BEAR' | 'NEUTRAL';
    detail: string;
  }[];
  activePillarsCount: number;
  totalPillarsCount: number;
  entryPrice: number;
  targetPrice1: number;
  targetPrice2: number;
  stopLossPrice: number;
  riskReward: string;
  signalTime: string;
  signalDate: string;
  signalTimeframe: '5m' | '15m';
  rawTimestamp: string;
  addedTimestampMs: number;
  elapsedMinutesText: string;
  sectorName: string;
  sectorChangePct: number;
  isSectorAligned: boolean;
  vwapDistPct: number;
  rvol: number;
  cvd: number;
  rsi: number;
  cprStatus: string;
  correlation: CorrelationMetrics;
}

export type MarketStructureType = 'HH_HL' | 'LH_LL' | 'MIXED';
export type EmaAlignmentType = 'BULLISH_8_21' | 'BEARISH_8_21' | 'MIXED';
export type EmaSlopeType = 'RISING' | 'FALLING' | 'FLAT';
export type VolumeStatusType = 'HIGH' | 'NORMAL';
export type BreakoutType = 'BREAKOUT' | 'BREAKDOWN' | 'NONE';
export type TrendStageType = 'NEW' | 'RUNNING' | 'WEAKENING' | 'CHOPPY';
export type TrendClassificationType = 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL_CHOPPY' | 'BEARISH' | 'STRONG_BEARISH';
export type TrendDirectionType = 'UP' | 'DOWN' | 'CHOPPY';

export interface TrendingStockItem {
  symbol: string;
  name: string;
  price: number;
  todaysOpen: number;
  priceChangePct: number;
  rvol: number;
  direction: TrendDirectionType;
  classification: TrendClassificationType;
  bullishScore: number;
  bearishScore: number;
  trendScore: number; // 0 - 7
  scoreDisplay: string; // e.g. "6/7"
  structure: MarketStructureType;
  structureDisplay: string; // 'HH + HL' | 'LH + LL' | 'MIXED'
  ema8: number;
  ema21: number;
  emaAlignment: EmaAlignmentType;
  emaAlignmentDisplay: string; // '8 > 21' | '8 < 21' | 'MIXED'
  emaSlope: EmaSlopeType;
  emaSlopeDisplay: string; // '↑ Rising' | '↓ Falling' | '→ Flat'
  volumeStatus: VolumeStatusType;
  volumeDisplay: string; // '🔥 High' | 'Normal'
  breakout: BreakoutType;
  breakoutDisplay: string; // '🚀 Breakout' | 'Breakdown' | '—'
  stage: TrendStageType;
  stageDisplay: string; // '🆕 NEW' | '🔥 RUNNING' | '⚠️ WEAKENING' | '⚪ CHOPPY'
  sortRank: number; // 1: New Strong, 2: Strong, 3: Running, 4: Weakening, 5: Choppy
  lastUpdated: string;
  lastCandleTimestamp?: number;
  isLoadingData?: boolean;
}

export type FetchUniverseType = 'FNO' | 'ALL';

export type UniverseType = 
  | 'ALL_NSE' 
  | 'NIFTY_500' 
  | 'NIFTY_200' 
  | 'NIFTY_100' 
  | 'NIFTY_50' 
  | 'NIFTY_FNO' 
  | 'NIFTY_MIDCAP' 
  | 'NIFTY_SMALLCAP' 
  | 'US_TECH' 
  | 'CUSTOM';

export interface NseStockItem {
  symbol: string;
  cleanSymbol: string;
  name: string;
  sector: string;
  capTier: 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP' | 'MICRO_CAP';
  isFno: boolean;
  series: string;
  isin?: string;
  latestPrice?: number;
  todaysOpen?: number;
  priceChangePct?: number;
  rvol?: number;
  adr14?: number;
  resistance?: number;
  support?: number;
  status?: 'BUY_SIGNAL' | 'SELL_SIGNAL' | 'NEUTRAL';
}


