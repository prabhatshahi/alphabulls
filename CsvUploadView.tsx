import React, { useState } from 'react';
import { Candle, StockBacktestResult, UniverseType, FetchUniverseType } from '../types';
import { backtestStock } from '../strategyEngine';
import { UniverseSelector } from './UniverseSelector';
import { getNseStocksByUniverse } from '../constants/allNseStocks';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Play, BarChart2 } from 'lucide-react';

interface CsvUploadViewProps {
  timeframe: '5m' | '15m';
  universe?: UniverseType;
  setUniverse?: (u: UniverseType) => void;
  fetchUniverse?: FetchUniverseType;
  setFetchUniverse?: (f: FetchUniverseType) => void;
}

export const CsvUploadView: React.FC<CsvUploadViewProps> = ({
  timeframe,
  universe = 'NIFTY_FNO',
  setUniverse,
  fetchUniverse = 'FNO',
  setFetchUniverse
}) => {
  const [dailyCsvText, setDailyCsvText] = useState<string>('');
  const [intradayCsvText, setIntradayCsvText] = useState<string>('');
  const [symbolName, setSymbolName] = useState<string>('CUSTOM_STOCK');

  const [result, setResult] = useState<StockBacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseCsvToCandles = (csvText: string): Candle[] => {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const candles: Candle[] = [];
    // Identify header line
    const headerLine = lines[0].toLowerCase();
    const hasHeader = headerLine.includes('open') || headerLine.includes('date');

    const startIndex = hasHeader ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length >= 5) {
        // datetime, open, high, low, close, volume
        const dt = parts[0];
        const open = parseFloat(parts[1]);
        const high = parseFloat(parts[2]);
        const low = parseFloat(parts[3]);
        const close = parseFloat(parts[4]);
        const volume = parts[5] ? parseFloat(parts[5]) : 0;

        if (!isNaN(open) && !isNaN(high) && !isNaN(low) && !isNaN(close)) {
          const ts = new Date(dt).getTime() || Date.now() - i * 300000;
          candles.push({
            datetime: dt,
            timestamp: ts,
            open,
            high,
            low,
            close,
            volume,
          });
        }
      }
    }

    return candles.sort((a, b) => a.timestamp - b.timestamp);
  };

  const handleRunCustomBacktest = () => {
    setError(null);
    setResult(null);

    if (!dailyCsvText.trim()) {
      setError('Please provide Daily CSV content (minimum 14 completed daily rows).');
      return;
    }

    if (!intradayCsvText.trim()) {
      setError('Please provide Intraday CSV content (5-min or 15-min OHLC rows).');
      return;
    }

    try {
      const dailyCandles = parseCsvToCandles(dailyCsvText);
      const intradayCandles = parseCsvToCandles(intradayCsvText);

      if (dailyCandles.length < 14) {
        throw new Error(`Daily CSV contains ${dailyCandles.length} valid rows. Minimum required for ADR(14) is 14 daily candles.`);
      }

      if (intradayCandles.length < 2) {
        throw new Error(`Intraday CSV contains ${intradayCandles.length} valid rows. Minimum required is 2 candles.`);
      }

      const res = backtestStock(symbolName, dailyCandles, intradayCandles, timeframe);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to parse CSV files');
    }
  };

  const loadSampleData = () => {
    // Generate 20 sample daily candles
    let sampleDaily = 'datetime,open,high,low,close,volume\n';
    const now = Date.now();
    for (let i = 20; i >= 1; i--) {
      const dt = new Date(now - i * 86400000).toISOString().substring(0, 10);
      sampleDaily += `${dt},1000.00,1030.00,970.00,1015.00,50000\n`;
    }

    // Generate 5m sample candles for today
    let sampleIntraday = 'datetime,open,high,low,close,volume\n';
    const todayStr = new Date(now).toISOString().substring(0, 10);
    const times = ['09:15', '09:20', '09:25', '09:30', '09:35', '09:40', '09:45', '09:50', '09:55', '10:00'];
    const closes = [1000, 1002, 1008, 1018, 1035, 1040, 1025, 1020, 1010, 1005];

    times.forEach((t, idx) => {
      const dt = `${todayStr}T${t}:00Z`;
      const c = closes[idx];
      sampleIntraday += `${dt},${c - 2},${c + 5},${c - 5},${c},10000\n`;
    });

    setSymbolName('SAMPLE_STOCK');
    setDailyCsvText(sampleDaily);
    setIntradayCsvText(sampleIntraday);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-emerald-400" /> Custom CSV Backtester
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Upload custom Daily CSV and Intraday CSV files to backtest the strategy on proprietary offline datasets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {setUniverse && (
            <UniverseSelector
              universe={universe}
              setUniverse={setUniverse}
              fetchUniverse={fetchUniverse}
              setFetchUniverse={setFetchUniverse}
              variant="dropdown"
            />
          )}

          <button
            onClick={loadSampleData}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            Load Sample ({universe.replace('_', ' ')})
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl flex items-center space-x-3 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* CSV Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Daily CSV Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-400" /> Daily CSV Data (Min 14 Rows)
            </label>
            <span className="text-[10px] text-slate-400 font-mono">datetime,open,high,low,close,volume</span>
          </div>

          <textarea
            rows={8}
            value={dailyCsvText}
            onChange={(e) => setDailyCsvText(e.target.value)}
            placeholder="datetime,open,high,low,close,volume&#10;2026-08-01,1000,1020,990,1010,10000"
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono p-3 rounded-lg focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Intraday CSV Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-400" /> Intraday CSV Data ({timeframe.toUpperCase()})
            </label>
            <span className="text-[10px] text-slate-400 font-mono">datetime,open,high,low,close,volume</span>
          </div>

          <textarea
            rows={8}
            value={intradayCsvText}
            onChange={(e) => setIntradayCsvText(e.target.value)}
            placeholder="datetime,open,high,low,close,volume&#10;2026-08-11T09:15:00Z,1010,1035,1005,1030,2500"
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono p-3 rounded-lg focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Action Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Stock Symbol Name:</span>
          <input
            type="text"
            value={symbolName}
            onChange={(e) => setSymbolName(e.target.value.toUpperCase())}
            className="bg-slate-950 border border-slate-700 text-slate-100 text-xs font-bold font-mono px-3 py-1.5 rounded-lg focus:outline-none"
          />
        </div>

        <button
          onClick={handleRunCustomBacktest}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-5 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-md"
        >
          <Play className="w-4 h-4" />
          <span>Execute CSV Backtest</span>
        </button>
      </div>

      {/* Custom Result Output */}
      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-slate-100">
              CSV Backtest Results for {result.symbol}
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-400 block">Total Trades</span>
              <p className="text-lg font-bold text-slate-100 font-mono">{result.totalTrades}</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-400 block">Win Rate</span>
              <p className="text-lg font-bold text-emerald-400 font-mono">{result.winRatePct}%</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-400 block">Total P&L</span>
              <p className={`text-lg font-bold font-mono ${result.totalPlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {result.totalPlPct >= 0 ? `+${result.totalPlPct}` : result.totalPlPct}%
              </p>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-400 block">Profit Factor</span>
              <p className="text-lg font-bold text-slate-100 font-mono">{result.profitFactor}</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-400 block">Max Drawdown</span>
              <p className="text-lg font-bold text-rose-400 font-mono">{result.maxDrawdownPct}%</p>
            </div>
          </div>

          {/* Trade Table */}
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Entry Time</th>
                  <th className="py-2.5 px-3">Exit Time</th>
                  <th className="py-2.5 px-3">Entry Price</th>
                  <th className="py-2.5 px-3">Target (+1%)</th>
                  <th className="py-2.5 px-3">Stop Loss (-1%)</th>
                  <th className="py-2.5 px-3">Result</th>
                  <th className="py-2.5 px-3 text-right">Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {result.trades.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3">
                      {t.type === 'BUY' ? (
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[10px]">BUY</span>
                      ) : (
                        <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 text-[10px]">SELL</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{t.entryTimestamp}</td>
                    <td className="py-2.5 px-3 text-slate-300">{t.exitTimestamp}</td>
                    <td className="py-2.5 px-3 font-semibold">₹{t.entryPrice.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-emerald-400">₹{t.targetPrice.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-rose-400">₹{t.stopLossPrice.toFixed(2)}</td>
                    <td className="py-2.5 px-3">
                      {t.result === 'WIN' ? (
                        <span className="text-emerald-400 font-bold">WIN</span>
                      ) : (
                        <span className="text-rose-400 font-bold">LOSS</span>
                      )}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${t.returnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.returnPct >= 0 ? `+${t.returnPct}%` : `${t.returnPct}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
