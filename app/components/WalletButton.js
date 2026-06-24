'use client';
import { useState, useEffect } from 'react';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';

const LABELS = {
  TronLink: 'TronLink',
  OkxWallet: 'OKX Wallet',
  BitKeep: 'Bitget Wallet',
  TokenPocket: 'TokenPocket',
  WalletConnect: 'Other Wallets (QR)',
};

const ICONS = {
  WalletConnect: 'https://avatars.githubusercontent.com/u/37784886?s=200&v=4',
};

const isMobile = () =>
  /Mobi|Android|iPhone|iPad/i.test(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  );

// True when we're ALREADY inside a wallet's in-app browser (tronWeb injected)
const inWalletBrowser = () =>
  typeof window !== 'undefined' &&
  (!!window.tronWeb || !!window.trustwallet?.tronLink || !!window.okxwallet);

// Build deep links that open THIS page inside the wallet's dApp browser
const deepLinks = (url) => ({
  TrustWallet: `https://link.trustwallet.com/open_url?url=${encodeURIComponent(url)}`,
  OkxWallet: `okx://wallet/dapp/url?dappUrl=${encodeURIComponent(url)}`,
  TokenPocket: `tpdapp://open?params=${encodeURIComponent(JSON.stringify({ url, chain: 'Tron' }))}`,
  BitKeep: `https://bkcode.vip?action=dapp&url=${encodeURIComponent(url)}`,
});

export default function WalletButton() {
  const { wallets, address, connected, connecting, select, connect, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const [shouldConnect, setShouldConnect] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [inApp, setInApp] = useState(false);

  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  useEffect(() => {
    setMobile(isMobile());
    setInApp(inWalletBrowser());
  }, []);

  const { wallet } = useWallet();
  useEffect(() => {
    if (wallet && shouldConnect) {
      setShouldConnect(false);
      connect().catch(console.warn);
    }
  }, [wallet, shouldConnect, connect]);

  const pick = async (name) => {
    // On mobile browser (NOT in-app) → deep-link into the wallet app
    if (mobile && !inApp) {
      const url = window.location.href;
      const links = deepLinks(url);
      const wcName =
        name === 'WalletConnect' ? null :
        name === 'OkxWallet' ? 'OkxWallet' :
        name === 'TokenPocket' ? 'TokenPocket' :
        name === 'BitKeep' ? 'BitKeep' :
        'TrustWallet'; // TronLink/default → trust-style deep link

      // For "Other Wallets" just fall through to WalletConnect QR
      if (wcName && links[wcName]) {
        setOpen(false);
        window.location.href = links[wcName];
        return;
      }
    }

    // Desktop OR already inside a wallet browser → normal injected connect
    setOpen(false);
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
        <button onClick={disconnect} className="text-xs text-white/50 hover:text-white/80 transition-colors">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-80 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Connect Wallet</h2>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white transition-colors text-xl leading-none">✕</button>
            </div>

            {mobile && !inApp && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 mb-4">
                <p className="text-blue-300/80 text-xs leading-relaxed">
                  Tapping a wallet will open this page inside that wallet's app, where you can connect and add the token.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {wallets.map((w) => (
                <button
                  key={w.adapter.name}
                  onClick={() => pick(w.adapter.name)}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/10 transition-colors text-left border border-white/5"
                >
                  <img src={ICONS[w.adapter.name] || w.adapter.icon} alt="" className="w-8 h-8 rounded-lg" />
                  <span className="text-white text-sm font-medium">{LABELS[w.adapter.name] || w.adapter.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}