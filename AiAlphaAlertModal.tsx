import React from 'react';
import { AiAlphaAlertConfig } from '../types';
import {
  Bell,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  TrendingUp,
  TrendingDown,
  X,
  Play,
  MonitorCheck,
  Clock
} from 'lucide-react';
import { playBullishAlertSound, playBearishAlertSound, playTestBeep } from '../utils/soundAlert';

interface AiAlphaAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AiAlphaAlertConfig;
  onSaveConfig: (newConfig: AiAlphaAlertConfig) => void;
  onTriggerTestAlert: () => void;
}

export const AiAlphaAlertModal: React.FC<AiAlphaAlertModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onTriggerTestAlert
}) => {
  const [localConfig, setLocalConfig] = React.useState<AiAlphaAlertConfig>(config);
  const [savedFeedback, setSavedFeedback] = React.useState<boolean>(false);

  React.useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  if (!isOpen) return null;

  const handleScorePreset = (score: number) => {
    setLocalConfig(prev => ({ ...prev, minScore: score, enabled: true }));
  };

  const handleSave = () => {
    onSaveConfig(localConfig);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 600);
  };

  const requestBrowserPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setLocalConfig(prev => ({ ...prev, browserNotifications: true }));
      } else {
        alert('Notification permission was denied or dismissed.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-b border-emerald-500/30 p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shadow-inner">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide text-white uppercase flex items-center gap-2">
                Configure AI Alpha Score Alerts
              </h2>
              <p className="text-xs text-slate-300">
                Instantly trigger sound & popups when AI Conviction reaches your score threshold
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* Master Enable Toggle */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${localConfig.enabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-500'}`}>
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-slate-100">Live AI Alert Engine</div>
                <div className="text-[11px] text-slate-400">
                  {localConfig.enabled ? 'Active: scanning every live tick for qualifying scores' : 'Alerts are currently paused'}
                </div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.enabled}
                onChange={e => setLocalConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* 1. SCORE THRESHOLD SECTION */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Minimum AI Conviction Score Threshold
              </label>
              <div className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-3 py-1 rounded-lg font-mono font-black text-sm">
                ≥ {localConfig.minScore}%
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={60}
              max={98}
              step={1}
              value={localConfig.minScore}
              onChange={e => setLocalConfig(prev => ({ ...prev, minScore: Number(e.target.value) }))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />

            {/* Quick Preset Buttons */}
            <div className="flex items-center justify-between gap-1.5 pt-1">
              {[70, 75, 80, 85, 90, 95].map(preset => (
                <button
                  key={preset}
                  onClick={() => handleScorePreset(preset)}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-mono font-bold text-[11px] transition-all cursor-pointer ${
                    localConfig.minScore === preset
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-md scale-105'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400">
              💡 Recommended: <strong className="text-emerald-300">80%</strong> for high volume breakouts, <strong className="text-amber-300">88%+</strong> for ultra high-conviction institutional flow.
            </p>
          </div>

          {/* 2. DIRECTION FILTER SECTION */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <label className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              Signal Direction Filter
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setLocalConfig(prev => ({ ...prev, direction: 'ALL' }))}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  localConfig.direction === 'ALL'
                    ? 'bg-slate-800 text-white border-slate-500 shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-850'
                }`}
              >
                <span>⚡ All Signals</span>
              </button>

              <button
                onClick={() => setLocalConfig(prev => ({ ...prev, direction: 'BULLISH' }))}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  localConfig.direction === 'BULLISH'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-850'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bullish Longs</span>
              </button>

              <button
                onClick={() => setLocalConfig(prev => ({ ...prev, direction: 'BEARISH' }))}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  localConfig.direction === 'BEARISH'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-850'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                <span>Bearish Shorts</span>
              </button>
            </div>
          </div>

          {/* 3. TIMEFRAME FILTER SECTION */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Alert Timeframe Target
              </label>
              <span className="text-[10px] text-amber-300 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                {localConfig.timeframe === '5m' ? '5-Min Fast Intraday' : localConfig.timeframe === '15m' ? '15-Min Primary ADR' : 'Both 5m & 15m Timeframes'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setLocalConfig(prev => ({ ...prev, timeframe: 'ALL' }))}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  (localConfig.timeframe || 'ALL') === 'ALL'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-850'
                }`}
              >
                <span>🕒 All (5m & 15m)</span>
              </button>

              <button
                onClick={() => setLocalConfig(prev => ({ ...prev, timeframe: '15m' }))}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  localConfig.timeframe === '15m'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-850'
                }`}
              >
                <span>⏱️ 15m Primary</span>
              </button>

              <button
                onClick={() => setLocalConfig(prev => ({ ...prev, timeframe: '5m' }))}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  localConfig.timeframe === '5m'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500 shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-850'
                }`}
              >
                <span>⚡ 5m Scalp</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              Only trigger live audio and visual alerts for signals formed on the selected timeframe candle close.
            </p>
          </div>

          {/* 4. ALERT SCREEN POSITION & NOTIFICATION STYLE */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <MonitorCheck className="w-3.5 h-3.5 text-emerald-400" />
                Alert Screen Position & Display Style
              </label>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                Non-Blocking Layout
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Right Screen Floating Toast (Default) */}
              <div
                onClick={() => setLocalConfig(prev => ({ ...prev, position: 'RIGHT_TOAST' }))}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  (localConfig.position || 'RIGHT_TOAST') === 'RIGHT_TOAST'
                    ? 'bg-emerald-950/40 border-emerald-500 text-slate-100 shadow-md ring-1 ring-emerald-500/50'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs flex items-center gap-1.5 text-white">
                    <span className="text-emerald-400">📌</span> Right Screen Floating Toast
                  </div>
                  {(localConfig.position || 'RIGHT_TOAST') === 'RIGHT_TOAST' && (
                    <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Floats on the right side of the screen without blocking charts or workspace. (Recommended)
                </p>
              </div>

              {/* Option 2: Right Slide-in Drawer */}
              <div
                onClick={() => setLocalConfig(prev => ({ ...prev, position: 'RIGHT_DRAWER' }))}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  localConfig.position === 'RIGHT_DRAWER'
                    ? 'bg-emerald-950/40 border-emerald-500 text-slate-100 shadow-md ring-1 ring-emerald-500/50'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs flex items-center gap-1.5 text-white">
                    <span className="text-sky-400">📱</span> Right Slide-in Drawer
                  </div>
                  {localConfig.position === 'RIGHT_DRAWER' && (
                    <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Sleek vertical right sidebar card with full indicator checklist and target levels.
                </p>
              </div>

              {/* Option 3: Top-Right Compact Banner */}
              <div
                onClick={() => setLocalConfig(prev => ({ ...prev, position: 'TOP_RIGHT_COMPACT' }))}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  localConfig.position === 'TOP_RIGHT_COMPACT'
                    ? 'bg-emerald-950/40 border-emerald-500 text-slate-100 shadow-md ring-1 ring-emerald-500/50'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs flex items-center gap-1.5 text-white">
                    <span className="text-amber-400">🏷️</span> Top-Right Compact Pill
                  </div>
                  {localConfig.position === 'TOP_RIGHT_COMPACT' && (
                    <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Ultra-minimalist horizontal banner taking minimal screen space.
                </p>
              </div>

              {/* Option 4: Traditional Centered Modal */}
              <div
                onClick={() => setLocalConfig(prev => ({ ...prev, position: 'CENTER_MODAL' }))}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  localConfig.position === 'CENTER_MODAL'
                    ? 'bg-emerald-950/40 border-emerald-500 text-slate-100 shadow-md ring-1 ring-emerald-500/50'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs flex items-center gap-1.5 text-white">
                    <span className="text-purple-400">🔲</span> Centered Modal
                  </div>
                  {localConfig.position === 'CENTER_MODAL' && (
                    <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Full-screen modal dialog centered in the viewport with backdrop.
                </p>
              </div>
            </div>
          </div>

          {/* 4. AUDIO & VISUAL ALERT SETTINGS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Sound Toggle & Sound Test */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  {localConfig.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                  <span>Alert Sound</span>
                </div>
                <input
                  type="checkbox"
                  checked={localConfig.soundEnabled}
                  onChange={e => setLocalConfig(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 cursor-pointer w-4 h-4"
                />
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={playBullishAlertSound}
                  className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-700 text-emerald-300 text-[10px] py-1 rounded font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Play className="w-2.5 h-2.5" /> Bull Chime
                </button>
                <button
                  type="button"
                  onClick={playBearishAlertSound}
                  className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-700 text-rose-300 text-[10px] py-1 rounded font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Play className="w-2.5 h-2.5" /> Bear Chime
                </button>
              </div>
            </div>

            {/* Auto-Dismiss Timer Setting */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Auto-Dismiss Time</span>
                </div>
                <span className="font-mono font-bold text-amber-300 text-xs">
                  {localConfig.autoDismissSec === 0 ? 'Manual Dismiss' : `${localConfig.autoDismissSec || 12}s`}
                </span>
              </div>
              <select
                value={localConfig.autoDismissSec ?? 12}
                onChange={e => setLocalConfig(prev => ({ ...prev, autoDismissSec: Number(e.target.value) }))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value={0}>Manual Only (Stay until closed)</option>
                <option value={6}>6 Seconds</option>
                <option value={10}>10 Seconds</option>
                <option value={12}>12 Seconds (Recommended)</option>
                <option value={20}>20 Seconds</option>
                <option value={30}>30 Seconds</option>
              </select>
              <div className="text-[10px] text-slate-400">
                Timer pauses automatically when you hover over the alert.
              </div>
            </div>
          </div>

          {/* 5. OPTIONAL MIN RVOL FILTER */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-200">Minimum Relative Volume (RVOL)</div>
              <div className="text-[10px] text-slate-400">Filter out low-volume false breakouts</div>
            </div>
            <select
              value={localConfig.minRvol}
              onChange={e => setLocalConfig(prev => ({ ...prev, minRvol: Number(e.target.value) }))}
              className="bg-slate-900 border border-slate-700 text-slate-200 font-mono font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value={1.0}>Any (≥ 1.0x)</option>
              <option value={1.2}>≥ 1.2x (Elevated)</option>
              <option value={1.5}>≥ 1.5x (Strong)</option>
              <option value={2.0}>≥ 2.0x (Heavy Spike)</option>
            </select>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onTriggerTestAlert}
            className="w-full sm:w-auto bg-slate-850 hover:bg-slate-800 text-amber-300 border border-amber-500/40 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Test Alert Popup</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {savedFeedback ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Apply Alert Rule</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
