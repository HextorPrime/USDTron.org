'use client';
import { useMemo } from 'react';
import { WalletProvider } from '@tronweb3/tronwallet-adapter-react-hooks';
import {
  TronLinkAdapter,
  OkxWalletAdapter,
  BitKeepAdapter,
  TokenPocketAdapter,
} from '@tronweb3/tronwallet-adapters';
// v3 standalone adapter — proper modal + mobile deep-links
import { WalletConnectAdapter } from '@tronweb3/tronwallet-adapter-walletconnect';

export default function Providers({ children }) {
  const adapters = useMemo(() => {
    if (typeof window === 'undefined') return [];

    const list = [
      new TronLinkAdapter(),
      new OkxWalletAdapter(),
      new TokenPocketAdapter(),
      new BitKeepAdapter(),
    ];

    if (process.env.NEXT_PUBLIC_WC_PROJECT_ID) {
      try {
        list.push(new WalletConnectAdapter({
          network: 'Mainnet',
          options: {
            relayUrl: 'wss://relay.walletconnect.com',
            projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID,
            metadata: {
              name: 'HushUSD',
              description: 'HUSD airdrop',
              url: window.location.origin,
              icons: ['https://usdtron.org/logo.png'],
            },
          },
          web3ModalConfig: {
            themeMode: 'dark',
            // Show these wallets in the modal with deep-links on mobile
            explorerRecommendedWalletIds: [
              '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust
              'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
              '8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4', // OKX
              '38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662', // Bitget
            ],
          },
        }));
      } catch (e) {
        console.error('[wallet] WC v3 init failed:', e);
      }
    }

    return list;
  }, []);

  return (
    <WalletProvider
      adapters={adapters}
      autoConnect={false}
      disableAutoConnectOnLoad={true}
      onError={(e) => {
        if (e?.message?.includes('closed')) return;
        console.error('[wallet]', e);
      }}
    >
      {children}
    </WalletProvider>
  );
}