'use client';
// app/Providers.js — wrap your app so useWallet() works everywhere.
// In app/layout.js:  <body><Providers>{children}</Providers></body>
import { useMemo } from 'react';
import { WalletProvider } from '@tronweb3/tronwallet-adapter-react-hooks';
import {
  WalletNotFoundError,
  WalletDisconnectedError,
} from '@tronweb3/tronwallet-abstract-adapter';
import { getAdapters } from '@/lib/wallet';

export default function Providers({ children }) {
  const adapters = useMemo(() => getAdapters(), []);

  function onError(e) {
    // Wire this into your toast system if you have one.
    if (e instanceof WalletNotFoundError) {
      console.error('Wallet not found:', e.message);
    } else if (e instanceof WalletDisconnectedError) {
      console.error('Wallet disconnected:', e.message);
    } else {
      console.error('[wallet]', e?.message || e);
    }
  }

  // autoConnect: connects right after a wallet is selected, and reconnects the
  // last wallet on page load. This is why WalletButton only needs select().
  return (
    <WalletProvider adapters={adapters} onError={onError} autoConnect>
      {children}
    </WalletProvider>
  );
}