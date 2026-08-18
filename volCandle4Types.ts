import { Candle } from '../types';

export interface VolCandleConfig {
  period: number;        // Default 14 (EMA period)
  volFactor: number;     // Default 1.50 (150% of 14 EMA volume -> Light Green / Maroon)
}

export type VolCandleType = 
  | 'LIGHT_GREEN'  // Light Green (#22c55e) - Bullish High Volume
  | 'MAROON'       // Maroon (#991b1b) - Bearish High Volume
  | 'NORMAL_BULL'  // Green (#10b981) - Normal Bullish
  | 'NORMAL_BEAR'; // Red (#ef4444) - Normal Bearish

export interface VolCandleInfo {
  candle: Candle;
  type: VolCandleType;
  colorName: 'Light Green' | 'Maroon' | 'Green' | 'Red';
  colorHex: string;
  bgTailwind: string;
  borderTailwind: string;
  textTailwind: string;
  volume: number;
  emaVolume: number;
  volRatio: number;
  isHighVol: boolean;
  candleIndexInDay: number; // 0 for 1st 5-min candle, 1 for 2nd 5-min candle
}

export interface VolCandleSignal {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  timeframe: '5m' | '15m';
  candle1Time: string;
  candle2Time: string;
  candle1Type: VolCandleType;
  candle2Type: VolCandleType;
  candle1Color: string;
  candle2Color: string;
  entryPrice: number;
  targetPrice: number;
  stopLossPrice: number;
  volRatio1: number;
  volRatio2: number;
  confidence: 'VERY_HIGH' | 'HIGH';
  description: string;
  timestamp: string;
  ltp: number;
  priceChangePct: number;
}

export const DEFAULT_VOL_CANDLE_CONFIG: VolCandleConfig = {
  period: 14,
  volFactor: 1.50,
};

/**
 * Calculates EMA for an array of numbers.
 */
function calculateEMA(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const ema: number[] = new Array(values.length);
  const k = 2 / (period + 1);

  let sum = 0;
  for (let i = 0; i < Math.min(period, values.length); i++) {
    sum += values[i];
    ema[i] = sum / (i + 1);
  }

  for (let i = period; i < values.length; i++) {
    ema[i] = values[i] * k + ema[i - 1] * (1 - k);
  }

  return ema;
}

/**
 * Analyzes intraday candles and classifies into Light Green (Bullish High Vol) and Maroon (Bearish High Vol).
 */
export function calculateVolCandles(
  candles: Candle[],
  config: VolCandleConfig = DEFAULT_VOL_CANDLE_CONFIG
): VolCandleInfo[] {
  if (!candles || candles.length === 0) return [];

  const volumes = candles.map((c) => c.volume);
  const emaVolumes = calculateEMA(volumes, config.period);

  let currentDateStr = '';
  let dayIndexCounter = 0;

  return candles.map((c, i) => {
    const dateStr = c.datetime.substring(0, 10);
    if (dateStr !== currentDateStr) {
      currentDateStr = dateStr;
      dayIndexCounter = 0;
    } else {
      dayIndexCounter++;
    }

    const emaVol = emaVolumes[i] || 1;
    const volRatio = c.volume / emaVol;
    const up = c.close >= c.open;

    const isHighVol = c.volume >= emaVol * config.volFactor;

    let type: VolCandleType = up ? 'NORMAL_BULL' : 'NORMAL_BEAR';
    let colorName: 'Light Green' | 'Maroon' | 'Green' | 'Red' = up ? 'Green' : 'Red';
    let colorHex = up ? '#10b981' : '#ef4444';
    let bgTailwind = up ? 'bg-emerald-500/10' : 'bg-rose-500/10';
    let borderTailwind = up ? 'border-emerald-500/30' : 'border-rose-500/30';
    let textTailwind = up ? 'text-emerald-400' : 'text-rose-400';

    if (isHighVol && up) {
      type = 'LIGHT_GREEN';
      colorName = 'Light Green';
      colorHex = '#00FF74'; // Light Green
      bgTailwind = 'bg-lime-500/20';
      borderTailwind = 'border-lime-400';
      textTailwind = 'text-lime-300 font-extrabold';
    } else if (isHighVol && !up) {
      type = 'MAROON';
      colorName = 'Maroon';
      colorHex = '#BDB7B7'; // Maroon
      bgTailwind = 'bg-rose-950/90';
      borderTailwind = 'border-rose-700';
      textTailwind = 'text-rose-400 font-extrabold';
    }

    return {
      candle: c,
      type,
      colorName,
      colorHex,
      bgTailwind,
      borderTailwind,
      textTailwind,
      volume: c.volume,
      emaVolume: emaVol,
      volRatio,
      isHighVol,
      candleIndexInDay: dayIndexCounter,
    };
  });
}

