/**
 * TradingView Integration Utilities
 * Generates accurate TradingView URLs and symbol strings for Indian (NSE/BSE) and US stocks.
 */

export function getTradingViewSymbol(rawSymbol: string): string {
  if (!rawSymbol) return 'NSE:NIFTY';
  const sym = rawSymbol.trim().toUpperCase();

  // If already contains exchange prefix (e.g. NSE:SBIN)
  if (sym.includes(':')) {
    return sym;
  }

  // Handle Yahoo Finance style suffixes
  if (sym.endsWith('.NS')) {
    const clean = sym.replace('.NS', '');
    return `NSE:${clean}`;
  }
  if (sym.endsWith('.BO')) {
    const clean = sym.replace('.BO', '');
    return `BSE:${clean}`;
  }

  // Common US Tech Stocks
  const usTech = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'GOOG', 'AMZN', 'META', 'TSLA', 'AMD', 'NFLX', 'INTC', 'PYPL', 'CRM', 'ADBE', 'AVGO', 'QCOM', 'TXN', 'CSCO', 'AMAT', 'MU', 'LRCX', 'PANW', 'SNOW', 'PLTR', 'ARM', 'SMCI', 'COIN', 'MSTR', 'UBER', 'ABNB', 'SHOP', 'SQ', 'ROKU', 'CRWD', 'NET', 'DDOG', 'ZS', 'NOW', 'SNPS', 'CDNS', 'MRVL', 'KLAC', 'ASML', 'TSM', 'BABA', 'PDD', 'JD', 'BIDU', 'NTES', 'SE', 'GRAB', 'MELI', 'NU', 'CPNG', 'SPOT', 'DASH', 'RBLX', 'U', 'AFRM', 'HOOD', 'SOFI', 'UPST', 'IONQ', 'RIVN', 'LCID', 'NIO', 'XPEV', 'LI', 'F', 'GM', 'DIS', 'NFLX', 'WMT', 'TGT', 'COST', 'HD', 'LOW', 'NKE', 'SBUX', 'MCD', 'KO', 'PEP', 'PG', 'JNJ', 'UNH', 'PFE', 'MRK', 'ABBV', 'LLY', 'BMY', 'AMGN', 'GILD', 'V', 'MA', 'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'BLK', 'SCHW', 'AXP', 'SPY', 'QQQ', 'IWM', 'DIA', 'VXX', 'UVXY', 'TLT', 'GLD', 'SLV', 'USO', 'UNG'];

  if (usTech.includes(sym)) {
    return `NASDAQ:${sym}`;
  }

  // Default to NSE for Indian terminal stocks
  return `NSE:${sym}`;
}

export function getTradingViewUrl(rawSymbol: string, timeframe: '5m' | '15m' | 'D' | '1' = '15m'): string {
  const tvSymbol = getTradingViewSymbol(rawSymbol);
  const interval = timeframe === '5m' ? '5' : timeframe === '15m' ? '15' : timeframe === 'D' ? 'D' : '15';
  
  // Encoded URL for TradingView full interactive charting
  return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}&interval=${interval}`;
}

export function openTradingViewChart(rawSymbol: string, timeframe: '5m' | '15m' | 'D' = '15m'): void {
  const url = getTradingViewUrl(rawSymbol, timeframe);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
