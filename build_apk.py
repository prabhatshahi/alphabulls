#!/usr/bin/env python3
"""
ADR Breakout Scanner & Terminal - Android APK Build Helper
This script prepares the web app dist files and Capacitor Android native workspace.
"""

import os
import sys
import subprocess
import json

def run_cmd(cmd):
    print(f"\n[+] Running: {cmd}")
    res = subprocess.run(cmd, shell=True)
    if res.returncode != 0:
        print(f"[-] Command failed with return code {res.returncode}")
        return False
    return True

def main():
    print("==================================================")
    print("  ADR Breakout Scanner - Android APK Build Setup  ")
    print("==================================================")

    # Step 1: Build web bundle
    print("\n[Step 1] Compiling Web Build with Vite...")
    if not run_cmd("npm run build"):
        sys.exit(1)

    # Step 2: Check Capacitor config
    if not os.path.exists("capacitor.config.ts"):
        print("[-] capacitor.config.ts missing!")
        sys.exit(1)

    # Step 3: Capacitor Sync
    print("\n[Step 2] Syncing web assets with Capacitor Android...")
    if not run_cmd("npx cap sync android"):
        print("\n[*] Initializing Android platform for Capacitor...")
        run_cmd("npx cap add android")
        run_cmd("npx cap sync android")

    print("\n==================================================")
    print("  Android Project Successfully Prepared!         ")
    print("==================================================")
    print("To compile the APK binary file:")
    print("  1. Open Android Studio: npx cap open android")
    print("  2. Select: Build > Build Bundle(s) / APK(s) > Build APK(s)")
    print("  3. Your APK will be generated at: android/app/build/outputs/apk/debug/app-debug.apk")
    print("==================================================")

if __name__ == "__main__":
    main()
