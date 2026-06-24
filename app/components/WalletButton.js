'use client';
import { useState, useEffect } from 'react';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';

const LABELS = {
  WalletConnect: 'Trust, MetaMask, OKX & more',
  TronLink: 'TronLink',
  OkxWallet: 'OKX Wallet',
  BitKeep: 'Bitget Wallet',
  TokenPocket: 'TokenPocket',
};

const ORDER = ['WalletConnect', 'TronLink', 'OkxWallet', 'BitKeep', 'TokenPocket'];
const EXTENSION_ONLY = ['TronLink', 'OkxWallet', 'BitKeep', 'TokenPocket'];

// Evaluate immediately (not in useEffect) so first render is correct
const detectMobile = () =>
  typeof navigator !== 'undefined' &&
  /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export default function WalletButton() {
  const { wallets, wallet, address, connected, connecting, select, connect, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const [shouldConnect, setShouldConnect] = useState(false);
  // Initialize synchronously from a function so it's right on first paint
  const [mobile] = useState(detectMobile);

  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  useEffect(() => {
    if (wallet && shouldConnect) {
      setShouldConnect(false);
      connect().catch(console.warn);
    }
  }, [wallet, shouldConnect, connect]);

  const pick = async (name) => {
    setOpen(false);
    await select(name);
    setShouldConnect(true);
  };

  const sortedWallets = [...wallets]
    .filter((w) => {
      // On mobile browsers, extensions don't exist — only WalletConnect works
      if (mobile && EXTENSION_ONLY.includes(w.adapter.name)) return false;
      return true;
    })
    .sort((a, b) => ORDER.indexOf(a.adapter.name) - ORDER.indexOf(b.adapter.name));

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

            {mobile && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 mb-4">
                <p className="text-blue-300/80 text-xs leading-relaxed">
                  Tap below, then pick your wallet (Trust, MetaMask, OKX...) on the next screen.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {sortedWallets.map((w) => (
                <button
                  key={w.adapter.name}
                  onClick={() => pick(w.adapter.name)}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/10 transition-colors text-left border border-white/5"
                >
                  {w.adapter.icon && (
                    <img src={w.adapter.icon} alt="" className="w-8 h-8 rounded-lg" />
                  )}
                  <div>
                    <span className="text-white text-sm font-medium block">
                      {LABELS[w.adapter.name] || w.adapter.name}
                    </span>
                    {w.adapter.name === 'WalletConnect' && (
                      <span className="text-white/30 text-xs">Choose your wallet next</span>
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