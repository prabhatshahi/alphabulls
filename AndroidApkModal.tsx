import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink, 
  X, 
  Terminal, 
  Layers, 
  Code2, 
  ShieldCheck, 
  Globe, 
  Copy, 
  Check, 
  Zap, 
  Cpu
} from 'lucide-react';

interface AndroidApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidApkModal: React.FC<AndroidApkModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isOpen) return null;

  const currentAppUrl = window.location.origin;
  const pwaBuilderUrl = `https://www.pwabuilder.com/image?url=${encodeURIComponent(currentAppUrl)}`;

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert("On Android Chrome/Brave/Edge: Tap the 3 dots menu in your browser top-right, then select 'Add to Home Screen' or 'Install App'!");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const localCapacitorCmds = `npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "ADR Scanner" "com.adrscanner.app" --web-dir=dist
npm run build
npx cap add android
npx cap open android`;

  const bubblewrapCmds = `npm install -g @bubblewrap/cli
bubblewrap init --manifest="${currentAppUrl}/manifest.json"
bubblewrap build`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30 text-emerald-400">
              <Smartphone className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Android App & APK Center</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-mono border border-emerald-500/30">
                  READY
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Install directly on Android or compile native APK / AAB binary package
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-xs">

          {/* METHOD 1: 1-CLICK PWA INSTALL ON ANDROID */}
          <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 p-5 rounded-xl space-y-3 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">Method 1: Direct Android PWA App Install</h3>
              </div>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/40">
                Recommended
              </span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Installs standalone full-screen app icon directly onto your Android device's home screen & app drawer without requiring APK developer sideloading.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={handleInstallPwa}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer text-xs"
              >
                <Smartphone className="w-4 h-4" />
                <span>{isInstalled ? 'App Already Installed!' : 'Install App on Android'}</span>
              </button>

              <div className="text-slate-400 text-[11px] flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Runs full-screen with offline caching & custom launcher icon</span>
              </div>
            </div>
          </div>

          {/* METHOD 2: 1-CLICK ONLINE APK BUILDER (PWABUILDER) */}
          <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-slate-100">Method 2: PWABuilder 1-Click APK Generator</h3>
              </div>
              <span className="bg-sky-500/20 text-sky-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-sky-500/30">
                Official Microsoft/Google Tool
              </span>
            </div>
            <p className="text-slate-300 text-xs">
              Generate a signed Android <code className="bg-slate-900 px-1 py-0.5 rounded text-sky-300 font-mono">.apk</code> or Google Play <code className="bg-slate-900 px-1 py-0.5 rounded text-sky-300 font-mono">.aab</code> package directly in your browser.
            </p>

            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
              <div className="font-mono text-[11px] text-slate-400 truncate">
                {currentAppUrl}
              </div>
              <a
                href={`https://www.pwabuilder.com?url=${encodeURIComponent(currentAppUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors text-xs shrink-0"
              >
                <span>Generate APK</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <ol className="list-decimal list-inside text-[11px] text-slate-400 space-y-1 pl-1">
              <li>Click <strong>Generate APK</strong> above to open PWABuilder with your live app URL pre-filled.</li>
              <li>Click <strong>Package for Store</strong> or <strong>Generate Android APK</strong>.</li>
              <li>Download the compiled <code className="text-sky-300 font-mono">app-release.apk</code> directly onto your Android device!</li>
            </ol>
          </div>

          {/* METHOD 3: LOCAL CAPACITOR / ANDROID STUDIO COMPILATION */}
          <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100">Method 3: Native Capacitor Project (Android Studio)</h3>
              </div>
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-indigo-500/30">
                Full Native Code
              </span>
            </div>
            <p className="text-slate-300 text-xs">
              We have pre-configured <code className="text-indigo-300 font-mono">@capacitor/android</code> inside this repository. Export this project to GitHub or ZIP and run these commands to build in Android Studio:
            </p>

            <div className="relative bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
              <button
                onClick={() => copyToClipboard(localCapacitorCmds, 'cap')}
                className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-100 bg-slate-800 p-1.5 rounded-md transition-colors"
                title="Copy commands"
              >
                {copiedCmd === 'cap' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <pre className="whitespace-pre">{localCapacitorCmds}</pre>
            </div>
          </div>

          {/* METHOD 4: BUBBLEWRAP CLI (GOOGLE TWA) */}
          <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">Method 4: Bubblewrap CLI (Google Trusted Web Activity)</h3>
              </div>
            </div>

            <div className="relative bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-amber-300 overflow-x-auto">
              <button
                onClick={() => copyToClipboard(bubblewrapCmds, 'bw')}
                className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-100 bg-slate-800 p-1.5 rounded-md transition-colors"
                title="Copy commands"
              >
                {copiedCmd === 'bw' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <pre className="whitespace-pre">{bubblewrapCmds}</pre>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Package ID: <code className="text-slate-200">com.adrscanner.app</code></span>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
