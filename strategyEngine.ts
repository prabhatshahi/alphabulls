import { Candle, DailyLevel, Signal, Trade, StockBacktestResult, BacktestSummary } from './types';

/**
 * Calculates Average Day Range (ADR 14) using the previous 14 completed daily candles.
 * ADR = (Average High - Average Low) / 2
 */
export function calculateADR(previous14DailyCandles: Candle[]): number {
  if (!previous14DailyCandles || previous14DailyCandles.length < 14) {
    throw new Error(`Insufficient daily candles for ADR(14). Required: 14, Provided: ${previous14DailyCandles?.length || 0}`);
  }

  // Take exact last 14 candles
  const candles = previous14DailyCandles.slice(-14);
  const sumHigh = candles.reduce((acc, c) => acc + c.high, 0);
  const sumLow = candles.reduce((acc, c) => acc + c.low, 0);

  const avgHigh = sumHigh / 14;
  const avgLow = sumLow / 14;

  return (avgHigh - avgLow) / 2;
}

/**
 * Calculates fixed daily Resistance and Support levels for a given trading day.
 * Resistance = Today's Open + ADR
 * Support = Today's Open - ADR
 */
export function calculateDailyLevels(previous14DailyCandles: Candle[], todayOpen: number, dateStr: string): DailyLevel {
  const candles14 = (previous14DailyCandles && previous14DailyCandles.length > 0)
    ? previous14DailyCandles.slice(-14)
    : [];

  const count = candles14.length || 1;
  const sumHigh = candles14.reduce((acc, c) => acc + c.high, 0);
  const sumLow = candles14.reduce((acc, c) => acc + c.low, 0);
  const avgHigh = count > 0 ? sumHigh / count : todayOpen * 1.01;
  const avgLow = count > 0 ? sumLow / count : todayOpen * 0.99;

  const adr14 = Math.max(0.01, (avgHigh - avgLow) / 2);
  const resistance = todayOpen + adr14;
  const support = todayOpen - adr14;

  return {
    date: dateStr,
    open: todayOpen,
    adr14,
    avgHigh,
    avgLow,
    resistance,
    support,
  };
}

/**
 * Validates a single step signal condition based on previous close and current close.
 */
export function checkSignalCondition(
  prevClose: number,
  currentClose: number,
  resistance: number,
  support: number,
  currentState: 'NEUTRAL' | 'ABOVE_RES' | 'BELOW_SUPP'
): { signal: 'BUY' | 'SELL' | 'NONE'; nextState: 'NEUTRAL' | 'ABOVE_RES' | 'BELOW_SUPP' } {
  // Update state tracking if price was previously out of bounds
  let state = currentState;

  if (state === 'ABOVE_RES' && currentClose <= resistance) {
    state = 'NEUTRAL';
  }
  if (state === 'BELOW_SUPP' && currentClose >= support) {
    state = 'NEUTRAL';
  }

  // Check BUY
  if (prevClose <= resistance && currentClose > resistance && state !== 'ABOVE_RES') {
    return { signal: 'BUY', nextState: 'ABOVE_RES' };
  }

  // Check SELL
  if (prevClose >= support && currentClose < support && state !== 'BELOW_SUPP') {
    return { signal: 'SELL', nextState: 'BELOW_SUPP' };
  }

  // Update state if currently above resistance or below support without a new signal
  if (currentClose > resistance) {
    state = 'ABOVE_RES';
  } else if (currentClose < support) {
    state = 'BELOW_SUPP';
  } else {
    state = 'NEUTRAL';
  }

  return { signal: 'NONE', nextState: state };
}

/**
 * Runs the exact strategy backtest for a single stock using daily and intraday candles.
 */
