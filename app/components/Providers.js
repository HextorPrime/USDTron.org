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

    // WalletConnect (Trust Wallet, MetaMask mobile, etc.)
    if (projectId) {
      list.push(
        new WalletConnectAdapter({
          network: 'Mainnet',
          options: {
            projectId,
            relayUrl: 'wss://relay.walletconnect.com',
            metadata: {
              name: 'My dApp',
              url: window.location.origin,
              icons: ['https://usdtron.org/logo.png'],
            },
          },
        })
      );
    }

    // Native wallets
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
        const msg = e?.message || '';

        if (
          msg.includes('QR window is closed') ||
          msg.includes('No wallet is selected')
        ) return;

        console.error('[wallet]', msg);
      }}
    >
      {children}
    </WalletProvider>
  );
}