'use client';
import { useState, useEffect } from 'react';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';

const LABELS = {
  WalletConnect: 'Other Wallets (QR)',
  TronLink: 'TronLink',
  OkxWallet: 'OKX Wallet',
  BitKeep: 'Bitget Wallet',
  TokenPocket: 'TokenPocket',
};

const ICONS = {
  WalletConnect: 'https://avatars.githubusercontent.com/u/37784886?s=200&v=4',
  TrustWallet: 'https://avatars.githubusercontent.com/u/32179889?s=200&v=4',
};

const ORDER = ['TronLink', 'OkxWallet', 'BitKeep', 'TokenPocket', 'WalletConnect'];

const isMobile = () =>
  /Mobi|Android|iPhone|iPad/i.test(typeof navigator !== 'undefined' ? navigator.userAgent : '');

// Detect injected TRON provider = we're inside a wallet's in-app browser
const getInjected = () => {
  if (typeof window === 'undefined') return null;
  if (window.trustwallet?.tronLink) return window.trustwallet.tronLink;
  if (window.okxwallet?.tronLink) return window.okxwallet.tronLink;
  if (window.tronLink?.request) return window.tronLink;
  if (window.tronWeb?.request) return window.tronWeb;
  return null;
};

const deepLinks = (url) => ({
  TrustWallet: `https://link.trustwallet.com/open_url?url=${encodeURIComponent(url)}`,
  OkxWallet: `okx://wallet/dapp/url?dappUrl=${encodeURIComponent(url)}`,
  TokenPocket: `tpdapp://open?params=${encodeURIComponent(JSON.stringify({ url, chain: 'Tron' }))}`,
  BitKeep: `https://bkcode.vip?action=dapp&url=${encodeURIComponent(url)}`,
});

export default function WalletButton() {
  const { wallets, wallet, address, connected, connecting, select, connect, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const [shouldConnect, setShouldConnect] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [inApp, setInApp] = useState(false);
  const [injectedAddr, setInjectedAddr] = useState(null);

  const realAddress = address || injectedAddr;
  const short = realAddress ? `${realAddress.slice(0, 6)}...${realAddress.slice(-4)}` : null;
  const isConnected = connected || !!injectedAddr;

  useEffect(() => {
    setMobile(isMobile());
    const injected = getInjected();
    setInApp(!!injected);

    // If we're inside a wallet browser, auto-connect immediately — no picker
    if (injected) {
      (async () => {
        try {
          await injected.request({ method: 'tron_requestAccounts' }).catch(() => {});
          for (let i = 0; i < 12; i++) {
            const a =
              injected?.tronWeb?.defaultAddress?.base58 ||
              injected?.defaultAddress?.base58 ||
              window.tronWeb?.defaultAddress?.base58;
            if (a) { setInjectedAddr(a); break; }
            await new Promise((r) => setTimeout(r, 300));
          }
        } catch (e) {
          console.warn('auto-connect failed', e);
        }
      })();
    }
  }, []);

  useEffect(() => {
    if (wallet && shouldConnect) {
      setShouldConnect(false);
      connect().catch(console.warn);
    }
  }, [wallet, shouldConnect, connect]);

  const sortedWallets = [...wallets].sort(
    (a, b) => ORDER.indexOf(a.adapter.name) - ORDER.indexOf(b.adapter.name)
  );

  // Trust button
  const connectTrust = async () => {
    setOpen(false);

    // ALREADY inside a wallet browser → never deep-link, just connect injected
    if (inApp) {
      const injected = getInjected();
      if (injected) {
        await injected.request({ method: 'tron_requestAccounts' }).catch(() => {});
        const a =
          injected?.tronWeb?.defaultAddress?.base58 ||
          injected?.defaultAddress?.base58 ||
          window.tronWeb?.defaultAddress?.base58;
        if (a) setInjectedAddr(a);
      }
      return;
    }

    // Mobile browser (NOT in-app) → deep-link into Trust once
    if (mobile) {
      window.location.href = deepLinks(window.location.href).TrustWallet;
      return;
    }

    // Desktop → WalletConnect QR
    await select('WalletConnect');
    setShouldConnect(true);
  };

  const pick = async (name) => {
    setOpen(false);

    // Inside a wallet browser → always injected connect, never deep-link
    if (inApp) {
      await select(name);
      setShouldConnect(true);
      return;
    }

    // Mobile browser (not in-app) → deep-link for native wallets
    if (mobile && name !== 'WalletConnect') {
      const key =
        name === 'OkxWallet' ? 'OkxWallet' :
        name === 'TokenPocket' ? 'TokenPocket' :
        name === 'BitKeep' ? 'BitKeep' :
        'TrustWallet';
      const link = deepLinks(window.location.href)[key];
      if (link) {
        window.location.href = link;
        return;
      }
    }

    // Desktop / WalletConnect → injected connect
    await select(name);
    setShouldConnect(true);
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-white font-mono">{short}</span>
        </div>
        <button
          onClick={() => { disconnect(); setInjectedAddr(null); }}
          className="text-xs text-white/50 hover:text-white/80 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Inside a wallet browser but not yet connected → show a single direct connect button
  if (inApp) {
    return (
      <button
        onClick={connectTrust}
        disabled={connecting}
        className="bg-white text-black font-semibold text-sm px-5 py-2 rounded-full hover:bg-white/90 transition-all disabled:opacity-60"
      >
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={connecting}
        className="bg-white text-black font-semibold text-sm px-5 py-2 rounded-full hover:bg-white/90 transition-all disabled:opacity-60"
      >
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-80 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Connect Wallet</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-white/40 hover:text-white transition-colors text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {mobile && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 mb-4">
                <p className="text-blue-300/80 text-xs leading-relaxed">
                  Tapping a wallet opens this page inside that wallet's app, where you connect and add the token.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={connectTrust}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/10 transition-colors text-left border border-white/5"
              >
                <img src={ICONS.TrustWallet} alt="" className="w-8 h-8 rounded-lg" />
                <div>
                  <span className="text-white text-sm font-medium block">Trust Wallet</span>
                  <span className="text-white/30 text-xs">Recommended</span>
                </div>
              </button>

              {sortedWallets.map((w) => (
                <button
                  key={w.adapter.name}
                  onClick={() => pick(w.adapter.name)}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/10 transition-colors text-left border border-white/5"
                >
                  <img
                    src={ICONS[w.adapter.name] || w.adapter.icon}
                    alt=""
                    className="w-8 h-8 rounded-lg"
                  />
                  <div>
                    <span className="text-white text-sm font-medium block">
                      {LABELS[w.adapter.name] || w.adapter.name}
                    </span>
                    {w.adapter.name === 'WalletConnect' && (
                      <span className="text-white/30 text-xs">MetaMask, Rainbow & more</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}