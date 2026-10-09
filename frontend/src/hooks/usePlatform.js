/**
 * usePlatform - Detects whether the app is running inside a Capacitor native shell.
 * Safe to call on web (where Capacitor is not loaded).
 */
import { useState } from 'react';

let _isNative = null;

function detectNative() {
  if (_isNative !== null) return _isNative;
  try {
    if (
      typeof window !== 'undefined' &&
      window.Capacitor &&
      typeof window.Capacitor.isNativePlatform === 'function' &&
      window.Capacitor.isNativePlatform()
    ) {
      _isNative = true;
    } else {
      _isNative = false;
    }
  } catch {
    _isNative = false;
  }
  return _isNative;
}

export function usePlatform() {
  const [isNative] = useState(() => detectNative());
  return { isNative, isWeb: !isNative };
}

export function isNativePlatform() {
  return detectNative();
}
