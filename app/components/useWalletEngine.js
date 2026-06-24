'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';

/**
 * ENV DETECTION
 */
const isMobile = () =>
  /Mobi|Android/i.test(typeof navigator !== 'undefined' ? navigator.userAgent : '');

const isTrustWalletBrowser = () => {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent.toLowerCase();

  return (
    ua.includes('trust') ||
    ua.includes('trustwallet') ||
    window?.ethereum?.isTrust === true
  );
};

/**
 * STATE MACHINE
 */
const STATE = {
  IDLE: 'idle',
  SELECTING: 'selecting',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  REDIRECTING: 'redirecting',
  ERROR: 'error',
};

export function useWalletEngine() {
  const {
    wallets,
    wallet,
    address,
    connected,
    select,
    connect,
    disconnect,
  } = useWallet();

  const [state, setState] = useState(STATE.IDLE);

  const lockRef = useRef(false);

  const shortAddress =
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  /**
   * Sync external state
   */
  useEffect(() => {
    if (connected) setState(STATE.CONNECTED);
  }, [connected]);

  /**
   * MAIN CONNECT FUNCTION
   */
  const connectWallet = useCallback(
    async (type = 'default') => {
      if (lockRef.current) return;
      lockRef.current = true;

      try {
        setState(STATE.SELECTING);

        /**
         * 1. Trust Wallet mobile redirect
         */
        if (type === 'trust' && isMobile() && !isTrustWalletBrowser()) {
          setState(STATE.REDIRECTING);

          window.location.href =
            'https://link.trustwallet.com/open_url?url=' +
            encodeURIComponent(window.location.href);

          return;
        }

        /**
         * 2. CRITICAL FIX:
         * ALWAYS ensure wallet is selected BEFORE connect
         */
        if (!wallet) {
          await select('WalletConnect'); // QR flow
        }

        setState(STATE.CONNECTING);

        /**
         * 3. Connect
         */
        await connect();

        setState(STATE.CONNECTED);
      } catch (e) {
        console.warn('[wallet error]', e);
        setState(STATE.ERROR);
      } finally {
        lockRef.current = false;
      }
    },
    [wallet, select, connect]
  );

  /**
   * DISCONNECT
   */
  const disconnectWallet = useCallback(() => {
    disconnect();
    setState(STATE.IDLE);
  }, [disconnect]);

  return {
    state,
    isConnected: state === STATE.CONNECTED,
    address,
    shortAddress,
    wallets,
    wallet,
    connectWallet,
    disconnectWallet,
  };
}