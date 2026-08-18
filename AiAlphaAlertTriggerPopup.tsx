import React, { useState, useEffect } from 'react';
import { AiAlphaAlertEvent, AiAlphaAlertConfig } from '../types';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  ShieldAlert,
  BarChart2,
  X,
  Copy,
  Check,
  Zap,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Minimize2,
  Maximize2,
  Settings2,
  ExternalLink
} from 'lucide-react';
import { openTradingViewChart } from '../utils/tradingView';

interface AiAlphaAlertTriggerPopupProps {
  alertEvent: AiAlphaAlertEvent | null;
  alertQueue?: AiAlphaAlertEvent[];
  onClose: () => void;
  onOpenChart: (symbol: string) => void;
  onSnooze: (symbol: string) => void;
  config?: AiAlphaAlertConfig;
  onUpdatePosition?: (pos: AiAlphaAlertConfig['position']) => void;
  onOpenSettings?: () => void;
}

const safeToFixed = (val: number | string | null | undefined, decimals = 2, fallback = '0.00'): string => {
  if (val === null || val === undefined) return fallback;
  const num = typeof val === 'number' ? val : Number(val);
  if (isNaN(num)) return fallback;
  return num.toFixed(decimals);
};

const safeDiff = (val1: number | string | null | undefined, val2: number | string | null | undefined, decimals = 2): string => {
  const n1 = typeof val1 === 'number' && !isNaN(val1) ? val1 : Number(val1) || 0;
  const n2 = typeof val2 === 'number' && !isNaN(val2) ? val2 : Number(val2) || 0;
  return (n1 - n2).toFixed(decimals);
};

const safeAbsDiff = (val1: number | string | null | undefined, val2: number | string | null | undefined, decimals = 2): string => {
  const n1 = typeof val1 === 'number' && !isNaN(val1) ? val1 : Number(val1) || 0;
  const n2 = typeof val2 === 'number' && !isNaN(val2) ? val2 : Number(val2) || 0;
  return Math.abs(n1 - n2).toFixed(decimals);
};

