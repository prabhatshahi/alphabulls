import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.adrscanner.app',
  appName: 'ADR Breakout Scanner',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#090d16',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      spinnerColor: '#10b981'
    }
  }
};

export default config;
