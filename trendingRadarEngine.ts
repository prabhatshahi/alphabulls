import { Candle, TrendingStockItem, MarketStructureType, EmaAlignmentType, EmaSlopeType, VolumeStatusType, BreakoutType, TrendStageType, TrendClassificationType, TrendDirectionType } from '../types';

/**
 * Calculates exponential moving average array for a given series of numbers.
 */
export function calculateEMAArray(series: number[], period: number): number[] {
  if (!series || series.length === 0) return [];
  if (period <= 0) return [...series];

  const emaValues: number[] = new Array(series.length).fill(0);
  if (series.length < period) {
    let running = 0;
    for (let i = 0; i < series.length; i++) {
      running += series[i];
      emaValues[i] = Number((running / (i + 1)).toFixed(2));
    }
    return emaValues;
  }

  // Initial SMA for first period elements
  const initialSma = series.slice(0, period).reduce((sum, v) => sum + (v || 0), 0) / period;
  for (let i = 0; i < period - 1; i++) {
    emaValues[i] = series[i];
  }
  emaValues[period - 1] = Number(initialSma.toFixed(2));

  const multiplier = 2 / (period + 1);
  for (let i = period; i < series.length; i++) {
    const prevEma = emaValues[i - 1];
    const currPrice = series[i] || 0;
    const currentEma = (currPrice - prevEma) * multiplier + prevEma;
    emaValues[i] = Number(currentEma.toFixed(2));
  }

  return emaValues;
}

export interface SwingPoint {
  index: number;
  type: 'HIGH' | 'LOW';
  price: number;
  datetime: string;
}

/**
 * Detects swing high and swing low pivots on closed/confirmed candles.
 * Standard fractal / pivot detection using left & right confirmation bars.
 */
export function detectSwingPivots(candles: Candle[], leftBars = 2, rightBars = 2): { swingHighs: SwingPoint[]; swingLows: SwingPoint[] } {
  const swingHighs: SwingPoint[] = [];
  const swingLows: SwingPoint[] = [];

  if (!candles || candles.length < (leftBars + rightBars + 1)) {
    return { swingHighs, swingLows };
  }

  for (let i = leftBars; i < candles.length - rightBars; i++) {
    const current = candles[i];
    if (!current || isNaN(current.high) || isNaN(current.low)) continue;

    let isHigh = true;
    let isLow = true;

    // Check left bars
    for (let l = 1; l <= leftBars; l++) {
      if (candles[i - l].high >= current.high) isHigh = false;
      if (candles[i - l].low <= current.low) isLow = false;
    }

    // Check right bars
    for (let r = 1; r <= rightBars; r++) {
      if (candles[i + r].high > current.high) isHigh = false;
      if (candles[i + r].low < current.low) isLow = false;
    }

    if (isHigh) {
      swingHighs.push({
        index: i,
        type: 'HIGH',
        price: current.high,
        datetime: current.datetime
      });
    }

    if (isLow) {
      swingLows.push({
        index: i,
        type: 'LOW',
        price: current.low,
        datetime: current.datetime
      });
    }
  }

  return { swingHighs, swingLows };
}

/**
 * Evaluates Market Structure (HH+HL, LH+LL, or MIXED) from confirmed swing points.
 */
export function evaluateMarketStructure(swingHighs: SwingPoint[], swingLows: SwingPoint[]): {
  structure: MarketStructureType;
  structureDisplay: string;
  hasHH: boolean;
  hasHL: boolean;
  hasLH: boolean;
  hasLL: boolean;
  lastSwingHighPrice: number | null;
  lastSwingLowPrice: number | null;
} {
  const lastSwingHigh = swingHighs.length > 0 ? swingHighs[swingHighs.length - 1] : null;
  const prevSwingHigh = swingHighs.length > 1 ? swingHighs[swingHighs.length - 2] : null;

  const lastSwingLow = swingLows.length > 0 ? swingLows[swingLows.length - 1] : null;
  const prevSwingLow = swingLows.length > 1 ? swingLows[swingLows.length - 2] : null;

  let hasHH = false;
  let hasLH = false;
  let hasHL = false;
  let hasLL = false;

  if (lastSwingHigh && prevSwingHigh) {
    if (lastSwingHigh.price > prevSwingHigh.price) {
      hasHH = true;
    } else if (lastSwingHigh.price < prevSwingHigh.price) {
      hasLH = true;
    }
  }

  if (lastSwingLow && prevSwingLow) {
    if (lastSwingLow.price > prevSwingLow.price) {
      hasHL = true;
    } else if (lastSwingLow.price < prevSwingLow.price) {
      hasLL = true;
    }
  }

  let structure: MarketStructureType = 'MIXED';
  let structureDisplay = 'MIXED';

  if (hasHH && hasHL) {
    structure = 'HH_HL';
    structureDisplay = 'HH + HL';
  } else if (hasLH && hasLL) {
    structure = 'LH_LL';
    structureDisplay = 'LH + LL';
  } else {
    structure = 'MIXED';
    structureDisplay = 'MIXED';
  }

  return {
    structure,
    structureDisplay,
    hasHH,
    hasHL,
    hasLH,
    hasLL,
    lastSwingHighPrice: lastSwingHigh ? lastSwingHigh.price : null,
    lastSwingLowPrice: lastSwingLow ? lastSwingLow.price : null,
  };
}

