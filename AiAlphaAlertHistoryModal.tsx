import React from 'react';
import { AiAlphaAlertEvent } from '../types';
import {
  Bell,
  Clock,
  TrendingUp,
  TrendingDown,
  Trash2,
  X,
  BarChart2,
  AlertCircle
} from 'lucide-react';

interface AiAlphaAlertHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: AiAlphaAlertEvent[];
  onClearHistory: () => void;
  onSelectSymbolForChart: (symbol: string) => void;
}

const safeToFixed = (val: number | string | null | undefined, decimals = 2, fallback = '0.00'): string => {
  if (val === null || val === undefined) return fallback;
  const num = typeof val === 'number' ? val : Number(val);
  if (isNaN(num)) return fallback;
  return num.toFixed(decimals);
};

export const AiAlphaAlertHistoryModal: React.FC<AiAlphaAlertHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onSelectSymbolForChart
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide text-white uppercase flex items-center gap-2">
                AI Alpha Signals Alert History
              </h2>
              <p className="text-xs text-slate-400">
                Log of all signals that triggered your configured conviction score thresholds
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* History List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2.5 text-xs">
          {history.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-600" />
              <p className="font-semibold text-slate-400">No alerts triggered in this session yet.</p>
              <p className="text-[11px] text-slate-500">
                When an AI Alpha signal meets your configured score criteria, it will be logged here with exact timestamp.
              </p>
            </div>
          ) : (
            history.map((item, idx) => {
              const signalType = (item.signalType || (item as any).direction || 'BULLISH').toUpperCase();
              const isBull = signalType.includes('BULL');
              const entryPrice = item.entryPrice ?? (item as any).price ?? 0;
              const targetPrice = item.targetPrice ?? 0;
              const stopLossPrice = item.stopLossPrice ?? 0;
              const rvol = item.rvol ?? 1.0;
              const score = item.score ?? 0;
              const tier = item.tier || 'STRONG';
              const reasons = Array.isArray(item.reasons) ? item.reasons : [];

              return (
                <div
                  key={item.id || `hist_${idx}`}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isBull
                      ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
                      : 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-xl border mt-0.5 ${
                      isBull ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                    }`}>
                      {isBull ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black font-mono text-sm text-white">{item.symbol || 'NIFTY'}</span>
                        <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-black ${
                          isBull ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {score}% {tier}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-300" /> {item.timestamp || '--:--'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-300 font-mono">
                        <span>LTP: <strong className="text-white">₹{safeToFixed(entryPrice, 2)}</strong></span>
                        <span className="text-emerald-400 font-semibold">Tgt: ₹{safeToFixed(targetPrice, 2)}</span>
                        <span className="text-rose-400 font-semibold">SL: ₹{safeToFixed(stopLossPrice, 2)}</span>
                        <span className="text-amber-300">RVOL: {safeToFixed(rvol, 1)}x</span>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {reasons.map((r, rIdx) => (
                          <span key={rIdx} className="bg-slate-900 border border-slate-700 text-slate-400 text-[9px] px-1.5 py-0.2 rounded">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onSelectSymbolForChart(item.symbol);
                      onClose();
                    }}
                    className="self-end sm:self-center px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Chart</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 flex items-center justify-between">
          <button
            onClick={onClearHistory}
            disabled={history.length === 0}
            className="text-xs text-rose-400 hover:text-rose-300 disabled:text-slate-600 font-bold flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
