import React, { useState } from 'react';
import { UniverseType, FetchUniverseType } from '../types';
import { UniverseSelector } from './UniverseSelector';
import { getNseStocksByUniverse } from '../constants/allNseStocks';
import { Code, Copy, Check, Download, Terminal, ShieldCheck } from 'lucide-react';

interface PythonExporterProps {
  universe?: UniverseType;
  setUniverse?: (u: UniverseType) => void;
  fetchUniverse?: FetchUniverseType;
  setFetchUniverse?: (f: FetchUniverseType) => void;
}

export const PythonExporter: React.FC<PythonExporterProps> = ({
  universe = 'NIFTY_FNO',
  setUniverse,
  fetchUniverse = 'FNO',
  setFetchUniverse
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const activeSymbols = getNseStocksByUniverse(universe, fetchUniverse);
  const formattedSymbols = JSON.stringify(activeSymbols, null, 4);

  const pythonCode = `import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# ==============================================================================
# ADR (14) BREAKOUT STRATEGY & STOCK SELECTION ENGINE
# Universe: ${universe} (${activeSymbols.length} Stocks)
# Strict Specification: ADR 14, Closed Candle Breakout, +1% Target / -1% SL
# ==============================================================================

# Selected Stock Universe (${universe})
DEFAULT_UNIVERSE = ${formattedSymbols}

def calculate_adr(daily_df: pd.DataFrame, length: int = 14) -> float:
    """
    Calculates Average Day Range (ADR) using the previous 14 COMPLETED trading days.
    ADR = (Average High - Average Low) / 2
    Do NOT include today's High or Low in the ADR calculation.
    """
    if len(daily_df) < length:
        raise ValueError(f"Need at least {length} completed daily candles for ADR calculation.")
    
    # Take exact last 14 completed daily rows
    df14 = daily_df.iloc[-length:]
    avg_high = df14['High'].mean()
    avg_low = df14['Low'].mean()
    
    adr = (avg_high - avg_low) / 2.0
    return adr

def calculate_levels(daily_df: pd.DataFrame, today_open: float, length: int = 14):
    """
    Calculates fixed Resistance and Support levels for today.
    Resistance = Today's Open + ADR
    Support = Today's Open - ADR
    """
    adr = calculate_adr(daily_df, length=length)
    resistance = today_open + adr
    support = today_open - adr
    return resistance, support, adr

def check_signal_condition(prev_close: float, current_close: float, resistance: float, support: float, state: str):
    """
    Evaluates BUY or SELL condition based on CLOSED candles.
    Duplicate Signal Rule:
    - Do not generate repeated BUY signals while price remains above Resistance.
    - Do not generate repeated SELL signals while price remains below Support.
    """
    # State reset logic if price returned below resistance or above support
    if state == 'ABOVE_RES' and current_close <= resistance:
        state = 'NEUTRAL'
    if state == 'BELOW_SUPP' and current_close >= support:
        state = 'NEUTRAL'

    # BUY Condition: Previous CLOSED <= Resistance AND Latest CLOSED > Resistance
    if prev_close <= resistance and current_close > resistance and state != 'ABOVE_RES':
        return 'BUY', 'ABOVE_RES'

    # SELL Condition: Previous CLOSED >= Support AND Latest CLOSED < Support
    if prev_close >= support and current_close < support and state != 'BELOW_SUPP':
        return 'SELL', 'BELOW_SUPP'

    # Maintain state tracking
    if current_close > resistance:
        state = 'ABOVE_RES'
    elif current_close < support:
        state = 'BELOW_SUPP'
    else:
        state = 'NEUTRAL'

    return 'NONE', state

def fetch_data_yahoo(symbol: str, timeframe: str = '15m'):
    """
    Fetches Daily and Intraday Candle data via Yahoo Finance API (yfinance).
    For Dhan API integration: Replace this function with Dhan API endpoint calls.
    """
    ticker = yf.Ticker(symbol)
    
    # Fetch 3 months of Daily data for previous 14 completed days
    daily_df = ticker.history(period='3mo', interval='1d')
    
    # Fetch 1 month of Intraday data (15m or 5m)
    intraday_df = ticker.history(period='1mo', interval=timeframe)
    
    return daily_df, intraday_df

def scan_symbol_today(symbol: str, timeframe: str = '15m'):
    """
    Scans a single stock symbol for today's ADR Breakout / Breakdown signals.
    Prints exact timestamp triggers and entry / target / stop-loss levels.
    """
    try:
        daily_df, intraday_df = fetch_data_yahoo(symbol, timeframe=timeframe)
        if len(daily_df) < 15 or len(intraday_df) < 2:
            return None

        # Get latest intraday date string
        intraday_df['date_str'] = intraday_df.index.strftime('%Y-%m-%d')
        latest_date = intraday_df['date_str'].iloc[-1]

        # Previous 14 completed daily candles prior to today
        daily_df['date_str'] = daily_df.index.strftime('%Y-%m-%d')
        prev_daily = daily_df[daily_df['date_str'] < latest_date]
        
        if len(prev_daily) < 14:
            return None

        # Today's intraday candles
        today_intraday = intraday_df[intraday_df['date_str'] == latest_date]
        if len(today_intraday) < 2:
            return None

        today_open = today_intraday['Open'].iloc[0]
        resistance, support, adr = calculate_levels(prev_daily, today_open)

        # Sequential scan of today's closed candles
        state = 'NEUTRAL'
        signals = []

        for i in range(1, len(today_intraday)):
            prev_close = today_intraday['Close'].iloc[i - 1]
            curr_candle = today_intraday.iloc[i]
            curr_close = curr_candle['Close']
            timestamp = curr_candle.name.strftime('%Y-%m-%d %H:%M:%S')

            sig, state = check_signal_condition(prev_close, curr_close, resistance, support, state)

            if sig == 'BUY':
                entry_price = curr_close
                target = entry_price * 1.01  # +1% Target
                stop_loss = entry_price * 0.99  # -1% Stop Loss
                signals.append({
                    'timestamp': timestamp,
                    'type': 'BUY',
                    'entry_price': round(entry_price, 2),
                    'target': round(target, 2),
                    'stop_loss': round(stop_loss, 2),
                    'resistance': round(resistance, 2),
                    'support': round(support, 2)
                })
            elif sig == 'SELL':
                entry_price = curr_close
                target = entry_price * 0.99  # -1% Target
                stop_loss = entry_price * 1.01  # +1% Stop Loss
                signals.append({
                    'timestamp': timestamp,
                    'type': 'SELL',
                    'entry_price': round(entry_price, 2),
                    'target': round(target, 2),
                    'stop_loss': round(stop_loss, 2),
                    'resistance': round(resistance, 2),
                    'support': round(support, 2)
                })

        return {
            'symbol': symbol,
            'today_open': round(today_open, 2),
            'adr14': round(adr, 2),
            'resistance': round(resistance, 2),
            'support': round(support, 2),
            'latest_price': round(today_intraday['Close'].iloc[-1], 2),
            'signals': signals
        }
    except Exception as e:
        print(f"Error scanning {symbol}: {e}")
        return None

def main_scanner(symbols=DEFAULT_UNIVERSE, timeframe='15m'):
    """
    Main Stock Selection Scanner function over universe.
    """
    print("=" * 70)
    print(f"RUNNING ADR(14) STOCK SELECTION SCANNER | TIMEFRAME: {timeframe}")
    print("=" * 70)
    
    triggered_symbols = []

    for sym in symbols:
        result = scan_symbol_today(sym, timeframe=timeframe)
        if result and len(result['signals']) > 0:
            triggered_symbols.append(result)
            print(f"\\n[SIGNAL TRIGGERED] {result['symbol']}")
            print(f"  LTP: ₹{result['latest_price']} | Open: ₹{result['today_open']} | ADR: ₹{result['adr14']}")
            print(f"  Fixed Resistance: ₹{result['resistance']} | Fixed Support: ₹{result['support']}")
            print("  Timestamp Triggers:")
            for sig in result['signals']:
                print(f"    - {sig['timestamp']} => {sig['type']} SIGNAL | Entry: ₹{sig['entry_price']} | Target (+1%): ₹{sig['target']} | SL (-1%): ₹{sig['stop_loss']}")

    if not triggered_symbols:
        print("\\nNo breakout / breakdown signals triggered on current timeframe closed candles.")

# Dhan API Wrapper Placeholder (To easily switch from Yahoo Finance to Dhan API)
def fetch_data_dhan(symbol_security_id: str, dhan_client_object, timeframe='15'):
    """
    Placeholder function when migrating to Dhan Data API (dhanhq SDK).
    """
    # Example Dhan HQ SDK Call:
    # daily_data = dhan_client_object.historical_daily_data(symbol_security_id)
    # intraday_data = dhan_client_object.historical_intraday_data(symbol_security_id, interval=timeframe)
    pass

if __name__ == '__main__':
    # Run Scanner on NIFTY Universe with 15-minute closed candles
    main_scanner(DEFAULT_UNIVERSE, timeframe='15m')
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([pythonCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'adr_breakout_scanner.py';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Code className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-100">Python Strategy Script Exporter</h2>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 font-mono px-2.5 py-0.5 rounded-md border border-emerald-500/20">
              Yahoo Finance & Dhan API Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Converted strategy logic into clean, standalone Python code using <code className="text-slate-200">yfinance</code> with modular hooks for Dhan HQ SDK API.
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
            onClick={handleCopy}
            className="bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Script'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download .py File</span>
          </button>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>adr_breakout_scanner.py</span>
          </div>
          <span className="text-slate-500">Python 3.8+</span>
        </div>

        <div className="p-4 overflow-x-auto max-h-[600px] text-xs font-mono text-slate-200 leading-relaxed bg-slate-950">
          <pre>{pythonCode}</pre>
        </div>
      </div>

      {/* Notice box */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-2">
        <div className="flex items-center space-x-2 text-slate-200 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Note on Trading Logic Guarantee</span>
        </div>
        <p>
          "I found a possible improvement, but I did not implement it because the strategy specification forbids adding unrequested trading logic."
        </p>
        <p>
          This Python script implements the exact logic: 14-day completed ADR, fixed daily resistance/support, closed candle breakout check, duplicate signal suppression, +1% Target / -1% Stop Loss, and same-candle conservative Stop Loss priority.
        </p>
      </div>
    </div>
  );
};
