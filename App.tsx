import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { AcceptanceTestModal } from './components/AcceptanceTestModal';
import { AndroidApkModal } from './components/AndroidApkModal';
import { AiAlphaAlertModal } from './components/AiAlphaAlertModal';
import { AiAlphaAlertTriggerPopup } from './components/AiAlphaAlertTriggerPopup';
import { AiAlphaAlertHistoryModal } from './components/AiAlphaAlertHistoryModal';
import { ScannerView } from './components/ScannerView';
import { AiPovSignalsView } from './components/AiPovSignalsView';
import { HotStocksView } from './components/HotStocksView';
import { UnusualVolumeMomentumView } from './components/UnusualVolumeMomentumView';
import { BacktestView } from './components/BacktestView';
import { ChartAnalysisView } from './components/ChartAnalysisView';
import { ChartModal } from './components/ChartModal';
import { VolumeCandle4TypesView } from './components/VolumeCandle4TypesView';
import { VolType5ClimaxView } from './components/VolType5ClimaxView';
import { CsvUploadView } from './components/CsvUploadView';
import { PythonExporter } from './components/PythonExporter';
import { LiveTickerAndSectorBar } from './components/LiveTickerAndSectorBar';
import { IntradayConfluenceView } from './components/IntradayConfluenceView';
import { AiPerfectConfluenceView } from './components/AiPerfectConfluenceView';
import { TrendingRadarView } from './components/TrendingRadarView';
import { NseStockExplorerView } from './components/NseStockExplorerView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getTabTitle } from './utils/navigation';
import { Activity, ShieldCheck, Smartphone, Bell, Volume2 } from 'lucide-react';
import { AiAlphaAlertConfig, AiAlphaAlertEvent, UniverseType, FetchUniverseType } from './types';
import { playBullishAlertSound, playBearishAlertSound, playTestBeep } from './utils/soundAlert';

