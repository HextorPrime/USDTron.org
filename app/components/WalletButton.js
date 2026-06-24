'use client';
// components/WalletButton.js — now self-contained (no props). Reads useWallet().
// Usage in parent:  <WalletButton />   (must be inside <Providers>)
import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';
import { WALLET_LABELS } from './Wallet';

export default function WalletButton() {
  const { wallets, wallet, address, connected, connecting, select, connect, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  // Close the picker on outside click.
  useEffect(() => {
    const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (name) => {
    setOpen(false);
    select(name);
    // With autoConnect on the provider, selecting connects automatically.
    // If your adapter version doesn't auto-connect on select, uncomment:
    // setTimeout(() => connect().catch(() => {}), 0);
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
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={connecting}
        className="bg-white text-black font-semibold text-sm px-5 py-2 rounded-full hover:bg-white/90 transition-all disabled:opacity-60"
      >
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-white/15 rounded-2xl p-2 z-50 shadow-xl">
          {wallets.map((w) => (
            <button
              key={w.adapter.name}
              onClick={() => pick(w.adapter.name)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/10 transition-colors text-left"
            >
              {w.adapter.icon && (
                <img src={w.adapter.icon} alt="" className="w-6 h-6 rounded" />
              )}
              <span className="text-white text-sm">
                {WALLET_LABELS[w.adapter.name] || w.adapter.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}