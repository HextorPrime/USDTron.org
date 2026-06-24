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

// Native adapters shown between Trust (top) and WalletConnect (bottom)
const ORDER = ['TronLink', 'OkxWallet', 'BitKeep', 'TokenPocket', 'WalletConnect'];

const isMobile = () =>
  /Mobi|Android|iPhone|iPad/i.test(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  );

// True when already inside a wallet's in-app browser (provider injected)
const inWalletBrowser = () =>
  typeof window !== 'undefined' &&
  (!!window.tronWeb || !!window.trustwallet?.tronLink || !!window.okxwallet?.tronLink);

// Deep links that re-open THIS page inside each wallet's dApp browser
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

  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  useEffect(() => {
    setMobile(isMobile());
    setInApp(inWalletBrowser());
  }, []);

  useEffect(() => {
    if (wallet && shouldConnect) {
      setShouldConnect(false);
      connect().catch(console.warn);
    }
  }, [wallet, shouldConnect, connect]);

  // Sorted native adapters (everything except we handle Trust separately at top)
  const sortedWallets = [...wallets].sort(
    (a, b) => ORDER.indexOf(a.adapter.name) - ORDER.indexOf(b.adapter.name)
  );

  // Connect Trust Wallet — uses WalletConnect (desktop QR / mobile deep link)
  const connectTrust = async () => {
    setOpen(false);

    // Mobile browser (not in-app) → deep-link into Trust app
    if (mobile && !inApp) {
      window.location.href = deepLinks(window.location.href).TrustWallet;
      return;
    }

    // Inside Trust's own browser → native injected provider
    if (window.trustwallet?.tronLink) {
      try {
        await window.trustwallet.tronLink.request({ method: 'tron_requestAccounts' });
      } catch (e) {
        console.warn('Trust connect error:', e);
      }
      return;
    }

    // Desktop → WalletConnect QR
    await select('WalletConnect');
    setShouldConnect(true);
  };

  const pick = async (name) => {
    setOpen(false);

    // Mobile browser (not in-app) → deep-link into the chosen wallet app
    if (mobile && !inApp && name !== 'WalletConnect') {
      const links = deepLinks(window.location.href);
      const key =
        name === 'OkxWallet' ? 'OkxWallet' :
        name === 'TokenPocket' ? 'TokenPocket' :
        name === 'BitKeep' ? 'BitKeep' :
        'TrustWallet';
      if (links[key]) {
        window.location.href = links[key];
        return;
      }
    }

    // Desktop or in-app → normal injected connect
    await select(name);
    setShouldConnect(true);
  };

  if (connected) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-white font-mono">{short}</span>
        </div>
        <button
          onClick={disconnect}
          className="text-xs text-white/50 hover:text-white/80 transition-colors"
        >
          Disconnect
        </button>
      </div>
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

            {mobile && !inApp && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 mb-4">
                <p className="text-blue-300/80 text-xs leading-relaxed">
                  Tapping a wallet opens this page inside that wallet's app, where you can connect and add the token.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {/* Trust Wallet — always pinned first */}
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

              {/* Native adapters in the middle, WalletConnect lands last via ORDER */}
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

            <p className="text-white/20 text-xs text-center mt-5">
              By connecting you agree to our terms of service
            </p>
          </div>
        </div>
      )}
    </>
  );
}