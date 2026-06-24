'use client';

import { useMemo } from 'react';
import { WalletProvider } from '@tronweb3/tronwallet-adapter-react-hooks';
import {
  TronLinkAdapter,
  OkxWalletAdapter,
  BitKeepAdapter,
  TokenPocketAdapter,
  WalletConnectAdapter,
} from '@tronweb3/tronwallet-adapters';

const isTrustWalletBrowser = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('trust') || window?.ethereum?.isTrust;
};

export default function Providers({ children }) {
  const adapters = useMemo(() => {
    if (typeof window === 'undefined') return [];

    const list = [];

    // ✅ ALWAYS allow native wallets
    list.push(
      new TronLinkAdapter(),
      new OkxWalletAdapter(),
      new TokenPocketAdapter(),
      new BitKeepAdapter()
    );

    // ❌ CRITICAL FIX: DO NOT load WalletConnect inside Trust Wallet
    if (!isTrustWalletBrowser() && process.env.NEXT_PUBLIC_WC_PROJECT_ID) {
      list.push(
        new WalletConnectAdapter({
          network: 'Mainnet',
          options: {
            projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID,
            relayUrl: 'wss://relay.walletconnect.com',
            metadata: {
              name: 'USDT',
              url: window.location.origin,
              icons: ['https://usdtron.org/logo.png'],
            },
          },
        })
      );
    }

    return list;
  }, []);

  return (
    <WalletProvider
      adapters={adapters}
      autoConnect={false}
      onError={(e) => {
        if (e?.message?.includes('QR window is closed')) return;
        console.error('[wallet]', e);
      }}
    >
      {children}
    </WalletProvider>
  );
}