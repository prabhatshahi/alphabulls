import React, { useState } from 'react';
import { ChartAnalysisView } from './ChartAnalysisView';
import { X, Maximize2, Crosshair, ExternalLink, Sliders, BarChart2 } from 'lucide-react';
import { getTradingViewSymbol, openTradingViewChart, getTradingViewUrl } from '../utils/tradingView';

interface ChartModalProps {
  symbol: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenFullTerminal?: (symbol: string) => void;
  timeframe: '5m' | '15m';
  setTimeframe?: (tf: '5m' | '15m') => void;
}

export const ChartModal: React.FC<ChartModalProps> = ({
  symbol,
  isOpen,
  onClose,
  timeframe,
  setTimeframe,
}) => {
  const [chartMode, setChartMode] = useState<'VPVR' | 'TRADINGVIEW'>('VPVR');

  if (!isOpen || !symbol) return null;

  const tvSymbol = getTradingViewSymbol(symbol);
  const tvInterval = timeframe === '5m' ? '5' : '15';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto relative animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Bar */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
                <span>Chart Preview</span>
                <span className="bg-emerald-500/20 text-emerald-400 font-bold text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-mono">
                  {symbol}
                </span>
                <span className="bg-blue-500/20 text-blue-300 font-mono text-[10px] px-2 py-0.5 rounded border border-blue-500/30">
                  {tvSymbol}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 hidden sm:block font-mono">
                Volume Profile POC, ADR Breakout levels & TradingView Integration
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Chart Engine Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl text-xs font-mono font-bold">
              <button
                type="button"
                onClick={() => setChartMode('VPVR')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMode === 'VPVR'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                VPVR Profile
              </button>
              <button
                type="button"
                onClick={() => setChartMode('TRADINGVIEW')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMode === 'TRADINGVIEW'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                TradingView
              </button>
            </div>

            {/* Direct Open in TradingView External Tab */}
            <button
              onClick={() => openTradingViewChart(symbol, timeframe)}
              className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold font-mono cursor-pointer shadow-sm active:scale-95"
              title="Open full interactive chart on TradingView in a new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span>TradingView ↗</span>
            </button>

            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 p-1.5 rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
              title="Close Popup"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-3 sm:p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {chartMode === 'TRADINGVIEW' ? (
            <div className="w-full h-[600px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 relative">
              <iframe
                title={`TradingView Chart ${symbol}`}
                src={`https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(tvSymbol)}&interval=${tvInterval}&theme=dark&style=1&timezone=Asia%2FKolkata&studies=%5B%5D&hide_side_toolbar=0&allow_symbol_change=1&save_image=1&details=1&hotlist=1&calendar=1`}
                className="w-full h-full border-0"
                allowFullScreen
              />
            </div>
          ) : (
            <ChartAnalysisView
              selectedSymbol={symbol}
              timeframe={timeframe}
              setTimeframe={setTimeframe}
            />
          )}
        </div>
      </div>
    </div>
  );
};
