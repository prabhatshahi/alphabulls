import { StockScanStatus } from '../types';

export interface SentimentFactor {
  text: string;
  polarity: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  weight: number; // 1 to 10
  category: 'PRICE_ACTION' | 'VOLUME' | 'ORDER_FLOW' | 'LEVELS' | 'MOMENTUM';
  explanation: string;
}

export interface SentimentAnalysisResult {
  score: number; // 0 to 100 (50 is neutral, >50 bullish, <50 bearish)
  bullishPct: number; // 0 to 100
  bearishPct: number; // 0 to 100
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  label:
    | 'EXTREME BULLISH'
    | 'STRONG BULLISH'
    | 'MODERATE BULLISH'
    | 'SLIGHT BULLISH'
    | 'NEUTRAL'
    | 'SLIGHT BEARISH'
    | 'MODERATE BEARISH'
    | 'STRONG BEARISH'
    | 'EXTREME BEARISH';
  shortLabel: string;
  badgeColor: string;
  textColor: string;
  glowColor: string;
  summary: string;
  confidence: 'VERY HIGH' | 'HIGH' | 'MODERATE' | 'LOW';
  factors: SentimentFactor[];
  bullishFactorCount: number;
  bearishFactorCount: number;
  netScoreDelta: number; // -50 to +50
}

/**
 * Extracts and categorizes sentiment polarity, confidence and weights
 * from an array of AI alert / scanner reasoning strings, supplemented by live indicators.
 */