export const AiAlphaAlertTriggerPopup: React.FC<AiAlphaAlertTriggerPopupProps> = ({
  alertEvent,
  alertQueue = [],
  onClose,
  onOpenChart,
  onSnooze,
  config,
  onUpdatePosition,
  onOpenSettings
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Combine single alert or queue
  const alertsList = alertQueue.length > 0 ? alertQueue : alertEvent ? [alertEvent] : [];
  const rawAlert = alertsList[currentIndex] || alertEvent;

  const position = config?.position || 'RIGHT_TOAST';
  const autoDismissSec = config?.autoDismissSec ?? 12; // Default 12s non-blocking auto dismiss if configured

  // Reset index if queue changes
  useEffect(() => {
    if (alertsList.length > 0 && currentIndex >= alertsList.length) {
      setCurrentIndex(alertsList.length - 1);
    }
  }, [alertsList.length, currentIndex]);

  // Handle auto-dismiss progress safely
  useEffect(() => {
    if (!rawAlert || autoDismissSec <= 0) {
      setTimeLeft(0);
      return;
    }

    setTimeLeft(autoDismissSec);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (isHovered) return prev;
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [rawAlert?.id, autoDismissSec, isHovered]);

  // Auto-dismiss trigger when countdown finishes
  useEffect(() => {
    if (autoDismissSec > 0 && timeLeft === 0 && rawAlert && !isHovered) {
      const timer = setTimeout(() => {
        onClose();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, autoDismissSec, rawAlert?.id, isHovered, onClose]);

  if (!rawAlert) return null;

  // Normalized safe alert values to prevent any undefined access or crashes
  const currentAlert = {
    id: rawAlert.id || `alert_${Date.now()}`,
    symbol: rawAlert.symbol || 'NIFTY',
    stockName: rawAlert.stockName || rawAlert.symbol?.replace('.NS', '').replace('.BO', '') || '',
    score: typeof rawAlert.score === 'number' && !isNaN(rawAlert.score) ? rawAlert.score : 80,
    tier: rawAlert.tier || 'STRONG',
    signalType: (rawAlert.signalType || (rawAlert as any).direction || 'BULLISH').toUpperCase().includes('BEAR') ? 'BEARISH' : 'BULLISH',
    entryPrice: typeof rawAlert.entryPrice === 'number' && !isNaN(rawAlert.entryPrice) 
      ? rawAlert.entryPrice 
      : (typeof (rawAlert as any).price === 'number' && !isNaN((rawAlert as any).price) ? (rawAlert as any).price : 0),
    targetPrice: typeof rawAlert.targetPrice === 'number' && !isNaN(rawAlert.targetPrice) ? rawAlert.targetPrice : 0,
    stopLossPrice: typeof rawAlert.stopLossPrice === 'number' && !isNaN(rawAlert.stopLossPrice) ? rawAlert.stopLossPrice : 0,
    projectedMovePct: typeof rawAlert.projectedMovePct === 'number' && !isNaN(rawAlert.projectedMovePct) ? rawAlert.projectedMovePct : 1.5,
    reasons: Array.isArray(rawAlert.reasons) ? rawAlert.reasons : [],
    rvol: typeof rawAlert.rvol === 'number' && !isNaN(rawAlert.rvol) ? rawAlert.rvol : 1.0,
    timeframe: rawAlert.timeframe || '15m',
    timestamp: rawAlert.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    priceChangePct: typeof rawAlert.priceChangePct === 'number' && !isNaN(rawAlert.priceChangePct) ? rawAlert.priceChangePct : undefined
  };

  const isBull = currentAlert.signalType === 'BULLISH';

  const handleCopy = () => {
    const text = `🚨 AI ALPHA SIGNAL ALERT 🚨\nSymbol: ${currentAlert.symbol}\nType: ${currentAlert.signalType}\nAI Conviction Score: ${currentAlert.score}% (${currentAlert.tier})\nEntry Price: ₹${safeToFixed(currentAlert.entryPrice, 2)}\nTarget 1: ₹${safeToFixed(currentAlert.targetPrice, 2)} (+${safeToFixed(currentAlert.projectedMovePct, 2)}%)\nStop Loss: ₹${safeToFixed(currentAlert.stopLossPrice, 2)}\nTime: ${currentAlert.timestamp} (${currentAlert.timeframe})\nRVOL: ${safeToFixed(currentAlert.rvol, 1)}x\nConfluence Triggers: ${currentAlert.reasons.join(', ')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNextAlert = () => {
    if (currentIndex < alertsList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevAlert = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // 1. MINIMIZED FLOATING PILL STATE (Bottom-Right / Top-Right)
  if (isMinimized) {
    return (
      <aside aria-label="Alerts" className="fixed bottom-5 right-5 z-[60] animate-fadeIn pointer-events-auto">
        <div
          onClick={() => setIsMinimized(false)}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-2xl border-2 cursor-pointer transition-all hover:scale-105 ${
            isBull
              ? 'bg-slate-900/95 border-emerald-500 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.35)]'
              : 'bg-slate-900/95 border-rose-500 text-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.35)]'
          }`}
        >
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isBull ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isBull ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-sm text-white">{currentAlert.symbol}</span>
            <span className="font-mono font-bold text-xs bg-white/10 px-2 py-0.5 rounded text-amber-300">
              {currentAlert.score}% Score
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(false);
            }}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            title="Expand Alert Card"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    );
  }

  // 2. TOP-RIGHT COMPACT BANNER MODE
  if (position === 'TOP_RIGHT_COMPACT') {
    return (
      <aside aria-label="Alerts" className="fixed top-4 right-4 z-[60] max-w-sm sm:max-w-md w-[calc(100vw-2rem)] sm:w-[420px] pointer-events-auto animate-fadeIn">
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`rounded-xl shadow-2xl border transition-all overflow-hidden relative backdrop-blur-xl ${
            isBull
              ? 'bg-slate-900/95 border-emerald-500/80 shadow-[0_4px_30px_rgba(16,185,129,0.25)]'
              : 'bg-slate-900/95 border-rose-500/80 shadow-[0_4px_30px_rgba(244,63,94,0.25)]'
          }`}
        >
          <div className="p-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5 min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isBull ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isBull ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-black text-sm text-white truncate">{currentAlert.symbol}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${isBull ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                    {currentAlert.score}%
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  LTP: ₹{safeToFixed(currentAlert.entryPrice, 2)} • Tgt: ₹{safeToFixed(currentAlert.targetPrice, 2)} (+{safeToFixed(currentAlert.projectedMovePct, 2)}%)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => openTradingViewChart(currentAlert.symbol, currentAlert.timeframe === '5m' ? '5m' : '15m')}
                className="px-2 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 font-bold text-[10px] flex items-center gap-1 cursor-pointer font-mono shadow-sm active:scale-95"
                title="Open directly in TradingView in a new tab"
              >
                <ExternalLink className="w-3 h-3 text-blue-400" />
                <span>TV ↗</span>
              </button>

              <button
                onClick={() => {
                  onOpenChart(currentAlert.symbol);
                  onClose();
                }}
                className={`px-2.5 py-1.5 rounded-lg text-slate-950 font-black text-[11px] flex items-center gap-1 shadow cursor-pointer ${
                  isBull ? 'bg-emerald-400 hover:bg-emerald-300' : 'bg-rose-400 hover:bg-rose-300'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Chart</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Countdown timer bar */}
          {autoDismissSec > 0 && (
            <div className="w-full bg-slate-800 h-0.5">
              <div
                className={`h-full transition-all duration-1000 ${isBull ? 'bg-emerald-400' : 'bg-rose-400'}`}
                style={{ width: `${(timeLeft / autoDismissSec) * 100}%` }}
              />
            </div>
          )}
        </div>
      </aside>
    );
  }

  // 3. RIGHT SCREEN SLIDE-IN DRAWER MODE
  if (position === 'RIGHT_DRAWER') {
    return (
      <aside aria-label="Alerts" className="fixed top-0 right-0 h-full w-full max-w-[420px] z-[60] pointer-events-auto bg-slate-950/95 backdrop-blur-xl border-l-2 border-slate-800 shadow-2xl flex flex-col animate-fadeIn overflow-hidden text-slate-100">
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isBull 
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center space-x-2.5">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isBull ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isBull ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className="font-black text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              Live AI Signal Alert
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              title="Minimize to floating pill"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Queue Switcher */}
        {alertsList.length > 1 && (
          <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">
              Alert <strong className="text-white">{currentIndex + 1}</strong> of <strong className="text-white">{alertsList.length}</strong>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevAlert}
                disabled={currentIndex === 0}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNextAlert}
                disabled={currentIndex === alertsList.length - 1}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black font-mono text-white">{currentAlert.symbol}</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                  isBull ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  {isBull ? 'Bullish Long' : 'Bearish Short'}
                </span>
              </div>
              {currentAlert.stockName && (
                <div className="text-xs text-slate-400 mt-0.5">{currentAlert.stockName}</div>
              )}
              <div className="text-xs text-slate-300 font-mono mt-1">
                LTP: <strong className="text-white">₹{safeToFixed(currentAlert.entryPrice, 2)}</strong>
                {currentAlert.priceChangePct !== undefined && (
                  <span className={`ml-1 font-bold ${currentAlert.priceChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ({currentAlert.priceChangePct >= 0 ? '+' : ''}{safeToFixed(currentAlert.priceChangePct, 2)}%)
                  </span>
                )}
              </div>
            </div>

            <div className={`p-3 rounded-xl border text-center shrink-0 min-w-[80px] ${
              isBull ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
            }`}>
              <div className="text-[9px] font-bold uppercase text-amber-300 flex items-center justify-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Score
              </div>
              <div className="text-xl font-black font-mono">{currentAlert.score}%</div>
              <div className="text-[8px] font-bold uppercase">{currentAlert.tier}</div>
            </div>
          </div>

          {/* Trade Targets */}
          <div className="grid grid-cols-2 gap-2.5 bg-slate-900/80 border border-slate-800 rounded-xl p-3 font-mono">
            <div>
              <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <Target className="w-3 h-3" /> Target (+{safeToFixed(currentAlert.projectedMovePct, 2)}%)
              </div>
              <div className="text-base font-black text-emerald-300 mt-0.5">
                ₹{safeToFixed(currentAlert.targetPrice, 2)}
              </div>
              <div className="text-[9px] text-slate-400">
                +₹{safeDiff(currentAlert.targetPrice, currentAlert.entryPrice, 2)}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Stop Loss (-1%)
              </div>
              <div className="text-base font-black text-rose-300 mt-0.5">
                ₹{safeToFixed(currentAlert.stopLossPrice, 2)}
              </div>
              <div className="text-[9px] text-slate-400">
                -₹{safeAbsDiff(currentAlert.entryPrice, currentAlert.stopLossPrice, 2)}
              </div>
            </div>
          </div>

          {/* Triggers */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-between">
              <span>AI Confluence Triggers</span>
              <span className="text-amber-300 font-mono">RVOL {safeToFixed(currentAlert.rvol, 1)}x</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {currentAlert.reasons.map((r, i) => (
                <span key={i} className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 flex items-center gap-1">
                  <span className={isBull ? 'text-emerald-400' : 'text-rose-400'}>•</span>
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={() => onSnooze(currentAlert.symbol)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
            >
              Snooze
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end">
            <button
              onClick={() => openTradingViewChart(currentAlert.symbol, currentAlert.timeframe === '5m' ? '5m' : '15m')}
              className="py-2 px-2.5 rounded-xl font-bold text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 flex items-center justify-center gap-1 cursor-pointer font-mono active:scale-95"
              title="Open full interactive chart on TradingView"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span>TV ↗</span>
            </button>

            <button
              onClick={() => {
                onOpenChart(currentAlert.symbol);
                onClose();
              }}
              className={`py-2 px-3 rounded-xl font-black text-xs text-slate-950 flex items-center justify-center gap-1.5 shadow-lg cursor-pointer ${
                isBull ? 'bg-emerald-400 hover:bg-emerald-300' : 'bg-rose-400 hover:bg-rose-300'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Open Chart</span>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // 4. CENTER MODAL (If user explicitly configured center modal)
  if (position === 'CENTER_MODAL') {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn pointer-events-auto">
        <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border-2 transition-all relative flex flex-col ${
          isBull 
            ? 'bg-slate-900 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.35)]' 
            : 'bg-slate-900 border-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.35)]'
        }`}>
          {/* Header */}
          <div className={`p-4 flex items-center justify-between border-b ${
            isBull 
              ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-emerald-500/40 text-emerald-300' 
              : 'bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border-rose-500/40 text-rose-300'
          }`}>
            <div className="flex items-center space-x-2.5">
              <span className="relative flex h-3.5 w-3.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isBull ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${isBull ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </span>
              <span className="font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 text-white">
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
                AI Alpha Signal Alert Triggered!
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {onUpdatePosition && (
                <button
                  onClick={() => onUpdatePosition('RIGHT_TOAST')}
                  className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  title="Switch to Right-Screen Toast"
                >
                  <ArrowRight className="w-3 h-3 text-emerald-400" />
                  <span>Dock Right</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 sm:p-6 space-y-4 text-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                    {currentAlert.symbol}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 border ${
                    isBull 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' 
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                  }`}>
                    {isBull ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {isBull ? 'Bullish Long' : 'Bearish Short'}
                  </span>
                </div>
                {currentAlert.stockName && (
                  <div className="text-xs text-slate-400 font-sans mt-0.5">{currentAlert.stockName}</div>
                )}
                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-300 font-mono">
                  <span>LTP: <strong className="text-white text-sm">₹{safeToFixed(currentAlert.entryPrice, 2)}</strong></span>
                  {currentAlert.priceChangePct !== undefined && (
                    <span className={`font-bold ${currentAlert.priceChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ({currentAlert.priceChangePct >= 0 ? '+' : ''}{safeToFixed(currentAlert.priceChangePct, 2)}%)
                    </span>
                  )}
                  <span className="text-slate-500">|</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3 text-amber-300" />
                    {currentAlert.timestamp} ({currentAlert.timeframe})
                  </span>
                </div>
              </div>

              <div className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center shrink-0 min-w-[90px] shadow-lg ${
                isBull 
                  ? 'bg-emerald-950/80 border-emerald-400/50 text-emerald-300' 
                  : 'bg-rose-950/80 border-rose-400/50 text-rose-300'
              }`}>
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  <Sparkles className="w-3 h-3" /> Score
                </div>
                <div className="text-2xl font-black font-mono leading-none mt-1">
                  {currentAlert.score}%
                </div>
                <div className="text-[9px] font-extrabold uppercase mt-0.5 tracking-wider bg-white/10 px-1.5 py-0.2 rounded">
                  {currentAlert.tier}
                </div>
              </div>
            </div>

            {/* Target & Stop Loss Levels */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 font-mono">
              <div className="border-r border-slate-800/80 pr-2">
                <div className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" /> Target (+{safeToFixed(currentAlert.projectedMovePct, 2)}%)
                </div>
                <div className="text-lg font-black text-emerald-300 mt-0.5">
                  ₹{safeToFixed(currentAlert.targetPrice, 2)}
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  Gain: +₹{safeDiff(currentAlert.targetPrice, currentAlert.entryPrice, 2)}
                </div>
              </div>

              <div className="pl-2">
                <div className="text-[10px] text-rose-400 uppercase font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Stop Loss (-1.0%)
                </div>
                <div className="text-lg font-black text-rose-300 mt-0.5">
                  ₹{safeToFixed(currentAlert.stopLossPrice, 2)}
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  Risk: -₹{safeAbsDiff(currentAlert.entryPrice, currentAlert.stopLossPrice, 2)}
                </div>
              </div>
            </div>

            {/* Reasons */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>AI Confluence Triggers</span>
                <span className="text-amber-300 font-mono text-[10px] font-extrabold">RVOL {safeToFixed(currentAlert.rvol, 1)}x</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {currentAlert.reasons.map((r, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-[11px] font-sans font-semibold bg-slate-800 border border-slate-700 text-slate-200 shadow-sm flex items-center gap-1">
                    <span className={isBull ? 'text-emerald-400' : 'text-rose-400'}>•</span>
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-950 border-t border-slate-800 p-4 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={() => onSnooze(currentAlert.symbol)}
                className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs px-3 py-2 rounded-xl font-medium border border-slate-800 transition-colors cursor-pointer"
              >
                Snooze 10m
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Dismiss
              </button>

              <button
                onClick={() => openTradingViewChart(currentAlert.symbol, currentAlert.timeframe === '5m' ? '5m' : '15m')}
                className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="Open directly in TradingView in a new tab"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                <span>TradingView ↗</span>
              </button>

              <button
                onClick={() => {
                  onOpenChart(currentAlert.symbol);
                  onClose();
                }}
                className={`px-4 py-2 rounded-xl font-black text-xs text-slate-950 transition-all flex items-center gap-1.5 shadow-lg cursor-pointer ${
                  isBull ? 'bg-emerald-400 hover:bg-emerald-300' : 'bg-rose-400 hover:bg-rose-300'
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                <span>Open Chart</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. DEFAULT: RIGHT SCREEN FLOATING TOAST NOTIFICATION CARD ('RIGHT_TOAST')
  // Floats gracefully in the top-right / right side without blocking user interaction behind it
  return (
    <aside aria-label="Alerts" className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[60] max-w-sm sm:max-w-[440px] w-[calc(100vw-2rem)] sm:w-[440px] pointer-events-auto animate-fadeIn">
      {/* Toast Wrapper Card with Glowing Border */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`rounded-2xl shadow-2xl overflow-hidden border-2 transition-all flex flex-col backdrop-blur-2xl ${
          isBull
            ? 'bg-slate-900/95 border-emerald-500 shadow-[0_10px_40px_rgba(16,185,129,0.3)]'
            : 'bg-slate-900/95 border-rose-500 shadow-[0_10px_40px_rgba(244,63,94,0.3)]'
        }`}
      >
        {/* Top Floating Alert Banner */}
        <div
          className={`px-3.5 py-2.5 flex items-center justify-between border-b ${
            isBull
              ? 'bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border-emerald-500/40 text-emerald-300'
              : 'bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/90 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isBull ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isBull ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className="font-black text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
              Right-Screen Signal Alert
            </span>

            {/* Queue Counter if multiple alerts */}
            {alertsList.length > 1 && (
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono font-bold text-amber-300 border border-slate-700">
                {currentIndex + 1}/{alertsList.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {alertsList.length > 1 && (
              <div className="flex items-center gap-0.5 mr-1">
                <button
                  onClick={handlePrevAlert}
                  disabled={currentIndex === 0}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 cursor-pointer"
                  title="Previous Alert"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleNextAlert}
                  disabled={currentIndex === alertsList.length - 1}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 cursor-pointer"
                  title="Next Alert"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Minimize to Right Screen Pill"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>

            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Alert Settings"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Dismiss Alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3 text-slate-100 text-xs">
          {/* Main Stock & Conviction Score Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight truncate">
                  {currentAlert.symbol}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                    isBull
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                  }`}
                >
                  {isBull ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isBull ? 'Bullish' : 'Bearish'}
                </span>
              </div>
              {currentAlert.stockName && (
                <div className="text-[11px] text-slate-400 truncate mt-0.5">{currentAlert.stockName}</div>
              )}
              <div className="flex items-center gap-2 mt-1 font-mono text-[11px] text-slate-300">
                <span>
                  LTP: <strong className="text-white text-xs font-bold">₹{safeToFixed(currentAlert.entryPrice, 2)}</strong>
                </span>
                {currentAlert.priceChangePct !== undefined && (
                  <span className={`font-bold ${currentAlert.priceChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ({currentAlert.priceChangePct >= 0 ? '+' : ''}{safeToFixed(currentAlert.priceChangePct, 2)}%)
                  </span>
                )}
                <span className="text-slate-600">|</span>
                <span className="flex items-center gap-1 text-slate-400 text-[10px]">
                  <Clock className="w-3 h-3 text-amber-300" />
                  {currentAlert.timestamp}
                </span>
              </div>
            </div>

            {/* Score Badge */}
            <div
              className={`p-2.5 rounded-xl border text-center shrink-0 min-w-[78px] shadow-md flex flex-col items-center justify-center ${
                isBull
                  ? 'bg-emerald-950/80 border-emerald-400/50 text-emerald-300'
                  : 'bg-rose-950/80 border-rose-400/50 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-amber-300">
                <Sparkles className="w-2.5 h-2.5" /> Score
              </div>
              <div className="text-xl font-black font-mono leading-tight mt-0.5">
                {currentAlert.score}%
              </div>
              <div className="text-[8px] font-extrabold uppercase tracking-wider bg-white/10 px-1.5 py-0.2 rounded mt-0.5">
                {currentAlert.tier}
              </div>
            </div>
          </div>

          {/* Quick Target & Stop Loss Levels */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 font-mono">
            <div className="border-r border-slate-800/80 pr-1.5">
              <div className="text-[9px] text-emerald-400 font-bold uppercase flex items-center gap-1">
                <Target className="w-3 h-3" /> Target (+{safeToFixed(currentAlert.projectedMovePct, 2)}%)
              </div>
              <div className="text-sm font-black text-emerald-300 mt-0.5">
                ₹{safeToFixed(currentAlert.targetPrice, 2)}
              </div>
              <div className="text-[9px] text-slate-400 font-sans">
                Gain: +₹{safeDiff(currentAlert.targetPrice, currentAlert.entryPrice, 2)}
              </div>
            </div>

            <div className="pl-1.5">
              <div className="text-[9px] text-rose-400 font-bold uppercase flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Stop Loss (-1.0%)
              </div>
              <div className="text-sm font-black text-rose-300 mt-0.5">
                ₹{safeToFixed(currentAlert.stopLossPrice, 2)}
              </div>
              <div className="text-[9px] text-slate-400 font-sans">
                Risk: -₹{safeAbsDiff(currentAlert.entryPrice, currentAlert.stopLossPrice, 2)}
              </div>
            </div>
          </div>

          {/* Confluence Triggers */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Triggers</span>
              <span className="text-amber-300 font-mono text-[10px]">RVOL {safeToFixed(currentAlert.rvol, 1)}x</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {currentAlert.reasons.slice(0, 3).map((r, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-800/90 border border-slate-700 text-slate-200 flex items-center gap-1 font-medium"
                >
                  <span className={isBull ? 'text-emerald-400' : 'text-rose-400'}>•</span>
                  {r}
                </span>
              ))}
              {currentAlert.reasons.length > 3 && (
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400">
                  +{currentAlert.reasons.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-950/90 border-t border-slate-800 p-2.5 px-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
              title="Copy Signal"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={() => onSnooze(currentAlert.symbol)}
              className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] px-2.5 py-1.5 rounded-lg font-medium border border-slate-800 transition-colors cursor-pointer"
              title="Snooze for 10 minutes"
            >
              Snooze 10m
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => openTradingViewChart(currentAlert.symbol, currentAlert.timeframe === '5m' ? '5m' : '15m')}
              className="px-2 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[11px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
              title="Open full chart on TradingView"
            >
              <ExternalLink className="w-3 h-3 text-blue-400" />
              <span>TV ↗</span>
            </button>

            <button
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
            >
              Dismiss
            </button>

            <button
              onClick={() => {
                onOpenChart(currentAlert.symbol);
                onClose();
              }}
              className={`px-3 py-1.5 rounded-lg font-black text-[11px] text-slate-950 transition-all flex items-center gap-1 shadow-lg cursor-pointer ${
                isBull ? 'bg-emerald-400 hover:bg-emerald-300' : 'bg-rose-400 hover:bg-rose-300'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Open Chart</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Auto-Dismiss Countdown Line (Paused on hover) */}
        {autoDismissSec > 0 && (
          <div className="w-full bg-slate-800 h-1 relative overflow-hidden" title={isHovered ? 'Paused on Hover' : `Auto-dismiss in ${timeLeft}s`}>
            <div
              className={`h-full transition-all duration-1000 ${isBull ? 'bg-emerald-400' : 'bg-rose-400'}`}
              style={{ width: `${(timeLeft / autoDismissSec) * 100}%` }}
            />
          </div>
        )}
      </div>
    </aside>
  );
};
