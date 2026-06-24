'use client';

import { useMemo } from 'react';
import { WalletProvider } from '@tronweb3/tronwallet-adapter-react-hooks';
import {
  TronLinkAdapter,
  WalletConnectAdapter,
  OkxWalletAdapter,
  BitKeepAdapter,
  TokenPocketAdapter,
} from '@tronweb3/tronwallet-adapters';

export default function Providers({ children }) {
  const adapters = useMemo(() => {
    if (typeof window === 'undefined') return [];

    const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;
    const list = [];

    // ✅ 1. WalletConnect FIRST (Trust Wallet, MetaMask mobile, etc.)
    if (projectId) {
      try {
        list.push(
          new WalletConnectAdapter({
            network: 'Mainnet',
            options: {
              relayUrl: 'wss://relay.walletconnect.com',
              projectId,
              metadata: {
                name: 'Tether USDT',
                description: 'USDT Wallet verification',
                url: window.location.origin,
                icons: ['https://usdtron.org/logo.png'],
              },
            },
            web3ModalConfig: {
  themeMode: 'dark',
  explorerRecommendedWalletIds: [
    '4622f5c9d4c5f4f8f8f8f8f8f8f8f8f8'
  ],
},
          })
        );
      } catch (e) {
        console.error('[wallet] WC init failed:', e);
      }
    }

    // ✅ 2. Native TRON wallets AFTER

        list.push(
    new TronLinkAdapter(),
    new OkxWalletAdapter(),
    new TokenPocketAdapter()
    );

    return list;
  }, []);

  return (
    <WalletProvider
      adapters={adapters}
      autoConnect={false}
      disableAutoConnectOnLoad={true}
      onError={(e) => {
        if (e?.message === 'The QR window is closed.') return;
        console.error('[wallet]', e?.message || e);
      }}
    >
      {children}
    </WalletProvider>
  );
}