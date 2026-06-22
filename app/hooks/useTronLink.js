'use client';
import { useState, useEffect, useCallback } from 'react';
import { TOKEN } from '@/config';

// --- helpers (module scope) ---

function isMobile() {
  return typeof navigator !== 'undefined' &&
    /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

// Wait for the core tronWeb provider. We intentionally do NOT require window.tronLink:
// older TronLink mobile apps (< v4.3.4) and some other wallet browsers inject only tronWeb.
function waitForProvider(timeout = 2500) {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.tronWeb) return resolve(true);
    const start = Date.now();
    const id = setInterval(() => {
      if (window.tronWeb) {
        clearInterval(id);
        resolve(true);
      } else if (Date.now() - start > timeout) {
        clearInterval(id);
        resolve(false);
      }
    }, 100);
  });
}

// Deep link that opens the current dApp inside TronLink's built-in browser.
// Only used when NO provider is present on a plain mobile browser. Requires TronLink v4.10.0+.
function openInTronLink(dappUrl) {
  try {
    const param = {
      url: dappUrl || window.location.href,
      action: 'open',
      protocol: 'TronLink',
      version: '1.0',
    };
    const encoded = encodeURIComponent(JSON.stringify(param));
    window.location.href = `tronlinkoutside://pull.activity?param=${encoded}`;
  } catch {
    /* custom-scheme navigation can be blocked in some in-app browsers; ignore */
  }
}

export function useTronLink() {
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [tronWeb, setTronWeb] = useState(null);
  const [status, setStatus] = useState('disconnected'); // disconnected | connecting | connected | error
  const [error, setError] = useState(null);

  const fetchBalance = useCallback(async (tw, addr) => {
    // Fully guarded: on very old WebViews TronWeb's BigInt math can throw — never let it crash the UI.
    if (!tw || !addr || !TOKEN.contractAddress) return;
    try {
      const contract = await tw.contract().at(TOKEN.contractAddress);
      const raw = await contract.balanceOf(addr).call();
      const value = Number(raw?.toString?.() ?? raw) / 10 ** TOKEN.decimals;
      setBalance(Number.isFinite(value) ? value.toLocaleString() : '0');
    } catch {
      setBalance('0');
    }
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setStatus('connecting');
    try {
      let hasProvider = typeof window !== 'undefined' && !!window.tronWeb;

      if (!hasProvider) {
        if (isMobile()) {
          // Could be (a) a wallet in-app browser still injecting, or (b) a plain mobile browser.
          hasProvider = await waitForProvider(2500);
          if (!hasProvider) {
            openInTronLink();
            setTimeout(() => {
              setStatus((s) => (s === 'connecting' ? 'disconnected' : s));
            }, 2500);
            return;
          }
        } else {
          throw new Error('TronLink not found. Please install the TronLink extension.');
        }
      }

      // Modern wallets expose tronLink.request for explicit authorization.
      // Old in-app browsers don't — they auto-inject the unlocked address, so this is optional.
      try {
        if (window.tronLink?.request) {
          await window.tronLink.request({ method: 'tron_requestAccounts' });
        }
      } catch {
        // User may have rejected, or the method isn't supported on this build.
        // Fall through and try to read the injected address before giving up.
      }

      const tw = window.tronWeb;
      let addr = tw?.defaultAddress?.base58;

      // The wallet may still be unlocking; give it one short retry.
      if (!addr) {
        await new Promise((r) => setTimeout(r, 400));
        addr = window.tronWeb?.defaultAddress?.base58;
      }
      if (!addr) throw new Error('Please open and unlock your wallet, then try again.');

      setTronWeb(tw);
      setAddress(addr);
      setStatus('connected');
      await fetchBalance(tw, addr);
    } catch (e) {
      setError(e?.message || 'Could not connect. Please try again.');
      setStatus('error');
    }
  }, [fetchBalance]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setBalance(null);
    setTronWeb(null);
    setStatus('disconnected');
    setError(null);
  }, []);

  // Listen for account / network changes (guarded so a malformed message can't throw).
  useEffect(() => {
    const handler = (e) => {
      try {
        const action = e?.data?.message?.action;
        if (action === 'setAccount') {
          const newAddr = e.data.message.data?.address;
          if (newAddr && tronWeb) {
            setAddress(newAddr);
            fetchBalance(tronWeb, newAddr);
          }
        }
        if (action === 'disconnect') {
          disconnect();
        }
      } catch {
        /* ignore unexpected message shapes */
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [tronWeb, fetchBalance, disconnect]);

  return { address, balance, tronWeb, status, error, connect, disconnect, fetchBalance };
}