export function extractSentimentFromReasons(
  reasons: string[] = [],
  stock?: Partial<StockScanStatus>,
  signalType?: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
): SentimentAnalysisResult {
  const factors: SentimentFactor[] = [];
  const processedPhrases = new Set<string>();

  // Helper to add factor avoiding duplicate keywords
  const addFactor = (factor: SentimentFactor) => {
    const key = factor.text.toLowerCase().trim();
    if (!processedPhrases.has(key)) {
      processedPhrases.add(key);
      factors.push(factor);
    }
  };

  // 1. Process explicit strings from `reasons` field
  for (const rawReason of reasons) {
    if (!rawReason) continue;
    const r = rawReason.trim();
    const lower = r.toLowerCase();

    // Bullish Price Action / Breakouts
    if (
      lower.includes('adr breakout') ||
      lower.includes('active adr breakout') ||
      lower.includes('breakout') ||
      lower.includes('above adr resistance') ||
      lower.includes('cleared resistance')
    ) {
      addFactor({
        text: r,
        polarity: 'BULLISH',
        weight: 9,
        category: 'PRICE_ACTION',
        explanation: 'Price closed decisively above key daily ADR structural resistance'
      });
    }
    // Bullish Multi-Day & PD Range
    else if (
      lower.includes('day high') ||
      lower.includes('pdh cleared') ||
      lower.includes('broke pdh') ||
      lower.includes('all time high') ||
      lower.includes('52w high')
    ) {
      addFactor({
        text: r,
        polarity: 'BULLISH',
        weight: 8,
        category: 'LEVELS',
        explanation: 'Multi-session institutional supply cleared; upward price discovery active'
      });
    }
    // Bullish CVD / Order Flow
    else if (
      lower.includes('bullish cvd') ||
      lower.includes('buy order flow') ||
      lower.includes('buying surge') ||
      lower.includes('+cvd') ||
      lower.includes('aggressive buy')
    ) {
      addFactor({
        text: r,
        polarity: 'BULLISH',
        weight: 8.5,
        category: 'ORDER_FLOW',
        explanation: 'Aggressive institutional market orders absorbing ask side liquidity'
      });
    }
    // Bullish Support Bounce / Reversals
    else if (
      lower.includes('support bounce') ||
      lower.includes('key support') ||
      lower.includes('supp bounce') ||
      lower.includes('oversold bounce')
    ) {
      addFactor({
        text: r,
        polarity: 'BULLISH',
        weight: 7.5,
        category: 'LEVELS',
        explanation: 'Dip firmly bought up with aggressive institutional bid absorption at support'
      });
    }
    // Heavy RVOL Expansion
    else if (
      lower.includes('heavy rvol') ||
      lower.includes('rvol') ||
      lower.includes('volume spike') ||
      lower.includes('vol surge')
    ) {
      const isBull = signalType === 'BULLISH' || (stock?.priceChangePct ?? 0) >= 0;
      addFactor({
        text: r,
        polarity: isBull ? 'BULLISH' : 'BEARISH',
        weight: 7,
        category: 'VOLUME',
        explanation: isBull
          ? 'Heavy relative volume confirming genuine buyer participation'
          : 'High volume panic selling confirming heavy institutional distribution'
      });
    }
    // Bearish Breakdown
    else if (
      lower.includes('adr breakdown') ||
      lower.includes('active adr breakdown') ||
      lower.includes('breakdown') ||
      lower.includes('below adr support') ||
      lower.includes('cracked support')
    ) {
      addFactor({
        text: r,
        polarity: 'BEARISH',
        weight: 9,
        category: 'PRICE_ACTION',
        explanation: 'Price cracked below daily structural ADR support band'
      });
    }
    // Bearish Multi-Day & PD Range
    else if (
      lower.includes('day low') ||
      lower.includes('pdl broken') ||
      lower.includes('broke pdl') ||
      lower.includes('52w low')
    ) {
      addFactor({
        text: r,
        polarity: 'BEARISH',
        weight: 8,
        category: 'LEVELS',
        explanation: 'Prior daily floor broken; aggressive supply cascading lower'
      });
    }
    // Bearish CVD / Order Flow
    else if (
      lower.includes('bearish cvd') ||
      lower.includes('sell order flow') ||
      lower.includes('selling surge') ||
      lower.includes('-cvd') ||
      lower.includes('aggressive sell')
    ) {
      addFactor({
        text: r,
        polarity: 'BEARISH',
        weight: 8.5,
        category: 'ORDER_FLOW',
        explanation: 'Dominant market sell orders dumping aggressively into bids'
      });
    }
    // Bearish Resistance Reject
    else if (
      lower.includes('resistance reject') ||
      lower.includes('key resistance') ||
      lower.includes('res reject') ||
      lower.includes('supply zone reject')
    ) {
      addFactor({
        text: r,
        polarity: 'BEARISH',
        weight: 7.5,
        category: 'LEVELS',
        explanation: 'Failed breakout attempt rejected with strong overhead seller supply'
      });
    }
    // Generic indicator reasons
    else if (lower.includes('vwap') || lower.includes('ema') || lower.includes('rsi') || lower.includes('macd')) {
      const isBull =
        lower.includes('above') ||
        lower.includes('golden') ||
        lower.includes('bullish') ||
        lower.includes('positive');
      addFactor({
        text: r,
        polarity: isBull ? 'BULLISH' : 'BEARISH',
        weight: 6,
        category: 'MOMENTUM',
        explanation: isBull
          ? 'Technical momentum & trend filter oscillators strongly aligned positive'
          : 'Technical momentum oscillators deteriorating into bearish territory'
      });
    } else {
      // Default fallback based on signal direction
      const isBull = signalType === 'BULLISH' || (stock?.status === 'BUY_SIGNAL');
      addFactor({
        text: r,
        polarity: isBull ? 'BULLISH' : 'BEARISH',
        weight: 5,
        category: 'MOMENTUM',
        explanation: r
      });
    }
  }

  // 2. Synthesize additional factors from live stock data if available
  if (stock) {
    // Status
    if (stock.status === 'BUY_SIGNAL' && !reasons.some((r) => r.toLowerCase().includes('breakout'))) {
      addFactor({
        text: 'ADR Breakout Active',
        polarity: 'BULLISH',
        weight: 8,
        category: 'PRICE_ACTION',
        explanation: 'Triggered bullish ADR breakout on current closed candle'
      });
    } else if (stock.status === 'SELL_SIGNAL' && !reasons.some((r) => r.toLowerCase().includes('breakdown'))) {
      addFactor({
        text: 'ADR Breakdown Active',
        polarity: 'BEARISH',
        weight: 8,
        category: 'PRICE_ACTION',
        explanation: 'Triggered bearish ADR breakdown on current closed candle'
      });
    }

    // CVD Delta
    if (stock.cvd && stock.cvd !== 0) {
      const cvdK = Math.round(stock.cvd / 1000);
      if (stock.cvd > 0 && !reasons.some((r) => r.toLowerCase().includes('cvd'))) {
        addFactor({
          text: `Buy CVD (+${cvdK}k)`,
          polarity: 'BULLISH',
          weight: Math.min(8, 4 + Math.abs(stock.cvd) / 50000),
          category: 'ORDER_FLOW',
          explanation: 'Net positive cumulative volume delta reflecting buyer aggression'
        });
      } else if (stock.cvd < 0 && !reasons.some((r) => r.toLowerCase().includes('cvd'))) {
        addFactor({
          text: `Sell CVD (${cvdK}k)`,
          polarity: 'BEARISH',
          weight: Math.min(8, 4 + Math.abs(stock.cvd) / 50000),
          category: 'ORDER_FLOW',
          explanation: 'Net negative cumulative volume delta reflecting seller dominance'
        });
      }
    }

    // RVOL
    if (stock.rvol && stock.rvol >= 1.3 && !reasons.some((r) => r.toLowerCase().includes('rvol'))) {
      const isPositive = (stock.priceChangePct ?? 0) >= 0 || stock.status === 'BUY_SIGNAL';
      addFactor({
        text: `${stock.rvol.toFixed(1)}x RVOL Surge`,
        polarity: isPositive ? 'BULLISH' : 'BEARISH',
        weight: Math.min(8.5, 4 + stock.rvol * 1.5),
        category: 'VOLUME',
        explanation: `${stock.rvol.toFixed(1)}x abnormal volume surge indicating institutional footprint`
      });
    }

    // Multi-Day status
    if (stock.daysHighBroken && stock.daysHighBroken >= 2) {
      addFactor({
        text: `${stock.daysHighBroken}-Day High Cleared`,
        polarity: 'BULLISH',
        weight: 8,
        category: 'LEVELS',
        explanation: `Price penetrated above prior ${stock.daysHighBroken} daily consecutive highs`
      });
    } else if (stock.daysLowBroken && stock.daysLowBroken >= 2) {
      addFactor({
        text: `${stock.daysLowBroken}-Day Low Broken`,
        polarity: 'BEARISH',
        weight: 8,
        category: 'LEVELS',
        explanation: `Price collapsed below prior ${stock.daysLowBroken} daily consecutive lows`
      });
    }

    // Reversal radar
    if (stock.reversalType === 'SUPPORT_REVERSAL') {
      addFactor({
        text: 'Support Bounce',
        polarity: 'BULLISH',
        weight: 7.5,
        category: 'LEVELS',
        explanation: 'Tested lower ADR support band and bounced back strongly'
      });
    } else if (stock.reversalType === 'RESISTANCE_REVERSAL') {
      addFactor({
        text: 'Resistance Rejection',
        polarity: 'BEARISH',
        weight: 7.5,
        category: 'LEVELS',
        explanation: 'Tested upper ADR resistance band and rejected downward'
      });
    }

    // CPR status
    if (stock.cprStatus === 'ABOVE_CPR' || stock.cprStatus === 'ABOVE_R1') {
      addFactor({
        text: 'Trading Above Central Pivot (CPR)',
        polarity: 'BULLISH',
        weight: 5.5,
        category: 'LEVELS',
        explanation: 'Positioned above daily CPR pivot zone reflecting institutional accumulation bias'
      });
    } else if (stock.cprStatus === 'BELOW_CPR' || stock.cprStatus === 'BELOW_S1') {
      addFactor({
        text: 'Trading Below Central Pivot (CPR)',
        polarity: 'BEARISH',
        weight: 5.5,
        category: 'LEVELS',
        explanation: 'Positioned below daily CPR pivot zone reflecting institutional distribution bias'
      });
    }
  }

  // Calculate Weighted Sentiment Polarity
  let bullishWeightSum = 0;
  let bearishWeightSum = 0;
  let bullishFactorCount = 0;
  let bearishFactorCount = 0;

  for (const factor of factors) {
    if (factor.polarity === 'BULLISH') {
      bullishWeightSum += factor.weight;
      bullishFactorCount++;
    } else if (factor.polarity === 'BEARISH') {
      bearishWeightSum += factor.weight;
      bearishFactorCount++;
    }
  }

  // Base neutral score is 50
  let finalScore = 50;
  const totalWeight = bullishWeightSum + bearishWeightSum;

  if (totalWeight > 0) {
    // Normalization with sigmoid-like curve
    const netWeight = bullishWeightSum - bearishWeightSum;
    const ratio = netWeight / totalWeight; // between -1 and +1
    // Range between 10 and 95 (or extreme 98)
    finalScore = Math.round(50 + ratio * 45);
    finalScore = Math.max(5, Math.min(98, finalScore));
  } else {
    // Fallback based on price change and signal
    if (signalType === 'BULLISH' || stock?.status === 'BUY_SIGNAL') {
      finalScore = 78;
    } else if (signalType === 'BEARISH' || stock?.status === 'SELL_SIGNAL') {
      finalScore = 22;
    } else {
      const chg = stock?.priceChangePct ?? 0;
      finalScore = Math.round(Math.max(15, Math.min(85, 50 + chg * 8)));
    }
  }

  // Determine Bias, Label, and Colors
  let bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  let label: SentimentAnalysisResult['label'] = 'NEUTRAL';
  let shortLabel = 'NEUTRAL (50%)';
  let badgeColor = 'bg-slate-800 border-slate-700 text-slate-300';
  let textColor = 'text-slate-300';
  let glowColor = 'rgba(148, 163, 184, 0.15)';

  if (finalScore >= 88) {
    bias = 'BULLISH';
    label = 'EXTREME BULLISH';
    shortLabel = 'EXTREME BULL';
    badgeColor = 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]';
    textColor = 'text-emerald-400';
    glowColor = 'rgba(16, 185, 129, 0.35)';
  } else if (finalScore >= 75) {
    bias = 'BULLISH';
    label = 'STRONG BULLISH';
    shortLabel = 'STRONG BULL';
    badgeColor = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300';
    textColor = 'text-emerald-400';
    glowColor = 'rgba(16, 185, 129, 0.25)';
  } else if (finalScore >= 62) {
    bias = 'BULLISH';
    label = 'MODERATE BULLISH';
    shortLabel = 'MOD BULL';
    badgeColor = 'bg-teal-500/15 border-teal-500/30 text-teal-300';
    textColor = 'text-teal-400';
    glowColor = 'rgba(20, 184, 166, 0.2)';
  } else if (finalScore >= 54) {
    bias = 'BULLISH';
    label = 'SLIGHT BULLISH';
    shortLabel = 'MILD BULL';
    badgeColor = 'bg-cyan-500/10 border-cyan-500/25 text-cyan-300';
    textColor = 'text-cyan-400';
    glowColor = 'rgba(6, 182, 212, 0.15)';
  } else if (finalScore <= 12) {
    bias = 'BEARISH';
    label = 'EXTREME BEARISH';
    shortLabel = 'EXTREME BEAR';
    badgeColor = 'bg-rose-500/25 border-rose-400 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]';
    textColor = 'text-rose-400';
    glowColor = 'rgba(244, 63, 94, 0.35)';
  } else if (finalScore <= 25) {
    bias = 'BEARISH';
    label = 'STRONG BEARISH';
    shortLabel = 'STRONG BEAR';
    badgeColor = 'bg-rose-500/15 border-rose-500/40 text-rose-300';
    textColor = 'text-rose-400';
    glowColor = 'rgba(244, 63, 94, 0.25)';
  } else if (finalScore <= 38) {
    bias = 'BEARISH';
    label = 'MODERATE BEARISH';
    shortLabel = 'MOD BEAR';
    badgeColor = 'bg-orange-500/15 border-orange-500/30 text-orange-300';
    textColor = 'text-orange-400';
    glowColor = 'rgba(249, 115, 22, 0.2)';
  } else if (finalScore <= 46) {
    bias = 'BEARISH';
    label = 'SLIGHT BEARISH';
    shortLabel = 'MILD BEAR';
    badgeColor = 'bg-amber-500/10 border-amber-500/25 text-amber-300';
    textColor = 'text-amber-400';
    glowColor = 'rgba(245, 158, 11, 0.15)';
  } else {
    bias = 'NEUTRAL';
    label = 'NEUTRAL';
    shortLabel = 'NEUTRAL';
    badgeColor = 'bg-slate-800/80 border-slate-700 text-slate-300';
    textColor = 'text-slate-300';
    glowColor = 'rgba(148, 163, 184, 0.15)';
  }

  const confidence: SentimentAnalysisResult['confidence'] =
    factors.length >= 4 ? 'VERY HIGH' : factors.length >= 2 ? 'HIGH' : factors.length === 1 ? 'MODERATE' : 'LOW';

  const bullishPct = finalScore;
  const bearishPct = 100 - finalScore;

  let summary = '';
  if (bias === 'BULLISH') {
    summary = `AI analyzed ${factors.length} structural triggers. Dominant bullish factors: ${
      factors.filter((f) => f.polarity === 'BULLISH').map((f) => f.text).slice(0, 2).join(', ') || 'Buying Momentum'
    } with ${finalScore}% bullish confidence.`;
  } else if (bias === 'BEARISH') {
    summary = `AI analyzed ${factors.length} structural triggers. Dominant bearish factors: ${
      factors.filter((f) => f.polarity === 'BEARISH').map((f) => f.text).slice(0, 2).join(', ') || 'Selling Pressure'
    } with ${bearishPct}% bearish confidence.`;
  } else {
    summary = `Balanced order flow and price range. Oscillating without decisive breakout triggers.`;
  }

  return {
    score: finalScore,
    bullishPct,
    bearishPct,
    bias,
    label,
    shortLabel,
    badgeColor,
    textColor,
    glowColor,
    summary,
    confidence,
    factors,
    bullishFactorCount,
    bearishFactorCount,
    netScoreDelta: finalScore - 50
  };
}
