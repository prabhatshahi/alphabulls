import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  X,
  ExternalLink,
  Zap,
  BarChart2,
  Layers,
  ArrowRight,
  RefreshCw,
  Award,
  Clock,
  Activity,
  GitCommit,
  Network
} from 'lucide-react';
import { AiConfluenceAuditResult, PerfectConfluenceItem } from '../types';
import { openTradingViewChart } from '../utils/tradingView';

interface AiConfluenceAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockItem: PerfectConfluenceItem | null;
  timeframe: '5m' | '15m';
  onOpenChartModal?: (symbol: string) => void;
}

export const AiConfluenceAuditModal: React.FC<AiConfluenceAuditModalProps> = ({
  isOpen,
  onClose,
  stockItem,
  timeframe,
  onOpenChartModal
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<AiConfluenceAuditResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch or trigger audit when modal opens or stock changes
  React.useEffect(() => {
    if (!isOpen || !stockItem) {
      setAuditResult(null);
      setError(null);
      return;
    }

    const fetchAudit = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/ai-confluence-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stock: stockItem.stock,
            confluenceData: stockItem,
            timeframe
          })
        });

        if (!res.ok) {
          throw new Error(`AI Analysis failed with status HTTP ${res.status}`);
        }

        const data: AiConfluenceAuditResult = await res.json();
        setAuditResult(data);
      } catch (err: any) {
        console.error('Audit fetch error:', err);
        setError(err.message || 'Failed to complete AI Audit');
      } finally {
        setLoading(false);
      }
    };

    fetchAudit();
  }, [isOpen, stockItem?.stock.symbol, timeframe]);

  if (!isOpen || !stockItem) return null;

  const isBull = stockItem.bias === 'BULLISH';
  const symbol = stockItem.stock.symbol;
  const cleanName = symbol.replace('.NS', '').replace('.BO', '');
  const price = stockItem.stock.latestPrice || 100;

  const handleCopyBlueprint = () => {
    if (!auditResult) return;
    const text = `🎯 [AI CONFLUENCE TRADE BLUEPRINT: ${cleanName}]
Bias: ${auditResult.bias} (${auditResult.confluenceGrade})
AI Confidence: ${auditResult.aiConfidenceScore}%
LTP: ₹${price.toFixed(2)} (${(stockItem.stock.priceChangePct || 0) > 0 ? '+' : ''}${stockItem.stock.priceChangePct}%)
Entry Trigger: ${auditResult.executionBlueprint.entryTrigger}
Stop Loss: ${auditResult.executionBlueprint.stopLoss}
Target 1: ${auditResult.executionBlueprint.target1}
Target 2: ${auditResult.executionBlueprint.target2}
RRR: ${auditResult.executionBlueprint.riskRewardRatio}
Invalidation Rule: ${auditResult.executionBlueprint.tradeInvalidationRule}

Executive Thesis:
${auditResult.executiveSummary}

Institutional Footprint:
${auditResult.institutionalFootprint}

Checklist:
${auditResult.tradeChecklist.map((c, i) => `${i + 1}. ${c}`).join('\n')}
`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8">
        
        {/* TOP ACCENT BAR */}
        <div className={`h-1.5 w-full ${isBull ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500' : 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500'}`} />

        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className={`p-3 rounded-xl border ${isBull ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]'}`}>
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
                  {cleanName}
                  <span className="text-xs font-mono font-normal text-slate-400 px-2 py-0.5 bg-slate-800 rounded border border-slate-700">
                    {timeframe}
                  </span>
                </h2>

                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                  stockItem.grade === 'A+++'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : isBull
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                }`}>
                  <Award className="w-3.5 h-3.5" />
                  GRADE {stockItem.grade} (PERFECT SETUP)
                </span>

                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${isBull ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' : 'bg-rose-950/60 text-rose-300 border-rose-500/30'}`}>
                  {isBull ? '🚀 BULLISH CONFLUENCE' : '📉 BEARISH CONFLUENCE'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                <span>LTP: <strong className="text-slate-200">₹{price.toFixed(2)}</strong> ({(stockItem.stock.priceChangePct || 0) > 0 ? '+' : ''}{stockItem.stock.priceChangePct}%)</span>
                <span>•</span>
                <span>Sector: <strong className="text-cyan-300">{stockItem.sectorName}</strong> ({stockItem.sectorChangePct > 0 ? '+' : ''}{stockItem.sectorChangePct}%)</span>
                <span>•</span>
                <span className="text-amber-400 font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Added: {stockItem.signalTime} ({stockItem.elapsedMinutesText})
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[72vh] overflow-y-auto">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-amber-400 animate-spin" />
                <Sparkles className="w-6 h-6 text-amber-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-slate-200">Synthesizing Gemini AI Multi-Pillar Confluence...</p>
                <p className="text-xs text-slate-400 mt-1">Cross-referencing ADR (14), CPR, VWAP, RVOL Climax, CVD, and Sector Tide...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold">AI Diagnostics Notice</p>
                <p className="text-xs text-rose-400">{error}</p>
              </div>
            </div>
          ) : auditResult ? (
            <>
              {/* AI VERDICT BANNER */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 relative overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-300">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Institutional AI Alpha Rating</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {auditResult.aiConfidenceScore}% AI Conviction
                    </div>
                    {auditResult.isAiGenerated && (
                      <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 bg-cyan-950/60 border border-cyan-800 rounded">
                        Powered by Gemini 3.7 Flash
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm sm:text-base text-slate-200 font-medium leading-relaxed">
                  {auditResult.executiveSummary}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
                    <span className="text-amber-400 font-bold flex items-center gap-1.5 mb-1">
                      <BarChart2 className="w-3.5 h-3.5" /> Smart Money Footprint:
                    </span>
                    <p className="text-slate-300">{auditResult.institutionalFootprint}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
                    <span className="text-cyan-400 font-bold flex items-center gap-1.5 mb-1">
                      <Layers className="w-3.5 h-3.5" /> Pattern & Confluence Matrix:
                    </span>
                    <p className="text-slate-300">{auditResult.patternThesis}</p>
                  </div>
                </div>
              </div>

              {/* 10-PILLAR CONFLUENCE STATUS GRID */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  10-Pillar Confluence Validation Matrix ({stockItem.activePillarsCount}/{stockItem.totalPillarsCount} Pillars Active)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {stockItem.pillars.map((pillar) => (
                    <div
                      key={pillar.id}
                      className={`p-2.5 rounded-xl border flex items-start space-x-2.5 text-xs transition-all ${
                        pillar.status === 'ACTIVE'
                          ? pillar.type === 'BULL'
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-slate-200'
                            : 'bg-rose-950/30 border-rose-500/40 text-slate-200'
                          : 'bg-slate-950/40 border-slate-800/80 text-slate-500 opacity-60'
                      }`}
                    >
                      <span className="text-base shrink-0 mt-0.5">{pillar.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold truncate">{pillar.label}</span>
                          {pillar.status === 'ACTIVE' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <span className="text-[10px] text-slate-500">Pending</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{pillar.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CORRELATION & MULTI-TIMEFRAME HARMONY MATRIX */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                    <Network className="w-3.5 h-3.5 text-cyan-400" />
                    Market Correlation & Beta Harmony Radar
                  </h4>
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                    stockItem.correlation?.correlationRating === 'HIGH CORRELATION'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : stockItem.correlation?.correlationRating === 'DECOUPLED LEADER'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                  }`}>
                    {stockItem.correlation?.correlationRating || 'HIGH CORRELATION'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-mono block">NIFTY/Index $\rho$</span>
                    <span className={`text-xs sm:text-sm font-black ${
                      (stockItem.correlation?.indexCorrelation || 0) >= 0.7
                        ? 'text-emerald-400'
                        : (stockItem.correlation?.indexCorrelation || 0) < 0
                        ? 'text-rose-400'
                        : 'text-amber-400'
                    }`}>
                      {(stockItem.correlation?.indexCorrelation || 0) > 0 ? '+' : ''}
                      {(stockItem.correlation?.indexCorrelation || 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono">Beta {stockItem.correlation?.indexBeta || 1.2}x</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-mono block">Sector Basket Sync</span>
                    <span className="text-xs sm:text-sm font-black text-cyan-400">
                      +{(stockItem.correlation?.sectorCorrelation || 0.92).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono">{stockItem.sectorName}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-mono block">Volume-Price Delta</span>
                    <span className="text-xs sm:text-sm font-black text-amber-400">
                      +{(stockItem.correlation?.volumePriceCorrelation || 0.81).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono">CVD / Price Sync</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-mono block">MTF Harmony (5m/15m/1D)</span>
                    <span className="text-xs sm:text-sm font-black text-purple-400">
                      {stockItem.correlation?.multiTimeframeSync || '3/3 ALIGNED'}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono">Trend Sync</span>
                  </div>
                </div>

                {auditResult.correlationInsights && (
                  <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-xs space-y-1 text-slate-300">
                    <p><strong className="text-cyan-400">Index & Beta:</strong> {auditResult.correlationInsights.indexBetaAnalysis}</p>
                    <p><strong className="text-cyan-400">Sector Leader:</strong> {auditResult.correlationInsights.sectorBasketSync}</p>
                  </div>
                )}
              </div>

              {/* TRADE BLUEPRINT & KEY LEVELS */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-wider text-amber-300 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    Exact Execution Blueprint & Trade Plan
                  </span>
                  <span className="text-cyan-400 font-bold">RRR: {auditResult.executionBlueprint.riskRewardRatio}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400 font-mono block mb-1">🎯 Entry Trigger</span>
                    <p className="text-xs font-bold text-slate-100">{auditResult.executionBlueprint.entryTrigger}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-rose-400 font-mono block mb-1">🛡️ Invalidation Stop Loss</span>
                    <p className="text-xs font-bold text-rose-300">{auditResult.executionBlueprint.stopLoss}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-emerald-400 font-mono block mb-1">🚀 Target 1 (Quick Lock)</span>
                    <p className="text-xs font-bold text-emerald-300">{auditResult.executionBlueprint.target1}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-cyan-400 font-mono block mb-1">💎 Target 2 (Runner)</span>
                    <p className="text-xs font-bold text-cyan-300">{auditResult.executionBlueprint.target2}</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Trade Invalidation Rule: </strong>
                    <span>{auditResult.executionBlueprint.tradeInvalidationRule}</span>
                  </div>
                </div>
              </div>

              {/* EXECUTION CHECKLIST & RISK RADAR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CHECKLIST */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                  <h5 className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    4-Point Trade Execution Rules
                  </h5>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {auditResult.tradeChecklist.map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* RISK RADAR */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                  <h5 className="text-xs font-mono uppercase tracking-wider text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Potential Traps & Risk Warnings
                  </h5>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {auditResult.riskWarnings.map((warning, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-rose-200/90">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                        <span>{warning}</span>
                      </li>
                    ))}
                    <li className="flex items-start gap-2 text-cyan-300 pt-1 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1 shrink-0" />
                      <span>{auditResult.sectorContext}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => openTradingViewChart(symbol)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition-all flex items-center gap-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              TradingView Chart
            </button>
            {onOpenChartModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenChartModal(symbol);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition-all flex items-center gap-2"
              >
                <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
                In-App Chart
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyBlueprint}
              disabled={!auditResult}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Blueprint Copied!' : 'Copy Trade Blueprint'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
