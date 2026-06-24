'use client';
// app/Providers.js — self-contained. No external adapter import to break.
import { useMemo } from 'react';
import { WalletProvider } from '@tronweb3/tronwallet-adapter-react-hooks';
import { TronLinkAdapter, WalletConnectAdapter } from '@tronweb3/tronwallet-adapters';

export default function Providers({ children }) {
  const adapters = useMemo(() => {
    // TronLink always works (no config needed).
    const list = [new TronLinkAdapter()];

    // Only add WalletConnect (Trust Wallet) if a projectId is present — otherwise
    // its constructor can throw and take the whole provider down with it.
    const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;
    if (projectId) {
      try {
        list.push(
          new WalletConnectAdapter({
            network: 'Mainnet', // 'Nile' while testing
            options: {
              relayUrl: 'wss://relay.walletconnect.com',
              projectId,
              metadata: {
                name: 'HushUSD',
                description: 'HUSD airdrop',
                url: typeof window !== 'undefined' ? window.location.origin : 'https://yourdapp.com',
                icons: ['https://yourdapp.com/logo.png'],
              },
            },
            web3ModalConfig: { themeMode: 'dark' },
          })
        );
      } catch (e) {
        console.error('[wallet] WalletConnect init failed:', e?.message || e);
      }
    }
    return list;
  }, []);

  return (
    <WalletProvider
      adapters={adapters}
      autoConnect
      onError={(e) => console.error('[wallet]', e?.message || e)}
    >
      {children}
    </WalletProvider>
  );
}