export type TabType = 
  | 'ai_perfect_confluence'
  | 'ai_perfect_bullish'
  | 'ai_perfect_bearish'
  | 'confluence'
  | 'confluence_sector'
  | 'all_nse_stocks'
  | 'scanner' 
  | 'scanner_bullish' 
  | 'scanner_bearish' 
  | 'scanner_volume' 
  | 'scanner_multiday' 
  | 'scanner_watchlist' 
  | 'scanner_heatmap'
  | 'vol4types'
  | 'vol4types_bullish'
  | 'vol4types_bearish'
  | 'voltype5'
  | 'voltype5_bullish'
  | 'voltype5_bearish'
  | 'aipov' 
  | 'aipov_bullish' 
  | 'aipov_bearish' 
  | 'trending_radar'
  | 'hotstocks'
  | 'unusual_volume'
  | 'unusual_volume_bullish'
  | 'unusual_volume_bearish'
  | 'unusual_volume_squeeze' 
  | 'backtest' 
  | 'chart' 
  | 'csv' 
  | 'python';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('ai_perfect_confluence');
  const [navigationHistory, setNavigationHistory] = useState<TabType[]>([]);
  const [timeframe, setTimeframe] = useState<'5m' | '15m'>('15m');
  const [universe, setUniverse] = useState<UniverseType>('NIFTY_FNO');
  const [fetchUniverse, setFetchUniverse] = useState<FetchUniverseType>('FNO');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('RELIANCE.NS');
  const [popupChartSymbol, setPopupChartSymbol] = useState<string | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Global AI Alpha Score Alert States
  const [alertConfig, setAlertConfig] = useState<AiAlphaAlertConfig>(() => {
    try {
      const saved = localStorage.getItem('ai_alpha_alert_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          timeframe: parsed.timeframe || 'ALL',
          position: parsed.position || 'RIGHT_TOAST',
          autoDismissSec: parsed.autoDismissSec ?? 12
        };
      }
    } catch {}
    return {
      enabled: true,
      minScore: 80,
      direction: 'ALL',
      timeframe: 'ALL',
      soundEnabled: true,
      showPopup: true,
      minRvol: 1.0,
      browserNotifications: false,
      autoDismissSec: 12,
      position: 'RIGHT_TOAST'
    };
  });

  const [alertHistory, setAlertHistory] = useState<AiAlphaAlertEvent[]>(() => {
    try {
      const saved = localStorage.getItem('ai_alpha_alert_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
  const [isAlertHistoryOpen, setIsAlertHistoryOpen] = useState<boolean>(false);
  const [activeAlertPopup, setActiveAlertPopup] = useState<AiAlphaAlertEvent | null>(null);
  const [alertQueue, setAlertQueue] = useState<AiAlphaAlertEvent[]>([]);

  const snoozedSymbolsRef = useRef<Map<string, number>>(new Map());

  const handleToggleAlerts = (forcedState?: boolean) => {
    setAlertConfig(prev => {
      const nextEnabled = forcedState !== undefined ? forcedState : !prev.enabled;
      const updated = { ...prev, enabled: nextEnabled };
      try {
        localStorage.setItem('ai_alpha_alert_config', JSON.stringify(updated));
      } catch {}
      if (nextEnabled && updated.soundEnabled) {
        playTestBeep();
      }
      return updated;
    });
  };

  const handleSaveAlertConfig = (newConfig: AiAlphaAlertConfig) => {
    setAlertConfig(newConfig);
    try {
      localStorage.setItem('ai_alpha_alert_config', JSON.stringify(newConfig));
    } catch {}
  };

  const handleUpdatePosition = (newPos: AiAlphaAlertConfig['position']) => {
    setAlertConfig(prev => {
      const updated = { ...prev, position: newPos };
      try {
        localStorage.setItem('ai_alpha_alert_config', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearAlertHistory = () => {
    setAlertHistory([]);
    try {
      localStorage.removeItem('ai_alpha_alert_history');
    } catch {}
  };

  const handleSnoozeSymbol = (sym: string) => {
    snoozedSymbolsRef.current.set(sym, Date.now() + 10 * 60 * 1000);
    setActiveAlertPopup(null);
    setAlertQueue(prev => prev.filter(a => a.symbol !== sym));
  };

  const handleDispatchAlert = (event: AiAlphaAlertEvent) => {
    // Check snooze
    const snoozeUntil = snoozedSymbolsRef.current.get(event.symbol);
    if (snoozeUntil && Date.now() < snoozeUntil) {
      return;
    }

    // Play chime sound
    if (alertConfig.soundEnabled) {
      if (event.signalType === 'BULLISH') {
        playBullishAlertSound();
      } else {
        playBearishAlertSound();
      }
    }

    // Browser Web Notification if enabled
    if (alertConfig.browserNotifications && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const entryStr = typeof event.entryPrice === 'number' && !isNaN(event.entryPrice)
          ? event.entryPrice.toFixed(2)
          : typeof (event as any).price === 'number' && !isNaN((event as any).price)
          ? (event as any).price.toFixed(2)
          : '0.00';
        const targetStr = typeof event.targetPrice === 'number' && !isNaN(event.targetPrice)
          ? event.targetPrice.toFixed(2)
          : '0.00';
        new Notification(`🚨 AI Alpha Alert: ${event.symbol || 'NIFTY'} (${event.score ?? 0}%)`, {
          body: `${event.signalType || 'BULLISH'} Signal | LTP: ₹${entryStr} | Target: ₹${targetStr}`,
          icon: '/icon.svg'
        });
      } catch {}
    }

    // Append to history
    setAlertHistory(prev => {
      const updated = [event, ...prev.filter(e => e.id !== event.id)].slice(0, 100);
      try {
        localStorage.setItem('ai_alpha_alert_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (alertConfig.showPopup) {
      setActiveAlertPopup(event);
      setAlertQueue(prev => [event, ...prev.filter(e => e.symbol !== event.symbol)].slice(0, 5));
    }
  };

  const handleTriggerTestAlert = () => {
    const testEvent: AiAlphaAlertEvent = {
      id: `alert_${Date.now()}_test`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      rawTime: Date.now(),
      symbol: 'RELIANCE.NS',
      stockName: 'Reliance Industries',
      score: 92,
      tier: 'STRONG',
      signalType: 'BULLISH',
      entryPrice: 2980.5,
      targetPrice: 3025.2,
      stopLossPrice: 2950.7,
      projectedMovePct: 2.15,
      reasons: ['Active ADR Breakout', '2.4x Heavy RVOL', 'Bullish CVD (+450k)', 'PDH Cleared'],
      rvol: 2.4,
      timeframe,
      priceChangePct: 1.85
    };

    handleDispatchAlert(testEvent);
  };

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
      document.body.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
      document.body.classList.remove('light-mode');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleSetActiveTab = (newTab: TabType) => {
    if (newTab !== activeTab) {
      setNavigationHistory(prev => [...prev, activeTab]);
      setActiveTab(newTab);
    }
  };

  const handleSelectSymbolForChart = (sym: string) => {
    setSelectedSymbol(sym);
    setPopupChartSymbol(sym);
  };

  const handleOpenChartModal = (sym: string) => {
    setPopupChartSymbol(sym);
  };

  const handleGoBack = () => {
    if (navigationHistory.length > 0) {
      const newHistory = [...navigationHistory];
      const previous = newHistory.pop()!;
      setNavigationHistory(newHistory);
      setActiveTab(previous);
    } else {
      setActiveTab('scanner');
    }
  };

  const previousTab = navigationHistory.length > 0 ? navigationHistory[navigationHistory.length - 1] : null;
  const previousTabName = previousTab ? getTabTitle(previousTab) : undefined;

  return (
    <div className={`min-h-screen transition-colors duration-200 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 ${
      theme === 'light' ? 'light-mode bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      
      {/* Top Header Navbar & Sidebar Layout */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        universe={universe}
        setUniverse={setUniverse}
        fetchUniverse={fetchUniverse}
        setFetchUniverse={setFetchUniverse}
        onOpenTestModal={() => setIsTestModalOpen(true)}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        theme={theme}
        toggleTheme={toggleTheme}
        onSelectSymbolForChart={handleSelectSymbolForChart}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        onGoBack={navigationHistory.length > 0 ? handleGoBack : undefined}
        previousTabName={previousTabName}
        onOpenAlertModal={() => setIsAlertModalOpen(true)}
        alertConfig={alertConfig}
        onToggleAlerts={handleToggleAlerts}
      />

      {/* Main Content Area adjusting to Sidebar width */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
      }`}>
        <main className="flex-1 w-full max-w-[1920px] mx-auto px-2 sm:px-6 lg:px-8 py-2.5 sm:py-6 space-y-2.5 sm:space-y-4">
          
          {/* Running Stock Ticker Tape, Advance/Decline & Sectoral Flow Header Bar */}
          <LiveTickerAndSectorBar
            universe={universe}
            setUniverse={setUniverse}
            fetchUniverse={fetchUniverse}
            setFetchUniverse={setFetchUniverse}
            timeframe={timeframe}
            onSelectSymbolForChart={handleSelectSymbolForChart}
            onOpenChartModal={handleOpenChartModal}
            onOpenTrendingRadar={() => setActiveTab('trending_radar')}
          />

          {activeTab.startsWith('ai_perfect') && (
            <AiPerfectConfluenceView
              timeframe={timeframe}
              setTimeframe={setTimeframe}
              universe={universe}
              setUniverse={setUniverse}
              onSelectSymbolForChart={handleSelectSymbolForChart}
              onOpenChartModal={handleOpenChartModal}
              initialSubTab={
                activeTab === 'ai_perfect_bullish' ? 'BULLISH' :
                activeTab === 'ai_perfect_bearish' ? 'BEARISH' : 'PERFECT'
              }
              onOpenAlertModal={() => setIsAlertModalOpen(true)}
              alertConfig={alertConfig}
              onToggleAlerts={handleToggleAlerts}
              onDispatchAlert={handleDispatchAlert}
              onOpenTrendingRadar={() => setActiveTab('trending_radar')}
            />
          )}

          {(activeTab === 'confluence' || activeTab === 'confluence_sector') && (
            <IntradayConfluenceView
              timeframe={timeframe}
              setTimeframe={setTimeframe}
              universe={universe}
              setUniverse={setUniverse}
              onSelectSymbolForChart={handleSelectSymbolForChart}
              onOpenChartModal={handleOpenChartModal}
              initialSubTab={activeTab === 'confluence_sector' ? 'SECTOR_ALIGNED' : undefined}
              onOpenAlertModal={() => setIsAlertModalOpen(true)}
              alertConfig={alertConfig}
              onToggleAlerts={handleToggleAlerts}
              onDispatchAlert={handleDispatchAlert}
              onOpenTrendingRadar={() => setActiveTab('trending_radar')}
            />
          )}

          {activeTab.startsWith('scanner') && (
            <ScannerView
              timeframe={timeframe}
              setTimeframe={setTimeframe}
              universe={universe}
              setUniverse={setUniverse}
              onSelectSymbolForChart={handleSelectSymbolForChart}
              onOpenChartModal={handleOpenChartModal}
              initialSubTab={
                activeTab === 'scanner_bullish' ? 'BULLISH' :
                activeTab === 'scanner_bearish' ? 'BEARISH' :
                activeTab === 'scanner_volume' ? 'VOLUME' :
                activeTab === 'scanner_multiday' ? 'MULTI_DAY' :
                activeTab === 'scanner_watchlist' ? 'WATCHLIST' :
                activeTab === 'scanner_heatmap' ? 'HEATMAP' : 'ALL'
              }
              onOpenTrendingRadar={() => setActiveTab('trending_radar')}
            />
          )}

          {activeTab.startsWith('vol4types') && (
            <VolumeCandle4TypesView
              timeframe={timeframe}
              setTimeframe={setTimeframe}
              universe={universe}
              setUniverse={setUniverse}
              onSelectSymbolForChart={handleSelectSymbolForChart}
              onOpenChartModal={handleOpenChartModal}
            />
          )}

          {activeTab.startsWith('voltype5') && (
            <VolType5ClimaxView
              timeframe={timeframe}
              setTimeframe={setTimeframe}
              universe={universe}
              setUniverse={setUniverse}
              onSelectSymbolForChart={handleSelectSymbolForChart}
              onOpenChartModal={handleOpenChartModal}
              initialSubTab={
                activeTab === 'voltype5_bullish' ? 'BULLISH' :
                activeTab === 'voltype5_bearish' ? 'BEARISH' : 'ALL'
              }
            />
          )}

          {activeTab.startsWith('aipov') && (
            <AiPovSignalsView
              timeframe={timeframe}
              setTimeframe={setTimeframe}
              universe={universe}
              setUniverse={setUniverse}
              onSelectSymbolForChart={handleSelectSymbolForChart}
              onOpenChartModal={handleOpenChartModal}
              initialSubTab={
                activeTab === 'aipov_bullish' ? 'BULLISH' :
                activeTab === 'aipov_bearish' ? 'BEARISH' : 'BOTH'
              }
              onOpenAlertModal={() => setIsAlertModalOpen(true)}
              alertConfig={alertConfig}
              onToggleAlerts={handleToggleAlerts}
              onDispatchAlert={handleDispatchAlert}
            />
          )}

          {activeTab === 'trending_radar' && (
            <TrendingRadarView
              universe={universe}
              setUniverse={setUniverse}
              onSelectSymbolForChart={handleSelectSymbolForChart}
              onOpenChartModal={handleOpenChartModal}
            />
          )}

          {activeTab === 'hotstocks' && (
            <HotStocksView
              timeframe={timeframe}
              setTimeframe={setTimeframe}
              universe={universe}
              setUniverse={setUniverse}
              onSelectSymbolForChart={handleSelectSymbolForChart}
              onOpenChartModal={handleOpenChartModal}
            />
          )}

          {activeTab.startsWith('unusual_volume') && (
            <UnusualVolumeMomentumView
              timeframe={timeframe}
              setTimeframe={setTimeframe}
              universe={universe}
              setUniverse={setUniverse}
              onSelectSymbolForChart={handleSelectSymbolForChart}
              onOpenChartModal={handleOpenChartModal}
              initialSubTab={
                activeTab === 'unusual_volume_bullish' ? 'BULLISH' :
                activeTab === 'unusual_volume_bearish' ? 'BEARISH' :
                activeTab === 'unusual_volume_squeeze' ? 'SQUEEZE' : 'ALL'
              }
            />
          )}

          {activeTab === 'backtest' && (
            <BacktestView
              timeframe={timeframe}
              universe={universe}
              setUniverse={setUniverse}
            />
          )}

          {activeTab === 'chart' && (
            <ChartAnalysisView
              selectedSymbol={selectedSymbol}
              timeframe={timeframe}
              setTimeframe={setTimeframe}
              universe={universe}
              setUniverse={setUniverse}
              onGoBack={handleGoBack}
              previousTabName={previousTabName}
            />
          )}

          {activeTab === 'csv' && (
            <CsvUploadView
              timeframe={timeframe}
              universe={universe}
              setUniverse={setUniverse}
              fetchUniverse={fetchUniverse}
              setFetchUniverse={setFetchUniverse}
            />
          )}

          {activeTab === 'all_nse_stocks' && (
            <NseStockExplorerView
              universe={universe}
              setUniverse={setUniverse}
              onSelectSymbolForChart={handleSelectSymbolForChart}
              onOpenChartModal={handleOpenChartModal}
            />
          )}

          {activeTab === 'python' && (
            <PythonExporter
              universe={universe}
              setUniverse={setUniverse}
              fetchUniverse={fetchUniverse}
              setFetchUniverse={setFetchUniverse}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-xs text-slate-400 mt-auto">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-200">Alpha Bulls ADR Terminal</span>
              <span>—</span>
              <span className="text-slate-500">Zero-Rule-Invention Engine</span>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsApkModalOpen(true)}
                className="hover:text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer text-emerald-400 font-semibold"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Get Android App (APK)</span>
              </button>
              <span>•</span>
              <button
                onClick={() => setIsTestModalOpen(true)}
                className="hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Audit Test Cases 1-8</span>
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Acceptance Test Verification Modal */}
      <AcceptanceTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />

      {/* Android App & APK Center Modal */}
      <AndroidApkModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

      {/* Interactive Popup Chart Modal */}
      <ChartModal
        symbol={popupChartSymbol}
        isOpen={Boolean(popupChartSymbol)}
        onClose={() => setPopupChartSymbol(null)}
        onOpenFullTerminal={handleSelectSymbolForChart}
        timeframe={timeframe}
        setTimeframe={setTimeframe}
      />

      {/* Global AI Alpha Score Alert Configuration Modal */}
      <AiAlphaAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        config={alertConfig}
        onSaveConfig={handleSaveAlertConfig}
        onTriggerTestAlert={handleTriggerTestAlert}
      />

      {/* Global Live AI Alpha Alert Trigger Card (Right-Screen Floating Notification / Drawer / Compact / Modal) */}
      <ErrorBoundary fallback={null}>
        <AiAlphaAlertTriggerPopup
          alertEvent={activeAlertPopup}
          alertQueue={alertQueue}
          onClose={() => {
            setActiveAlertPopup(null);
            setAlertQueue([]);
          }}
          onOpenChart={(sym) => {
            handleOpenChartModal(sym);
          }}
          onSnooze={handleSnoozeSymbol}
          config={alertConfig}
          onUpdatePosition={handleUpdatePosition}
          onOpenSettings={() => setIsAlertModalOpen(true)}
        />
      </ErrorBoundary>

      {/* Global AI Alpha Alert History Modal */}
      <AiAlphaAlertHistoryModal
        isOpen={isAlertHistoryOpen}
        onClose={() => setIsAlertHistoryOpen(false)}
        history={alertHistory}
        onClearHistory={handleClearAlertHistory}
        onSelectSymbolForChart={(sym) => {
          handleOpenChartModal(sym);
        }}
      />
    </div>
  );
}
