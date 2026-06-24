'use client';
import { useMemo } from 'react';
import { WalletProvider } from '@tronweb3/tronwallet-adapter-react-hooks';
import { 
  TronLinkAdapter, 
  WalletConnectAdapter, 
  OkxWalletAdapter,
  TokenPocketAdapter,
  BitKeepAdapter,
} from '@tronweb3/tronwallet-adapters';

export default function Providers({ children }) {
  const adapters = useMemo(() => {
    if (typeof window === 'undefined') return [];

    const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;
    const list = [
      new TronLinkAdapter(),
      new OkxWalletAdapter(),
      new BitKeepAdapter(),
      new TokenPocketAdapter(),
    ];
    if (projectId) {
      try {
        list.push(new WalletConnectAdapter({
          network: 'Mainnet',
          options: {
            relayUrl: 'wss://relay.walletconnect.com',
            projectId,
            metadata: {
              name: 'HushUSD',
              description: 'HUSD airdrop',
              url: window.location.origin,
              icons: ['https://hushusd.com/logo.png'],
            },
          },
          web3ModalConfig: { themeMode: 'dark' },
        }));
      } catch(e) {
        console.error('[wallet] WC init failed:', e);
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
        if (e?.message === 'The QR window is closed.') return;
        console.error('[wallet]', e?.message || e);
      }}
    >
      {children}
    </WalletProvider>
  );
}