export function backtestStock(
  symbol: string,
  dailyCandles: Candle[],
  intradayCandles: Candle[],
  timeframe: '5m' | '15m' = '5m'
): StockBacktestResult {
  const trades: Trade[] = [];

  // Group intraday candles by date YYYY-MM-DD
  const candlesByDate: Map<string, Candle[]> = new Map();
  for (const candle of intradayCandles) {
    const dateStr = candle.datetime.substring(0, 10);
    if (!candlesByDate.has(dateStr)) {
      candlesByDate.set(dateStr, []);
    }
    candlesByDate.get(dateStr)!.push(candle);
  }

  // Sort daily candles by timestamp ascending
  const sortedDaily = [...dailyCandles].sort((a, b) => a.timestamp - b.timestamp);
  const tradingDates = Array.from(candlesByDate.keys()).sort();

  let activeTrade: {
    symbol: string;
    type: 'BUY' | 'SELL';
    entryTimestamp: string;
    entryPrice: number;
    targetPrice: number;
    stopLossPrice: number;
    entryCandleIndex: number;
    timeframe: '5m' | '15m';
  } | null = null;

  let overallCandleCounter = 0;

  for (const dateStr of tradingDates) {
    const todaysIntraday = candlesByDate.get(dateStr) || [];
    if (todaysIntraday.length === 0) continue;

    // Find previous 14 completed daily candles prior to dateStr
    const prevDaily = sortedDaily.filter((c) => c.datetime.substring(0, 10) < dateStr);
    if (prevDaily.length < 14) {
      // Not enough daily history to calculate ADR(14)
      continue;
    }

    const previous14Daily = prevDaily.slice(-14);

    // Today's Open is the open price of the first intraday candle of today
    const todaysOpen = todaysIntraday[0].open;
    const dailyLevel = calculateDailyLevels(previous14Daily, todaysOpen, dateStr);
    const { resistance, support } = dailyLevel;

    let positionState: 'NEUTRAL' | 'ABOVE_RES' | 'BELOW_SUPP' = 'NEUTRAL';

    for (let i = 0; i < todaysIntraday.length; i++) {
      const currentCandle = todaysIntraday[i];
      overallCandleCounter++;

      // 1. Evaluate Active Trade Exit first if open
      if (activeTrade) {
        if (activeTrade.type === 'BUY') {
          const hitTarget = currentCandle.high >= activeTrade.targetPrice;
          const hitStop = currentCandle.low <= activeTrade.stopLossPrice;

          if (hitTarget && hitStop) {
            // Conservative rule: STOP LOSS FIRST
            trades.push({
              id: `${symbol}-${trades.length + 1}`,
              symbol,
              type: 'BUY',
              entryTimestamp: activeTrade.entryTimestamp,
              exitTimestamp: currentCandle.datetime,
              entryPrice: activeTrade.entryPrice,
              exitPrice: activeTrade.stopLossPrice,
              targetPrice: activeTrade.targetPrice,
              stopLossPrice: activeTrade.stopLossPrice,
              result: 'LOSS',
              returnPct: -1.0,
              holdingCandles: overallCandleCounter - activeTrade.entryCandleIndex,
              timeframe,
            });
            activeTrade = null;
          } else if (hitStop) {
            trades.push({
              id: `${symbol}-${trades.length + 1}`,
              symbol,
              type: 'BUY',
              entryTimestamp: activeTrade.entryTimestamp,
              exitTimestamp: currentCandle.datetime,
              entryPrice: activeTrade.entryPrice,
              exitPrice: activeTrade.stopLossPrice,
              targetPrice: activeTrade.targetPrice,
              stopLossPrice: activeTrade.stopLossPrice,
              result: 'LOSS',
              returnPct: -1.0,
              holdingCandles: overallCandleCounter - activeTrade.entryCandleIndex,
              timeframe,
            });
            activeTrade = null;
          } else if (hitTarget) {
            trades.push({
              id: `${symbol}-${trades.length + 1}`,
              symbol,
              type: 'BUY',
              entryTimestamp: activeTrade.entryTimestamp,
              exitTimestamp: currentCandle.datetime,
              entryPrice: activeTrade.entryPrice,
              exitPrice: activeTrade.targetPrice,
              targetPrice: activeTrade.targetPrice,
              stopLossPrice: activeTrade.stopLossPrice,
              result: 'WIN',
              returnPct: +1.0,
              holdingCandles: overallCandleCounter - activeTrade.entryCandleIndex,
              timeframe,
            });
            activeTrade = null;
          }
        } else if (activeTrade.type === 'SELL') {
          const hitTarget = currentCandle.low <= activeTrade.targetPrice;
          const hitStop = currentCandle.high >= activeTrade.stopLossPrice;

          if (hitTarget && hitStop) {
            // Conservative rule: STOP LOSS FIRST
            trades.push({
              id: `${symbol}-${trades.length + 1}`,
              symbol,
              type: 'SELL',
              entryTimestamp: activeTrade.entryTimestamp,
              exitTimestamp: currentCandle.datetime,
              entryPrice: activeTrade.entryPrice,
              exitPrice: activeTrade.stopLossPrice,
              targetPrice: activeTrade.targetPrice,
              stopLossPrice: activeTrade.stopLossPrice,
              result: 'LOSS',
              returnPct: -1.0,
              holdingCandles: overallCandleCounter - activeTrade.entryCandleIndex,
              timeframe,
            });
            activeTrade = null;
          } else if (hitStop) {
            trades.push({
              id: `${symbol}-${trades.length + 1}`,
              symbol,
              type: 'SELL',
              entryTimestamp: activeTrade.entryTimestamp,
              exitTimestamp: currentCandle.datetime,
              entryPrice: activeTrade.entryPrice,
              exitPrice: activeTrade.stopLossPrice,
              targetPrice: activeTrade.targetPrice,
              stopLossPrice: activeTrade.stopLossPrice,
              result: 'LOSS',
              returnPct: -1.0,
              holdingCandles: overallCandleCounter - activeTrade.entryCandleIndex,
              timeframe,
            });
            activeTrade = null;
          } else if (hitTarget) {
            trades.push({
              id: `${symbol}-${trades.length + 1}`,
              symbol,
              type: 'SELL',
              entryTimestamp: activeTrade.entryTimestamp,
              exitTimestamp: currentCandle.datetime,
              entryPrice: activeTrade.entryPrice,
              exitPrice: activeTrade.targetPrice,
              targetPrice: activeTrade.targetPrice,
              stopLossPrice: activeTrade.stopLossPrice,
              result: 'WIN',
              returnPct: +1.0,
              holdingCandles: overallCandleCounter - activeTrade.entryCandleIndex,
              timeframe,
            });
            activeTrade = null;
          }
        }
      }

      // 2. Evaluate Entry Signal using previous closed candle and current closed candle
      if (i >= 1) {
        const prevCandle = todaysIntraday[i - 1];
        const prevClose = prevCandle.close;
        const currentClose = currentCandle.close;

        const { signal, nextState } = checkSignalCondition(
          prevClose,
          currentClose,
          resistance,
          support,
          positionState
        );

        positionState = nextState;

        // If a new signal occurs and no active trade is currently open
        if (signal === 'BUY' && !activeTrade) {
          const entryPrice = currentClose;
          const targetPrice = entryPrice * 1.01; // +1% Target
          const stopLossPrice = entryPrice * 0.99; // -1% Stop Loss

          activeTrade = {
            symbol,
            type: 'BUY',
            entryTimestamp: currentCandle.datetime,
            entryPrice,
            targetPrice,
            stopLossPrice,
            entryCandleIndex: overallCandleCounter,
            timeframe,
          };
        } else if (signal === 'SELL' && !activeTrade) {
          const entryPrice = currentClose;
          const targetPrice = entryPrice * 0.99; // -1% Target
          const stopLossPrice = entryPrice * 1.01; // +1% Stop Loss

          activeTrade = {
            symbol,
            type: 'SELL',
            entryTimestamp: currentCandle.datetime,
            entryPrice,
            targetPrice,
            stopLossPrice,
            entryCandleIndex: overallCandleCounter,
            timeframe,
          };
        }
      } else {
        // Initial candle state setting
        if (currentCandle.close > resistance) {
          positionState = 'ABOVE_RES';
        } else if (currentCandle.close < support) {
          positionState = 'BELOW_SUPP';
        }
      }
    }
  }

  // Calculate Metrics
  const totalTrades = trades.length;
  const buyTrades = trades.filter((t) => t.type === 'BUY').length;
  const sellTrades = trades.filter((t) => t.type === 'SELL').length;
  const winningTrades = trades.filter((t) => t.result === 'WIN').length;
  const losingTrades = trades.filter((t) => t.result === 'LOSS').length;

  const winRatePct = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const totalPlPct = trades.reduce((acc, t) => acc + t.returnPct, 0);
  const avgTradePct = totalTrades > 0 ? totalPlPct / totalTrades : 0;

  const grossProfit = winningTrades * 1.0;
  const grossLoss = losingTrades * 1.0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? grossProfit : 0;

  // Maximum drawdown calculation on equity curve (% terms)
  let peak = 0;
  let equity = 0;
  let maxDrawdown = 0;

  for (const trade of trades) {
    equity += trade.returnPct;
    if (equity > peak) {
      peak = equity;
    }
    const dd = peak - equity;
    if (dd > maxDrawdown) {
      maxDrawdown = dd;
    }
  }

  return {
    symbol,
    totalTrades,
    buyTrades,
    sellTrades,
    winningTrades,
    losingTrades,
    winRatePct: Math.round(winRatePct * 100) / 100,
    totalPlPct: Math.round(totalPlPct * 100) / 100,
    avgTradePct: Math.round(avgTradePct * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    maxDrawdownPct: Math.round(maxDrawdown * 100) / 100,
    trades,
  };
}

/**
 * Combines multiple stock backtest results into an overall summary.
 */
export function aggregateBacktestSummary(results: StockBacktestResult[]): BacktestSummary {
  let allTrades: Trade[] = [];
  results.forEach((r) => {
    allTrades = allTrades.concat(r.trades);
  });

  // Sort trades chronologically
  allTrades.sort((a, b) => new Date(a.entryTimestamp).getTime() - new Date(b.entryTimestamp).getTime());

  const totalTrades = allTrades.length;
  const buyTrades = allTrades.filter((t) => t.type === 'BUY').length;
  const sellTrades = allTrades.filter((t) => t.type === 'SELL').length;
  const winningTrades = allTrades.filter((t) => t.result === 'WIN').length;
  const losingTrades = allTrades.filter((t) => t.result === 'LOSS').length;

  const winRatePct = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const totalPlPct = allTrades.reduce((acc, t) => acc + t.returnPct, 0);
  const avgTradePct = totalTrades > 0 ? totalPlPct / totalTrades : 0;

  const grossProfit = winningTrades * 1.0;
  const grossLoss = losingTrades * 1.0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? grossProfit : 0;

  let peak = 0;
  let equity = 0;
  let maxDrawdown = 0;

  for (const trade of allTrades) {
    equity += trade.returnPct;
    if (equity > peak) {
      peak = equity;
    }
    const dd = peak - equity;
    if (dd > maxDrawdown) {
      maxDrawdown = dd;
    }
  }

  // Stock breakdown
  const stockBreakdown = results.map((r) => ({
    symbol: r.symbol,
    totalTrades: r.totalTrades,
    winRatePct: r.winRatePct,
    totalPlPct: r.totalPlPct,
    profitFactor: r.profitFactor,
  }));

  // Monthly breakdown
  const monthlyMap: Map<string, { trades: number; wins: number; pl: number }> = new Map();
  for (const t of allTrades) {
    const month = t.entryTimestamp.substring(0, 7); // YYYY-MM
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { trades: 0, wins: 0, pl: 0 });
    }
    const curr = monthlyMap.get(month)!;
    curr.trades += 1;
    if (t.result === 'WIN') curr.wins += 1;
    curr.pl += t.returnPct;
  }

  const monthlyBreakdown = Array.from(monthlyMap.entries()).map(([month, stats]) => ({
    month,
    trades: stats.trades,
    winRatePct: Math.round((stats.wins / stats.trades) * 100 * 100) / 100,
    totalPlPct: Math.round(stats.pl * 100) / 100,
  }));

  // BUY vs SELL breakdown
  const buyList = allTrades.filter((t) => t.type === 'BUY');
  const sellList = allTrades.filter((t) => t.type === 'SELL');

  const buyWins = buyList.filter((t) => t.result === 'WIN').length;
  const sellWins = sellList.filter((t) => t.result === 'WIN').length;

  const buyPl = buyList.reduce((acc, t) => acc + t.returnPct, 0);
  const sellPl = sellList.reduce((acc, t) => acc + t.returnPct, 0);

  return {
    totalTrades,
    buyTrades,
    sellTrades,
    winningTrades,
    losingTrades,
    winRatePct: Math.round(winRatePct * 100) / 100,
    totalPlPct: Math.round(totalPlPct * 100) / 100,
    avgTradePct: Math.round(avgTradePct * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    maxDrawdownPct: Math.round(maxDrawdown * 100) / 100,
    stockBreakdown,
    monthlyBreakdown,
    buyVsSellBreakdown: {
      buy: {
        trades: buyList.length,
        winRatePct: buyList.length > 0 ? Math.round((buyWins / buyList.length) * 100 * 100) / 100 : 0,
        totalPlPct: Math.round(buyPl * 100) / 100,
      },
      sell: {
        trades: sellList.length,
        winRatePct: sellList.length > 0 ? Math.round((sellWins / sellList.length) * 100 * 100) / 100 : 0,
        totalPlPct: Math.round(sellPl * 100) / 100,
      },
    },
    trades: allTrades,
  };
}
