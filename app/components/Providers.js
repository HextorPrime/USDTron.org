'use client';
import { useMemo } from 'react';
import { WalletProvider } from '@tronweb3/tronwallet-adapter-react-hooks';
import {
  TronLinkAdapter,
  OkxWalletAdapter,
  BitKeepAdapter,
  TokenPocketAdapter,
} from '@tronweb3/tronwallet-adapters';
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
            // No explorerRecommendedWalletIds — let the modal show its full
            // wallet picker so the user chooses, instead of auto-routing to one.
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