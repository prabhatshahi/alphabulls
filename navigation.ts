import { TabType } from '../App';

export const getTabTitle = (tab: TabType): string => {
  switch (tab) {
    case 'ai_perfect_confluence':
    case 'ai_perfect_bullish':
    case 'ai_perfect_bearish':
      return 'AI Perfect Confluence (Grade A+++)';
    case 'confluence':
      return 'Intraday Master Confluence';
    case 'confluence_sector':
      return 'Sector Aligned Confluence';
    case 'scanner':
      return 'Live Scanner';
    case 'scanner_bullish':
      return 'Bullish Breakouts';
    case 'scanner_bearish':
      return 'Bearish Breakdowns';
    case 'scanner_volume':
      return 'Volume Surges';
    case 'scanner_multiday':
      return 'Multi-Day & Reversals';
    case 'scanner_watchlist':
      return 'Watchlist Matrix';
    case 'scanner_heatmap':
      return 'Sector Heatmap';
    case 'vol4types':
    case 'vol4types_bullish':
    case 'vol4types_bearish':
      return '4-Type Vol Candles';
    case 'voltype5':
    case 'voltype5_bullish':
    case 'voltype5_bearish':
      return 'Type 5 Climax';
    case 'aipov':
    case 'aipov_bullish':
    case 'aipov_bearish':
      return 'AI Alpha Signals';
    case 'trending_radar':
      return '5M Advanced Trending Radar';
    case 'hotstocks':
      return 'RVOL & CVD Hot Stocks';
    case 'unusual_volume':
    case 'unusual_volume_bullish':
    case 'unusual_volume_bearish':
    case 'unusual_volume_squeeze':
      return 'Unusual Volume & Momentum';
    case 'backtest':
      return 'Backtest Engine';
    case 'chart':
      return 'Trading Terminal';
    case 'csv':
      return 'Upload Custom CSV';
    case 'python':
      return 'Python Exporter';
    case 'all_nse_stocks':
      return 'All NSE Stocks Explorer';
    default:
      return 'Previous Screen';
  }
};
