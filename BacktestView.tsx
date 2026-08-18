import React, { useState, useEffect } from 'react';
import { BacktestSummary, Trade, UniverseType } from '../types';
import { BarChart2, TrendingUp, TrendingDown, Percent, RefreshCw, AlertCircle, Calendar, PieChart, ShieldAlert } from 'lucide-react';
import { UniverseSelector } from './UniverseSelector';
import { getNseStocksByUniverse } from '../constants/allNseStocks';

interface BacktestViewProps {
  timeframe: '5m' | '15m';
  universe: UniverseType;
  setUniverse?: (u: UniverseType) => void;
}

export const BacktestView: React.FC<BacktestViewProps> = ({ timeframe, universe, setUniverse }) => {
  const [summary, setSummary] = useState<BacktestSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [symbolFilter, setSymbolFilter] = useState<string>('ALL');
  const [resultFilter, setResultFilter] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');

  // Sorting state for Stock-Wise Performance Breakdown
  const [stockSortBy, setStockSortBy] = useState<'SYMBOL' | 'TRADES' | 'WIN_RATE' | 'PROFIT_FACTOR' | 'RETURN'>('RETURN');
  const [stockSortOrder, setStockSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Sorting state for Detailed Trade Log
  const [tradeSortBy, setTradeSortBy] = useState<'ID' | 'SYMBOL' | 'TYPE' | 'ENTRY_TIME' | 'EXIT_TIME' | 'PRICE' | 'RESULT' | 'RETURN'>('ENTRY_TIME');
  const [tradeSortOrder, setTradeSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const handleStockHeaderClick = (key: 'SYMBOL' | 'TRADES' | 'WIN_RATE' | 'PROFIT_FACTOR' | 'RETURN') => {
    if (stockSortBy === key) {
      setStockSortOrder((prev) => (prev === 'DESC' ? 'ASC' : 'DESC'));
    } else {
      setStockSortBy(key);
      setStockSortOrder(key === 'SYMBOL' ? 'ASC' : 'DESC');
    }
  };

  const handleTradeHeaderClick = (key: 'ID' | 'SYMBOL' | 'TYPE' | 'ENTRY_TIME' | 'EXIT_TIME' | 'PRICE' | 'RESULT' | 'RETURN') => {
    if (tradeSortBy === key) {
      setTradeSortOrder((prev) => (prev === 'DESC' ? 'ASC' : 'DESC'));
    } else {
      setTradeSortBy(key);
      setTradeSortOrder(key === 'SYMBOL' || key === 'ID' ? 'ASC' : 'DESC');
    }
  };

  const runBacktest = async () => {
    setLoading(true);
    setError(null);
    try {
      let symbols: string[] = [];
      if (universe === 'CUSTOM') {
        symbols = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS'];
      } else {
        symbols = getNseStocksByUniverse(universe);
      }

      const res = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols, timeframe, universe }),
      });

      if (!res.ok) {
        throw new Error(`Backtest HTTP error ${res.status}`);
      }

      const data = await res.json();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to run backtest');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runBacktest();
  }, [timeframe, universe]);

  const sortedStockBreakdown = summary
    ? [...summary.stockBreakdown].sort((a, b) => {
        let diff = 0;
        if (stockSortBy === 'SYMBOL') diff = a.symbol.localeCompare(b.symbol);
        else if (stockSortBy === 'TRADES') diff = a.totalTrades - b.totalTrades;
        else if (stockSortBy === 'WIN_RATE') diff = a.winRatePct - b.winRatePct;
        else if (stockSortBy === 'PROFIT_FACTOR') diff = a.profitFactor - b.profitFactor;
        else if (stockSortBy === 'RETURN') diff = a.totalPlPct - b.totalPlPct;
        return stockSortOrder === 'DESC' ? -diff : diff;
      })
    : [];

  const filteredTrades = summary
    ? summary.trades.filter((t) => {
        if (symbolFilter !== 'ALL' && t.symbol !== symbolFilter) return false;
        if (resultFilter !== 'ALL' && t.result !== resultFilter) return false;
        if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;
        return true;
      })
    : [];

  const sortedTrades = [...filteredTrades].sort((a, b) => {
    let diff = 0;
    if (tradeSortBy === 'ID') diff = a.id.localeCompare(b.id);
    else if (tradeSortBy === 'SYMBOL') diff = a.symbol.localeCompare(b.symbol);
    else if (tradeSortBy === 'TYPE') diff = a.type.localeCompare(b.type);
    else if (tradeSortBy === 'ENTRY_TIME') diff = new Date(a.entryTimestamp).getTime() - new Date(b.entryTimestamp).getTime();
    else if (tradeSortBy === 'EXIT_TIME') diff = new Date(a.exitTimestamp).getTime() - new Date(b.exitTimestamp).getTime();
    else if (tradeSortBy === 'PRICE') diff = a.entryPrice - b.entryPrice;
    else if (tradeSortBy === 'RESULT') diff = a.result.localeCompare(b.result);
    else if (tradeSortBy === 'RETURN') diff = a.returnPct - b.returnPct;
    return tradeSortOrder === 'DESC' ? -diff : diff;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-100">ADR Strategy Backtest Engine</h2>
            <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2.5 py-0.5 rounded-md border border-slate-700">
              {timeframe.toUpperCase()} Closed Candle Resolution
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Strict execution test with +1% Target / -1% Stop Loss & same-candle conservative SL priority rule.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {setUniverse && (
            <UniverseSelector
              universe={universe}
              setUniverse={setUniverse}
              variant="dropdown"
            />
          )}

          <button
            onClick={runBacktest}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-md self-start md:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Running Backtest...' : 'Rerun Backtest'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl flex items-center space-x-3 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-16 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-400" />
          <p className="text-sm font-medium">Processing historical intraday candles and evaluating signals...</p>
        </div>
      ) : summary ? (
        <>
          {/* Top Level KPI Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-xs text-slate-400 block font-medium">Total Trades</span>
              <p className="text-xl font-bold text-slate-100 font-mono">{summary.totalTrades}</p>
              <div className="text-[10px] text-slate-400 font-mono">
                BUY: <strong className="text-emerald-400">{summary.buyTrades}</strong> | SELL: <strong className="text-rose-400">{summary.sellTrades}</strong>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-xs text-slate-400 block font-medium">Win Rate</span>
              <p className="text-xl font-bold text-emerald-400 font-mono">{summary.winRatePct}%</p>
              <div className="text-[10px] text-slate-400 font-mono">
                Wins: <strong className="text-emerald-400">{summary.winningTrades}</strong> | Losses: <strong className="text-rose-400">{summary.losingTrades}</strong>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-xs text-slate-400 block font-medium">Total Return</span>
              <p className={`text-xl font-bold font-mono ${summary.totalPlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {summary.totalPlPct >= 0 ? `+${summary.totalPlPct}` : summary.totalPlPct}%
              </p>
              <div className="text-[10px] text-slate-400">Sum of 1% target/SL trades</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-xs text-slate-400 block font-medium">Average Trade</span>
              <p className={`text-xl font-bold font-mono ${summary.avgTradePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {summary.avgTradePct >= 0 ? `+${summary.avgTradePct}` : summary.avgTradePct}%
              </p>
              <div className="text-[10px] text-slate-400">Expected value / trade</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-xs text-slate-400 block font-medium">Profit Factor</span>
              <p className="text-xl font-bold text-slate-100 font-mono">{summary.profitFactor}</p>
              <div className="text-[10px] text-slate-400">Gross Win / Gross Loss</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-xs text-slate-400 block font-medium">Max Drawdown</span>
              <p className="text-xl font-bold text-rose-400 font-mono">{summary.maxDrawdownPct}%</p>
              <div className="text-[10px] text-slate-400">Peak-to-trough decline</div>
            </div>
          </div>

          {/* BUY vs SELL Performance & Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* BUY vs SELL breakdown card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center space-x-2">
                <PieChart className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-100">BUY vs SELL Strategy Performance</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">BUY Trades</span>
                    <span className="text-[10px] font-mono text-emerald-300/80">{summary.buyVsSellBreakdown.buy.trades} trades</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-slate-100 pt-1">
                    Win Rate: {summary.buyVsSellBreakdown.buy.winRatePct}%
                  </div>
                  <div className={`text-xs font-mono font-semibold ${summary.buyVsSellBreakdown.buy.totalPlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    Total Return: {summary.buyVsSellBreakdown.buy.totalPlPct >= 0 ? `+${summary.buyVsSellBreakdown.buy.totalPlPct}` : summary.buyVsSellBreakdown.buy.totalPlPct}%
                  </div>
                </div>

                <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400">SELL Trades</span>
                    <span className="text-[10px] font-mono text-rose-300/80">{summary.buyVsSellBreakdown.sell.trades} trades</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-slate-100 pt-1">
                    Win Rate: {summary.buyVsSellBreakdown.sell.winRatePct}%
                  </div>
                  <div className={`text-xs font-mono font-semibold ${summary.buyVsSellBreakdown.sell.totalPlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    Total Return: {summary.buyVsSellBreakdown.sell.totalPlPct >= 0 ? `+${summary.buyVsSellBreakdown.sell.totalPlPct}` : summary.buyVsSellBreakdown.sell.totalPlPct}%
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Performance breakdown table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-100">Monthly Performance Breakdown</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                      <th className="py-2 px-2">Month</th>
                      <th className="py-2 px-2">Trades</th>
                      <th className="py-2 px-2">Win Rate</th>
                      <th className="py-2 px-2 text-right">Total P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {summary.monthlyBreakdown.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-500 text-xs">No monthly data recorded</td>
                      </tr>
                    ) : (
                      summary.monthlyBreakdown.map((m) => (
                        <tr key={m.month} className="hover:bg-slate-800/40">
                          <td className="py-2 px-2 font-semibold text-slate-100">{m.month}</td>
                          <td className="py-2 px-2">{m.trades}</td>
                          <td className="py-2 px-2">{m.winRatePct}%</td>
                          <td className={`py-2 px-2 text-right font-bold ${m.totalPlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {m.totalPlPct >= 0 ? `+${m.totalPlPct}` : m.totalPlPct}%
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Stock Performance Breakdown Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-sm text-slate-100">Stock-Wise Performance Breakdown</h3>
              <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-lg text-xs">
                <span className="text-[11px] text-slate-400 px-1.5 font-medium">Order:</span>
                <button
                  onClick={() => setStockSortOrder('ASC')}
                  className={`px-2 py-0.5 rounded font-extrabold text-[10px] transition-colors cursor-pointer ${
                    stockSortOrder === 'ASC' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Ascending (Low → High ↑)
                </button>
                <button
                  onClick={() => setStockSortOrder('DESC')}
                  className={`px-2 py-0.5 rounded font-extrabold text-[10px] transition-colors cursor-pointer ${
                    stockSortOrder === 'DESC' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Descending (High → Low ↓)
                </button>
              </div>
            </div>
            <div className="overflow-auto max-h-[55vh] relative">
              <table className="w-full text-left text-xs font-mono">
                <thead className="sticky top-0 z-20 bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800 shadow-md">
                  <tr>
                    <th 
                      className="py-2.5 px-3 cursor-pointer select-none hover:text-slate-100"
                      onClick={() => handleStockHeaderClick('SYMBOL')}
                    >
                      Stock Symbol {stockSortBy === 'SYMBOL' && (stockSortOrder === 'ASC' ? '▲' : '▼')}
                    </th>
                    <th 
                      className="py-2.5 px-3 cursor-pointer select-none hover:text-slate-100"
                      onClick={() => handleStockHeaderClick('TRADES')}
                    >
                      Total Trades {stockSortBy === 'TRADES' && (stockSortOrder === 'ASC' ? '▲' : '▼')}
                    </th>
                    <th 
                      className="py-2.5 px-3 cursor-pointer select-none hover:text-emerald-300"
                      onClick={() => handleStockHeaderClick('WIN_RATE')}
                    >
                      Win Rate % {stockSortBy === 'WIN_RATE' && (stockSortOrder === 'ASC' ? '▲' : '▼')}
                    </th>
                    <th 
                      className="py-2.5 px-3 cursor-pointer select-none hover:text-slate-100"
                      onClick={() => handleStockHeaderClick('PROFIT_FACTOR')}
                    >
                      Profit Factor {stockSortBy === 'PROFIT_FACTOR' && (stockSortOrder === 'ASC' ? '▲' : '▼')}
                    </th>
                    <th 
                      className="py-2.5 px-3 text-right cursor-pointer select-none hover:text-emerald-300"
                      onClick={() => handleStockHeaderClick('RETURN')}
                    >
                      Total Return % {stockSortBy === 'RETURN' && (stockSortOrder === 'ASC' ? '▲' : '▼')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {sortedStockBreakdown.map((sb) => (
                    <tr key={sb.symbol} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-extrabold text-slate-100">{sb.symbol}</td>
                      <td className="py-2.5 px-3">{sb.totalTrades}</td>
                      <td className="py-2.5 px-3 font-semibold text-emerald-400">{sb.winRatePct}%</td>
                      <td className="py-2.5 px-3">{sb.profitFactor}</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${sb.totalPlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {sb.totalPlPct >= 0 ? `+${sb.totalPlPct}` : sb.totalPlPct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Filterable Detailed Trade Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-100">Trade Execution Log</h3>
                <p className="text-xs text-slate-400">Showing {filteredTrades.length} of {summary.trades.length} executed trades</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Ascending / Descending Buttons */}
                <div className="flex items-center bg-slate-950 border border-slate-700 p-0.5 rounded-lg text-xs mr-2">
                  <span className="text-[10px] text-slate-400 px-1 font-medium">Order:</span>
                  <button
                    onClick={() => setTradeSortOrder('ASC')}
                    className={`px-2 py-0.5 rounded font-extrabold text-[10px] transition-colors cursor-pointer ${
                      tradeSortOrder === 'ASC' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Asc ↑
                  </button>
                  <button
                    onClick={() => setTradeSortOrder('DESC')}
                    className={`px-2 py-0.5 rounded font-extrabold text-[10px] transition-colors cursor-pointer ${
                      tradeSortOrder === 'DESC' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Desc ↓
                  </button>
                </div>

                {/* Stock Symbol filter */}
                <select
                  value={symbolFilter}
                  onChange={(e) => setSymbolFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="ALL">All Symbols</option>
                  {summary.stockBreakdown.map((s) => (
                    <option key={s.symbol} value={s.symbol}>{s.symbol}</option>
                  ))}
                </select>

                {/* Type filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="ALL">All Types</option>
                  <option value="BUY">BUY Trades</option>
                  <option value="SELL">SELL Trades</option>
                </select>

                {/* Result filter */}
                <select
                  value={resultFilter}
                  onChange={(e) => setResultFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="ALL">All Results</option>
                  <option value="WIN">WIN (+1%)</option>
                  <option value="LOSS">LOSS (-1%)</option>
                </select>
              </div>
            </div>

            <div className="overflow-auto max-h-[55vh] relative">
              <table className="w-full text-left text-xs font-mono">
                <thead className="sticky top-0 z-20 bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800 shadow-md">
                  <tr>
                    <th className="py-2.5 px-3 cursor-pointer hover:text-slate-100" onClick={() => handleTradeHeaderClick('ID')}>
                      ID {tradeSortBy === 'ID' && (tradeSortOrder === 'ASC' ? '▲' : '▼')}
                    </th>
                    <th className="py-2.5 px-3 cursor-pointer hover:text-slate-100" onClick={() => handleTradeHeaderClick('SYMBOL')}>
                      Symbol {tradeSortBy === 'SYMBOL' && (tradeSortOrder === 'ASC' ? '▲' : '▼')}
                    </th>
                    <th className="py-2.5 px-3 cursor-pointer hover:text-slate-100" onClick={() => handleTradeHeaderClick('TYPE')}>
                      Type {tradeSortBy === 'TYPE' && (tradeSortOrder === 'ASC' ? '▲' : '▼')}
                    </th>
                    <th className="py-2.5 px-3 cursor-pointer hover:text-slate-100" onClick={() => handleTradeHeaderClick('ENTRY_TIME')}>
                      Entry Time {tradeSortBy === 'ENTRY_TIME' && (tradeSortOrder === 'ASC' ? '▲' : '▼')}
                    </th>
                    <th className="py-2.5 px-3 cursor-pointer hover:text-slate-100" onClick={() => handleTradeHeaderClick('EXIT_TIME')}>
                      Exit Time {tradeSortBy === 'EXIT_TIME' && (tradeSortOrder === 'ASC' ? '▲' : '▼')}
                    </th>
                    <th className="py-2.5 px-3 cursor-pointer hover:text-slate-100" onClick={() => handleTradeHeaderClick('PRICE')}>
                      Entry Price {tradeSortBy === 'PRICE' && (tradeSortOrder === 'ASC' ? '▲' : '▼')}
                    </th>
                    <th className="py-2.5 px-3">Target (+1%)</th>
                    <th className="py-2.5 px-3">Stop Loss (-1%)</th>
                    <th className="py-2.5 px-3 cursor-pointer hover:text-slate-100" onClick={() => handleTradeHeaderClick('RESULT')}>
                      Result {tradeSortBy === 'RESULT' && (tradeSortOrder === 'ASC' ? '▲' : '▼')}
                    </th>
                    <th className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-100" onClick={() => handleTradeHeaderClick('RETURN')}>
                      Return {tradeSortBy === 'RETURN' && (tradeSortOrder === 'ASC' ? '▲' : '▼')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {sortedTrades.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-6 text-center text-slate-500">
                        No trades match the current filter selection.
                      </td>
                    </tr>
                  ) : (
                    sortedTrades.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">{t.id}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-100">{t.symbol}</td>
                        <td className="py-2.5 px-3">
                          {t.type === 'BUY' ? (
                            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[10px]">
                              BUY
                            </span>
                          ) : (
                            <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 text-[10px]">
                              SELL
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 text-[11px]">{new Date(t.entryTimestamp).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-slate-300 text-[11px]">{new Date(t.exitTimestamp).toLocaleString()}</td>
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