export function formatMarketTime(datetimeStr: string, timestamp?: number, symbol: string = ''): string {
  try {
    const isUs = symbol.includes('AAPL') || symbol.includes('NVDA') || symbol.includes('TSLA') || symbol.includes('SPY') || symbol.includes('MSFT') || symbol.includes('GOOGL') || symbol.includes('AMZN') || symbol.includes('META') || symbol.includes('AMD') || symbol.includes('NFLX');
    const timeZone = isUs ? 'America/New_York' : 'Asia/Kolkata';

    let dateObj: Date;
    if (timestamp && timestamp > 0) {
      dateObj = new Date(timestamp);
    } else if (datetimeStr) {
      dateObj = new Date(datetimeStr);
    } else {
      dateObj = new Date();
    }

    if (isNaN(dateObj.getTime())) return datetimeStr ? datetimeStr.substring(11, 16) : '09:15';

    return dateObj.toLocaleTimeString('en-IN', {
      timeZone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return datetimeStr ? datetimeStr.substring(11, 16) : '09:15';
  }
}

/**
 * Detects Strategy Confirmation Signals based on 1st & 2nd 5-Min Volume Candles.
 * Rule:
 * - Bullish: 1st 5-min candle is Light Green (High Vol Bullish) + 2nd 5-min candle confirms (Bullish).
 * - Bearish: 1st 5-min candle is Maroon (High Vol Bearish) + 2nd 5-min candle confirms (Bearish).
 */
export function detectVolCandleSignals(
  symbol: string,
  candles: Candle[],
  timeframe: '5m' | '15m' = '5m',
  config: VolCandleConfig = DEFAULT_VOL_CANDLE_CONFIG
): VolCandleSignal[] {
  const volInfo = calculateVolCandles(candles, config);
  if (volInfo.length < 2) return [];

  const signals: VolCandleSignal[] = [];

  const byDate: Map<string, VolCandleInfo[]> = new Map();
  volInfo.forEach((v) => {
    const d = v.candle.datetime.substring(0, 10);
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push(v);
  });

  const dates = Array.from(byDate.keys()).sort();

  for (const d of dates) {
    const dayCandles = byDate.get(d) || [];
    if (dayCandles.length < 2) continue;

    const c1 = dayCandles[0]; // 1st 5-min candle of the day
    const c2 = dayCandles[1]; // 2nd 5-min candle of the day

    const ltp = c2.candle.close;
    const todaysOpen = c1.candle.open;
    const priceChangePct = ((ltp - todaysOpen) / todaysOpen) * 100;

    const t1Formatted = formatMarketTime(c1.candle.datetime, c1.candle.timestamp, symbol);
    const t2Formatted = formatMarketTime(c2.candle.datetime, c2.candle.timestamp, symbol);

    // Bullish Condition:
    // 1st Candle is Light Green
    const c1IsLightGreen = c1.type === 'LIGHT_GREEN';
    const c2IsBullish = c2.candle.close >= c2.candle.open || c2.type === 'LIGHT_GREEN';

    if (c1IsLightGreen && c2IsBullish) {
      const entryPrice = c2.candle.close;
      const targetPrice = entryPrice * 1.01;  // +1% Target
      const stopLossPrice = Math.min(c1.candle.low, c2.candle.low);

      signals.push({
        id: `VOL4_${symbol}_BUY_${d}`,
        symbol,
        type: 'BUY',
        timeframe,
        candle1Time: t1Formatted,
        candle2Time: t2Formatted,
        candle1Type: c1.type,
        candle2Type: c2.type,
        candle1Color: 'Light Green',
        candle2Color: c2.colorName,
        entryPrice,
        targetPrice,
        stopLossPrice,
        volRatio1: c1.volRatio,
        volRatio2: c2.volRatio,
        confidence: c2.type === 'LIGHT_GREEN' ? 'VERY_HIGH' : 'HIGH',
        description: `1st Candle = Light Green Bullish (${c1.volRatio.toFixed(1)}x Vol) + 2nd Candle ${c2.colorName} Confirmation`,
        timestamp: c2.candle.datetime,
        ltp,
        priceChangePct,
      });
    }

    // Bearish Condition:
    // 1st Candle is Maroon
    const c1IsMaroon = c1.type === 'MAROON';
    const c2IsBearish = c2.candle.close <= c2.candle.open || c2.type === 'MAROON';

    if (c1IsMaroon && c2IsBearish) {
      const entryPrice = c2.candle.close;
      const targetPrice = entryPrice * 0.99;  // -1% Target
      const stopLossPrice = Math.max(c1.candle.high, c2.candle.high);

      signals.push({
        id: `VOL4_${symbol}_SELL_${d}`,
        symbol,
        type: 'SELL',
        timeframe,
        candle1Time: t1Formatted,
        candle2Time: t2Formatted,
        candle1Type: c1.type,
        candle2Type: c2.type,
        candle1Color: 'Maroon',
        candle2Color: c2.colorName,
        entryPrice,
        targetPrice,
        stopLossPrice,
        volRatio1: c1.volRatio,
        volRatio2: c2.volRatio,
        confidence: c2.type === 'MAROON' ? 'VERY_HIGH' : 'HIGH',
        description: `1st Candle = Maroon Bearish (${c1.volRatio.toFixed(1)}x Vol) + 2nd Candle ${c2.colorName} Confirmation`,
        timestamp: c2.candle.datetime,
        ltp,
        priceChangePct,
      });
    }
  }

  return signals;
}