/**
 * Main 5-Minute Trending Radar calculation engine for a stock.
 */
export function analyze5mTrendingRadar(
  symbol: string,
  stockName: string,
  intraday5mCandles: Candle[],
  fallbackPrice = 0,
  fallbackOpen = 0,
  fallbackRvol = 1.0
): TrendingStockItem {
  const safeSymbol = symbol || 'UNKNOWN';
  const safeName = stockName || safeSymbol.replace('.NS', '').replace('.BO', '');

  // Guard against insufficient data
  if (!intraday5mCandles || intraday5mCandles.length < 5) {
    return {
      symbol: safeSymbol,
      name: safeName,
      price: fallbackPrice || 0,
      todaysOpen: fallbackOpen || fallbackPrice || 0,
      priceChangePct: fallbackOpen > 0 ? Number((((fallbackPrice - fallbackOpen) / fallbackOpen) * 100).toFixed(2)) : 0,
      rvol: fallbackRvol || 1.0,
      direction: 'CHOPPY',
      classification: 'NEUTRAL_CHOPPY',
      bullishScore: 0,
      bearishScore: 0,
      trendScore: 0,
      scoreDisplay: '0/7',
      structure: 'MIXED',
      structureDisplay: 'MIXED',
      ema8: fallbackPrice || 0,
      ema21: fallbackPrice || 0,
      emaAlignment: 'MIXED',
      emaAlignmentDisplay: 'MIXED',
      emaSlope: 'FLAT',
      emaSlopeDisplay: '→ Flat',
      volumeStatus: 'NORMAL',
      volumeDisplay: 'Normal',
      breakout: 'NONE',
      breakoutDisplay: '—',
      stage: 'CHOPPY',
      stageDisplay: '⚪ CHOPPY',
      sortRank: 5,
      lastUpdated: new Date().toLocaleTimeString(),
      isLoadingData: true
    };
  }

  // Use closed confirmed candles for swing detection and EMA (all completed candles)
  const candles = intraday5mCandles;
  const numCandles = candles.length;
  const latestCandle = candles[numCandles - 1];
  const prevCandle = numCandles > 1 ? candles[numCandles - 2] : latestCandle;

  const currentPrice = Number((latestCandle?.close ?? fallbackPrice ?? 0).toFixed(2));
  const todaysOpen = Number((candles[0]?.open ?? fallbackOpen ?? currentPrice).toFixed(2));
  const priceChangePct = todaysOpen > 0
    ? Number((((currentPrice - todaysOpen) / todaysOpen) * 100).toFixed(2))
    : 0;

  // 1. EMA 8 and EMA 21 calculation
  const closeSeries = candles.map(c => c.close || 0);
  const ema8Series = calculateEMAArray(closeSeries, 8);
  const ema21Series = calculateEMAArray(closeSeries, 21);

  const currentEma8 = ema8Series[ema8Series.length - 1] || currentPrice;
  const prevEma8 = ema8Series.length > 1 ? ema8Series[ema8Series.length - 2] : currentEma8;

  const currentEma21 = ema21Series[ema21Series.length - 1] || currentPrice;
  const prevEma21 = ema21Series.length > 1 ? ema21Series[ema21Series.length - 2] : currentEma21;

  // EMA Alignment:
  // Bullish: Price > EMA 8 > EMA 21
  // Bearish: Price < EMA 8 < EMA 21
  let emaAlignment: EmaAlignmentType = 'MIXED';
  let emaAlignmentDisplay = 'MIXED';

  if (currentPrice > currentEma8 && currentEma8 > currentEma21) {
    emaAlignment = 'BULLISH_8_21';
    emaAlignmentDisplay = '8 > 21';
  } else if (currentPrice < currentEma8 && currentEma8 < currentEma21) {
    emaAlignment = 'BEARISH_8_21';
    emaAlignmentDisplay = '8 < 21';
  } else {
    emaAlignment = 'MIXED';
    emaAlignmentDisplay = 'MIXED';
  }

  // EMA Slope:
  // Bullish slope: EMA 8 current > EMA 8 prev AND EMA 21 current > EMA 21 prev
  // Bearish slope: EMA 8 current < EMA 8 prev AND EMA 21 current < EMA 21 prev
  let emaSlope: EmaSlopeType = 'FLAT';
  let emaSlopeDisplay = '→ Flat';

  if (currentEma8 > prevEma8 && currentEma21 > prevEma21) {
    emaSlope = 'RISING';
    emaSlopeDisplay = '↑ Rising';
  } else if (currentEma8 < prevEma8 && currentEma21 < prevEma21) {
    emaSlope = 'FALLING';
    emaSlopeDisplay = '↓ Falling';
  } else {
    emaSlope = 'FLAT';
    emaSlopeDisplay = '→ Flat';
  }

  // 2. Market Structure (HH+HL, LH+LL, or MIXED)
  const { swingHighs, swingLows } = detectSwingPivots(candles, 2, 2);
  const {
    structure,
    structureDisplay,
    lastSwingHighPrice,
    lastSwingLowPrice
  } = evaluateMarketStructure(swingHighs, swingLows);

  // 3. Volume Confirmation:
  // 5m volume vs average volume of last 20 bars
  const volumeWindow = Math.min(20, candles.length);
  const recentCandles = candles.slice(-volumeWindow);
  const avgVolume = recentCandles.reduce((sum, c) => sum + (c.volume || 0), 0) / volumeWindow;
  const currentVolume = latestCandle.volume || 0;
  const isHighVolume = avgVolume > 0 && currentVolume > avgVolume;
  const volumeStatus: VolumeStatusType = isHighVolume ? 'HIGH' : 'NORMAL';
  const volumeDisplay = isHighVolume ? '🔥 High' : 'Normal';

  // Relative Volume (RVOL) estimation
  const rvol = avgVolume > 0 ? Number((currentVolume / avgVolume).toFixed(2)) : (fallbackRvol || 1.0);

  // 4. Breakout / Breakdown Detection on confirmed 5-minute candles
  let breakout: BreakoutType = 'NONE';
  let breakoutDisplay = '—';

  if (lastSwingHighPrice !== null && currentPrice > lastSwingHighPrice) {
    // Check if the breakout happened recently (within last 3 candles)
    const recentBars = candles.slice(-3);
    const brokeOutRecently = recentBars.some(b => b.close > lastSwingHighPrice);
    if (brokeOutRecently) {
      breakout = 'BREAKOUT';
      breakoutDisplay = '🚀 Breakout';
    }
  } else if (lastSwingLowPrice !== null && currentPrice < lastSwingLowPrice) {
    const recentBars = candles.slice(-3);
    const brokeDownRecently = recentBars.some(b => b.close < lastSwingLowPrice);
    if (brokeDownRecently) {
      breakout = 'BREAKDOWN';
      breakoutDisplay = 'Breakdown';
    }
  }

  // 5. Trend Stage Determination:
  // NEW TREND: EMA 8 crossed above/below EMA 21 within recent 1-6 bars, plus breakout / structure alignment
  // RUNNING: Established trend (HH+HL / LH+LL + 8/21 aligned for several bars)
  // WEAKENING: Price drops below EMA 8 while above EMA 21 (or price crosses above EMA 8 while below EMA 21) or slope flattening
  // CHOPPY: Mixed structure and EMA
  let stage: TrendStageType = 'CHOPPY';
  let stageDisplay = '⚪ CHOPPY';

  // Check how long EMA 8 has been above or below EMA 21
  let consecutiveAlignedBars = 0;
  for (let i = ema8Series.length - 1; i >= Math.max(0, ema8Series.length - 15); i--) {
    if (emaAlignment === 'BULLISH_8_21' && ema8Series[i] > ema21Series[i]) {
      consecutiveAlignedBars++;
    } else if (emaAlignment === 'BEARISH_8_21' && ema8Series[i] < ema21Series[i]) {
      consecutiveAlignedBars++;
    } else {
      break;
    }
  }

  if (emaAlignment === 'BULLISH_8_21') {
    if (consecutiveAlignedBars <= 4 || breakout === 'BREAKOUT') {
      stage = 'NEW';
      stageDisplay = '🆕 NEW';
    } else {
      stage = 'RUNNING';
      stageDisplay = '🔥 RUNNING';
    }
  } else if (emaAlignment === 'BEARISH_8_21') {
    if (consecutiveAlignedBars <= 4 || breakout === 'BREAKDOWN') {
      stage = 'NEW';
      stageDisplay = '🆕 NEW';
    } else {
      stage = 'RUNNING';
      stageDisplay = '🔥 RUNNING';
    }
  } else {
    // Check if it's weakening from a previous trend
    const wasBullish = currentPrice >= currentEma21 && currentPrice < currentEma8 && prevEma8 > prevEma21;
    const wasBearish = currentPrice <= currentEma21 && currentPrice > currentEma8 && prevEma8 < prevEma21;

    if (wasBullish || wasBearish || (structure !== 'MIXED' && emaSlope === 'FLAT')) {
      stage = 'WEAKENING';
      stageDisplay = '⚠️ WEAKENING';
    } else {
      stage = 'CHOPPY';
      stageDisplay = '⚪ CHOPPY';
    }
  }

  // 6. Trend Score (Max 7 Points)
  // Bullish scoring:
  // +2: HH + HL structure
  // +2: Price > EMA 8 > EMA 21
  // +1: EMA 8 & 21 rising
  // +1: Volume > Avg Volume
  // +1: Recent breakout
  let bullishScore = 0;
  if (structure === 'HH_HL') bullishScore += 2;
  if (emaAlignment === 'BULLISH_8_21') bullishScore += 2;
  if (emaSlope === 'RISING') bullishScore += 1;
  if (isHighVolume) bullishScore += 1;
  if (breakout === 'BREAKOUT') bullishScore += 1;

  // Bearish scoring:
  // +2: LH + LL structure
  // +2: Price < EMA 8 < EMA 21
  // +1: EMA 8 & 21 falling
  // +1: Volume > Avg Volume
  // +1: Recent breakdown
  let bearishScore = 0;
  if (structure === 'LH_LL') bearishScore += 2;
  if (emaAlignment === 'BEARISH_8_21') bearishScore += 2;
  if (emaSlope === 'FALLING') bearishScore += 1;
  if (isHighVolume) bearishScore += 1;
  if (breakout === 'BREAKDOWN') bearishScore += 1;

  // 7. Overall Classification & Direction
  let trendScore = 0;
  let direction: TrendDirectionType = 'CHOPPY';
  let classification: TrendClassificationType = 'NEUTRAL_CHOPPY';

  if (bullishScore >= bearishScore) {
    trendScore = bullishScore;
    if (bullishScore >= 6) {
      classification = 'STRONG_BULLISH';
      direction = 'UP';
    } else if (bullishScore >= 4) {
      classification = 'BULLISH';
      direction = 'UP';
    } else {
      classification = 'NEUTRAL_CHOPPY';
      direction = 'CHOPPY';
    }
  } else {
    trendScore = bearishScore;
    if (bearishScore >= 6) {
      classification = 'STRONG_BEARISH';
      direction = 'DOWN';
    } else if (bearishScore >= 4) {
      classification = 'BEARISH';
      direction = 'DOWN';
    } else {
      classification = 'NEUTRAL_CHOPPY';
      direction = 'CHOPPY';
    }
  }

  // 8. Sorting Rank Calculation
  // 1: New Strong Trend
  // 2: Strong Trend
  // 3: Running Trend
  // 4: Weakening
  // 5: Choppy
  let sortRank = 5;
  if (stage === 'NEW' && trendScore >= 5) {
    sortRank = 1;
  } else if (classification === 'STRONG_BULLISH' || classification === 'STRONG_BEARISH') {
    sortRank = 2;
  } else if (stage === 'RUNNING') {
    sortRank = 3;
  } else if (stage === 'WEAKENING') {
    sortRank = 4;
  } else {
    sortRank = 5;
  }

  return {
    symbol: safeSymbol,
    name: safeName,
    price: currentPrice,
    todaysOpen,
    priceChangePct,
    rvol,
    direction,
    classification,
    bullishScore,
    bearishScore,
    trendScore,
    scoreDisplay: `${trendScore}/7`,
    structure,
    structureDisplay,
    ema8: Number(currentEma8.toFixed(2)),
    ema21: Number(currentEma21.toFixed(2)),
    emaAlignment,
    emaAlignmentDisplay,
    emaSlope,
    emaSlopeDisplay,
    volumeStatus,
    volumeDisplay,
    breakout,
    breakoutDisplay,
    stage,
    stageDisplay,
    sortRank,
    lastUpdated: new Date().toLocaleTimeString(),
    lastCandleTimestamp: latestCandle.timestamp,
    isLoadingData: false
  };
}
