import React, { useState, useRef, useEffect } from 'react';
import {
  SentimentAnalysisResult,
  extractSentimentFromReasons,
  SentimentFactor
} from '../utils/sentimentAnalysis';
import { StockScanStatus } from '../types';
import { Sparkles, TrendingUp, TrendingDown, HelpCircle, ShieldCheck, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';

interface SentimentGaugeProps {
  reasons?: string[];
  stock?: Partial<StockScanStatus>;
  signalType?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  variant?: 'compact' | 'badge' | 'full' | 'inline-bar';
  showTooltip?: boolean;
  className?: string;
  onClick?: () => void;
}

export const SentimentGauge: React.FC<SentimentGaugeProps> = ({
  reasons = [],
  stock,
  signalType,
  variant = 'compact',
  showTooltip = true,
  className = '',
  onClick
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute sentiment result using NLP & factor analysis
  const sentiment: SentimentAnalysisResult = React.useMemo(() => {
    return extractSentimentFromReasons(reasons, stock, signalType);
  }, [reasons, stock, signalType]);

  const handleMouseEnter = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPopoverCoords({
        top: rect.bottom + window.scrollY + 6,
        left: Math.min(window.innerWidth - 320, Math.max(16, rect.left + window.scrollX - 120))
      });
    }
    setIsHovered(true);
  };

  const isBull = sentiment.bias === 'BULLISH';
  const isBear = sentiment.bias === 'BEARISH';
  const isNeutral = sentiment.bias === 'NEUTRAL';

  // SVG Gauge calculations for semi-circle
  const radius = 32;
  const circumference = Math.PI * radius; // 180 deg arc
  const strokeDashoffset = circumference - (sentiment.score / 100) * circumference;

  // Render Compact Table Cell version
  if (variant === 'compact') {
    return (
      <div
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        className={`relative inline-flex flex-col gap-1 select-none ${onClick ? 'cursor-pointer' : 'cursor-default'} ${className}`}
      >
        {/* Top Mini Pill & Score */}
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-black border transition-all ${sentiment.badgeColor}`}
          >
            {isBull && <TrendingUp className="w-2.5 h-2.5 text-emerald-400 shrink-0" />}
            {isBear && <TrendingDown className="w-2.5 h-2.5 text-rose-400 shrink-0" />}
            {isNeutral && <Activity className="w-2.5 h-2.5 text-slate-400 shrink-0" />}
            <span>{sentiment.score}% {isBull ? 'BULL' : isBear ? 'BEAR' : 'NEUT'}</span>
          </span>
        </div>

        {/* Mini Gradient Bar Indicator */}
        <div className="w-18 h-1.5 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700/60 flex">
          {/* Bearish Zone (0-40%) */}
          <div className="h-full bg-rose-500/80" style={{ width: `${Math.max(0, Math.min(50, 100 - sentiment.score))}%` }} />
          {/* Bullish Zone (60-100%) */}
          <div className="h-full bg-emerald-500/80 ml-auto" style={{ width: `${Math.max(0, Math.min(50, sentiment.score - 50)) * 2}%` }} />
          
          {/* Active Needle Marker */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_4px_white] rounded-full transition-all duration-300 transform -translate-x-1/2"
            style={{ left: `${sentiment.score}%` }}
          />
        </div>

        {/* Floating NLP Reasoning Tooltip */}
        {showTooltip && isHovered && (
          <div
            className="fixed z-50 w-72 p-3 rounded-xl bg-slate-950/95 border border-slate-700 shadow-2xl backdrop-blur-md text-xs font-sans animate-fadeIn space-y-2.5 pointer-events-none"
            style={{ top: `${popoverCoords.top}px`, left: `${popoverCoords.left}px` }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold text-slate-200">AI Sentiment Engine</span>
              </div>
              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${sentiment.badgeColor}`}>
                {sentiment.label}
              </span>
            </div>

            {/* Score Metric Row */}
            <div className="flex items-center justify-between text-xs bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 block">Composite Score</span>
                <span className={`text-base font-black font-mono ${sentiment.textColor}`}>
                  {sentiment.score}/100
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">AI Confidence</span>
                <span className="text-[11px] font-bold text-slate-200 font-mono">
                  {sentiment.confidence} ({sentiment.factors.length} Triggers)
                </span>
              </div>
            </div>

            {/* Factors Breakdown */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Contributing Alert Reasons:
              </span>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {sentiment.factors.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">No direct trigger keywords identified.</p>
                ) : (
                  sentiment.factors.map((f, idx) => (
                    <div
                      key={idx}
                      className={`text-[11px] p-1.5 rounded flex items-start justify-between gap-1.5 border ${
                        f.polarity === 'BULLISH'
                          ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-300'
                          : f.polarity === 'BEARISH'
                          ? 'bg-rose-950/40 border-rose-500/20 text-rose-300'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-1">
                        {f.polarity === 'BULLISH' ? (
                          <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <span>{f.text}</span>
                      </div>
                      <span className="text-[9px] font-mono opacity-70 shrink-0 font-bold">
                        +{f.weight}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Summary sentence */}
            <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/80 leading-relaxed">
              {sentiment.summary}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Render Full Radial Gauge version
  return (
    <div
      ref={containerRef}
      className={`p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-bold text-slate-200">AI Alert Sentiment Score</h4>
        </div>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${sentiment.badgeColor}`}>
          {sentiment.label}
        </span>
      </div>

      {/* Semi-Circular Radial Dial */}
      <div className="relative flex flex-col items-center justify-center pt-2">
        <svg className="w-36 h-20" viewBox="0 0 80 45">
          {/* Background Track Arc */}
          <path
            d="M 8 40 A 32 32 0 0 1 72 40"
            fill="none"
            stroke="#1e293b"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Colored Gradient / Progress Arc */}
          <path
            d="M 8 40 A 32 32 0 0 1 72 40"
            fill="none"
            stroke={isBull ? '#10b981' : isBear ? '#f43f5e' : '#94a3b8'}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Display Value */}
        <div className="absolute top-8 flex flex-col items-center">
          <span className={`text-xl font-black font-mono leading-none ${sentiment.textColor}`}>
            {sentiment.score}%
          </span>
          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">
            {isBull ? 'Bullish Dominance' : isBear ? 'Bearish Dominance' : 'Neutral Range'}
          </span>
        </div>

        {/* Gauge Scale Labels */}
        <div className="w-full flex justify-between px-2 text-[9px] font-mono text-slate-500 font-bold -mt-2">
          <span className="text-rose-400">0% Bear</span>
          <span className="text-slate-400">50% Neutral</span>
          <span className="text-emerald-400">100% Bull</span>
        </div>
      </div>

      {/* Extracted Reasons List */}
      {sentiment.factors.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Parsed Reason Triggers ({sentiment.factors.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {sentiment.factors.map((f, idx) => (
              <span
                key={idx}
                className={`text-[10px] px-2 py-0.5 rounded-md font-medium border inline-flex items-center gap-1 ${
                  f.polarity === 'BULLISH'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : f.polarity === 'BEARISH'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                {f.polarity === 'BULLISH' && <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />}
                {f.polarity === 'BEARISH' && <TrendingDown className="w-2.5 h-2.5 text-rose-400" />}
                {f.text}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
