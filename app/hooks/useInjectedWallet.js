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

  const connect = useCallback(async () => {
    const provider = getProvider();
    if (!provider) return null;
    setConnecting(true);
    try {
      // TronLink-style request; some providers resolve with {code:200}
      await provider.request({ method: 'tron_requestAccounts' }).catch(() => {});
      // give the provider a tick to populate defaultAddress
      await new Promise((r) => setTimeout(r, 300));
      const addr = readAddress(provider);
      if (addr) setAddress(addr);
      return addr;
    } catch (e) {
      console.warn('[injected] connect error:', e);
      return null;
    } finally {
      setConnecting(false);
    }
  }, []);

  // Auto-connect on load if we're inside a wallet's in-app browser
  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;

    // If already authorized, address is readable immediately
    const existing = readAddress(provider);
    if (existing) {
      setAddress(existing);
      return;
    }

    // Otherwise request once on load (Trust/OKX in-app browsers allow this)
    connect();

    // Listen for account changes
    const onAccount = () => {
      const addr = readAddress(getProvider());
      setAddress(addr || null);
    };
    window.addEventListener('message', onAccount);
    return () => window.removeEventListener('message', onAccount);
  }, [connect]);

  return {
    injectedAddress: address,
    injectedConnected: !!address,
    injectedConnecting: connecting,
    connectInjected: connect,
  };
}