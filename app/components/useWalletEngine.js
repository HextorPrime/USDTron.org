'use client';
import { useState, useEffect, useCallback } from 'react';

export function getProvider() {
  if (typeof window === 'undefined') return null;
  if (window.trustwallet?.tronLink) return window.trustwallet.tronLink;
  if (window.okxwallet?.tronLink) return window.okxwallet.tronLink;
  if (window.tronLink?.request) return window.tronLink;
  if (window.tronWeb?.request) return window.tronWeb;
  return null;
}

function readAddress(provider) {
  return (
    provider?.tronWeb?.defaultAddress?.base58 ||
    provider?.defaultAddress?.base58 ||
    (typeof window !== 'undefined' && window.tronWeb?.defaultAddress?.base58) ||
    null
  );
}

export function useInjectedWallet() {
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);

  // Explicit connect — ONLY called on user action (button tap)
  const connect = useCallback(async () => {
    const provider = getProvider();
    if (!provider) return null;
    setConnecting(true);
    try {
      await provider.request({ method: 'tron_requestAccounts' }).catch(() => {});
      for (let i = 0; i < 12; i++) {
        const a = readAddress(provider);
        if (a) { setAddress(a); break; }
        await new Promise((r) => setTimeout(r, 300));
      }
      return readAddress(provider);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnectInjected = useCallback(() => {
    setAddress(null);
  }, []);

  // PASSIVE on load: only read if ALREADY authorized. Never request.
  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;
    // Only pick up an address that's already available (user previously authorized).
    // Do NOT call tron_requestAccounts here — that's what popped the extension.
    const existing = readAddress(provider);
    if (existing) setAddress(existing);
  }, []);

  return {
    injectedAddress: address,
    injectedConnected: !!address,
    injectedConnecting: connecting,
    connectInjected: connect,
    disconnectInjected,
  };
}