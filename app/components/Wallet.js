'use client';
// lib/wallet.js — central wallet + network config.
import { TronLinkAdapter, WalletConnectAdapter } from '@tronweb3/tronwallet-adapters';
import { TronWeb } from 'tronweb'; // older tronweb: `import TronWeb from 'tronweb'`

// ---- network ----
// Use 'Mainnet' in production; switch to 'Nile' while testing the airdrop.
export const NETWORK = 'Mainnet';            // 'Mainnet' | 'Nile' | 'Shasta'
const FULL_HOST = 'https://api.trongrid.io'; // Nile: https://api.nileex.io

// Read-only TronWeb for balance / contract reads. No wallet needed for reads —
// this is how we get balances now that Trust Wallet doesn't inject window.tronWeb.
export const readTronWeb = new TronWeb({ fullHost: FULL_HOST });

// ---- adapters ----
// TronLink  → desktop extension users.
// WalletConnect → Trust Wallet + 600+ other WalletConnect wallets (your 90%).
export function getAdapters() {
  return [
    new TronLinkAdapter(),
    new WalletConnectAdapter({
      network: NETWORK,
      options: {
        relayUrl: 'wss://relay.walletconnect.com',
        // Get a free projectId at cloud.reown.com (WalletConnect Cloud).
        projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID,
        metadata: {
          name: 'HushUSD',
          description: 'HUSD airdrop',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://yourdapp.com',
          icons: ['https://yourdapp.com/logo.png'],
        },
      },
      web3ModalConfig: { themeMode: 'dark' },
    }),
    // Add more later if useful, e.g.:
    // new OkxWalletAdapter(), new BitKeepAdapter()  (import from @tronweb3/tronwallet-adapters)
  ];
}

// Friendly labels for the connect picker (adapter.name → display text).
export const WALLET_LABELS = {
  TronLink: 'TronLink',
  WalletConnect: 'Trust Wallet & others',
};