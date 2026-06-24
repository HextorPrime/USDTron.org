'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

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
    (typeof window !== 'undefined' && window.tronLink?.tronWeb?.defaultAddress?.base58) ||
    null
  );
}

// Poll for an address up to `tries` times (Trust populates it async)
async function waitForAddress(provider, tries = 12, gap = 300) {
  for (let i = 0; i < tries; i++) {
    const addr = readAddress(provider);
    if (addr) return addr;
    await new Promise((r) => setTimeout(r, gap));
  }
  return null;
}

export function useInjectedWallet() {
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const startedRef = useRef(false);

  const connect = useCallback(async () => {
    const provider = getProvider();
    if (!provider) return null;
    setConnecting(true);
    try {
      await provider.request({ method: 'tron_requestAccounts' }).catch(() => {});
      const addr = await waitForAddress(provider);
      if (addr) setAddress(addr);
      return addr;
    } catch (e) {
      console.warn('[injected] connect error:', e);
      return null;
    } finally {
      setConnecting(false);
    }
  }, []);

  useEffect(() => {
    const provider = getProvider();
    if (!provider || startedRef.current) return;
    startedRef.current = true;

    (async () => {
      // Try immediate read first
      const existing = readAddress(provider);
      if (existing) {
        setAddress(existing);
        return;
      }
      // Request + poll
      await connect();
    })();

    // Keep polling in background in case authorization completes late
    const interval = setInterval(() => {
      const addr = readAddress(getProvider());
      if (addr) {
        setAddress(addr);
        clearInterval(interval);
      }
    }, 500);

    // Stop after 15s
    const stop = setTimeout(() => clearInterval(interval), 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(stop);
    };
  }, [connect]);

  return {
    injectedAddress: address,
    injectedConnected: !!address,
    injectedConnecting: connecting,
    connectInjected: connect,
  };
}