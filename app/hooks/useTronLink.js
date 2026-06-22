'use client';
import { useState, useEffect, useCallback } from 'react';
import { TOKEN } from '@/config';

// --- helpers (module scope, no state needed) ---

function isMobile() {
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

// TronLink injects window.tronWeb asynchronously inside its in-app browser,
// so a fast tap right after load can miss it. Poll briefly before giving up.
function waitForTronWeb(timeout = 1500) {
  return new Promise((resolve) => {
    if (window.tronWeb && window.tronLink) return resolve(true);
    const start = Date.now();
    const id = setInterval(() => {
      if (window.tronWeb && window.tronLink) {
        clearInterval(id);
        resolve(true);
      } else if (Date.now() - start > timeout) {
        clearInterval(id);
        resolve(false);
      }
    }, 100);
  });
}

// Deep link that opens the current dApp inside TronLink's built-in browser,
// where window.tronWeb IS injected. Requires TronLink v4.10.0+.
function openInTronLink(dappUrl = window.location.href) {
  const param = {
    url: dappUrl,
    action: 'open',
    protocol: 'TronLink',
    version: '1.0',
  };
  const encoded = encodeURIComponent(JSON.stringify(param));
  window.location.href = `tronlinkoutside://pull.activity?param=${encoded}`;
}

export function useTronLink() {
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [tronWeb, setTronWeb] = useState(null);
  const [status, setStatus] = useState('disconnected'); // disconnected | connecting | connected | error
  const [error, setError] = useState(null);

  const fetchBalance = useCallback(async (tw, addr) => {
    if (!tw || !addr || !TOKEN.contractAddress) return;
    try {
      const contract = await tw.contract().at(TOKEN.contractAddress);
      const raw = await contract.balanceOf(addr).call();
      setBalance((Number(raw) / 10 ** TOKEN.decimals).toLocaleString());
    } catch {
      setBalance('0');
    }
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setStatus('connecting');
    try {
      const hasInjection = window.tronWeb && window.tronLink;

      if (!hasInjection) {
        if (isMobile()) {
          // Could be (a) TronLink's in-app browser still injecting, or
          // (b) a plain mobile browser with no provider at all.
          const ready = await waitForTronWeb(1500);
          if (!ready) {
            // Plain mobile browser → bounce the user into TronLink's dApp browser.
            openInTronLink();
            // If TronLink isn't installed nothing happens; reset so the button
            // doesn't stay stuck on "Connecting...".
            setTimeout(() => {
              setStatus((s) => (s === 'connecting' ? 'disconnected' : s));
            }, 2500);
            // Optional: send users without TronLink to the download page instead:
            // setTimeout(() => { window.location.href = 'https://www.tronlink.org/'; }, 2500);
            return;
          }
        } else {
          // Desktop with no extension installed.
          throw new Error('TronLink not found. Please install the TronLink extension.');
        }
      }

      await window.tronLink.request({ method: 'tron_requestAccounts' });
      const tw = window.tronWeb;
      const addr = tw.defaultAddress?.base58;
      if (!addr) throw new Error('No account found in TronLink.');
      setTronWeb(tw);
      setAddress(addr);
      setStatus('connected');
      await fetchBalance(tw, addr);
    } catch (e) {
      setError(e.message);
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

  // Listen for account changes
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.message?.action === 'setAccount') {
        const newAddr = e.data.message.data?.address;
        if (newAddr && tronWeb) {
          setAddress(newAddr);
          fetchBalance(tronWeb, newAddr);
        }
      }
      if (e.data?.message?.action === 'disconnect') {
        disconnect();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [tronWeb, fetchBalance, disconnect]);

  return { address, balance, tronWeb, status, error, connect, disconnect, fetchBalance };
}