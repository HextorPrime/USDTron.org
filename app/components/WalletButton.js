'use client';

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';

const LABELS = {
  WalletConnect: 'Trust Wallet',
  TronLink: 'TronLink',
  OkxWallet: 'OKX Wallet',
  BitKeep: 'Bitget Wallet',
  TokenPocket: 'TokenPocket',
};

const ICONS = {
  WalletConnect:
    'https://avatars.githubusercontent.com/u/32179889?s=200&v=4',
};

const isMobile = () =>
  /Mobi|Android/i.test(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  );

/**
 * Detect Trust Wallet in-app browser
 */
const isTrustWalletBrowser = () => {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent.toLowerCase();

  return (
    ua.includes('trust') ||
    ua.includes('trustwallet') ||
    window?.ethereum?.isTrust === true
  );
};

export default function WalletButton() {
  const {
    wallets,
    wallet,
    address,
    connected,
    select,
    connect,
    disconnect,
  } = useWallet();

  const [open, setOpen] = useState(false);
  const [state, setState] = useState('idle');

  const lockRef = useRef(false);
  const trustRedirectedRef = useRef(false);

  const short =
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  useEffect(() => {
    if (connected) setState('connected');
  }, [connected]);

  /**
   * 🚀 MAIN CONNECT FUNCTION
   */
  const pick = async (name) => {
    if (lockRef.current) return;
    lockRef.current = true;

    try {
      setState('connecting');

      const mobile = isMobile();
      const inTrust = isTrustWalletBrowser();

      /**
       * 🟣 CASE 1: TRUST WALLET IN-APP BROWSER
       * → NO deep link allowed
       * → NO WalletConnect
       * → just normal connect attempt
       */
      if (inTrust) {
        await select(name);
        await connect();

        setState('connected');
        setOpen(false);
        return;
      }

      /**
       * 📱 CASE 2: Mobile external browser → Trust Wallet deep link
       * ONLY ONCE (IMPORTANT FIX)
       */
      if (name === 'WalletConnect' && mobile) {
        if (trustRedirectedRef.current) return;

        trustRedirectedRef.current = true;

        window.location.href =
          'https://link.trustwallet.com/open_url?url=' +
          encodeURIComponent(window.location.href);

        return;
      }

      /**
       * 💻 CASE 3: Desktop or normal wallet flow
       */
      await select(name);
      await connect();

      setState('connected');
      setOpen(false);
    } catch (e) {
      console.warn('[wallet error]', e);
      setState('error');
    } finally {
      lockRef.current = false;
    }
  };

  /**
   * CONNECTED UI
   */
  if (connected) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-white font-mono">
            {short}
          </span>
        </div>

        <button
          onClick={disconnect}
          className="text-xs text-white/50 hover:text-white/80"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-white text-black px-5 py-2 rounded-full font-semibold"
      >
        Connect Wallet
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-white text-lg mb-4">
              Connect Wallet
            </h2>

            {/* 🚨 IMPORTANT DEBUG INFO (helps prevent confusion) */}
            {isTrustWalletBrowser() && (
              <p className="text-xs text-yellow-400 mb-3">
                Trust Wallet in-app browser detected
              </p>
            )}

            <div className="flex flex-col gap-2">
              {wallets.map((w) => (
                <button
                  key={w.adapter.name}
                  onClick={() => pick(w.adapter.name)}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/10 border border-white/5"
                >
                  <img
                    src={ICONS[w.adapter.name] || w.adapter.icon}
                    className="w-8 h-8 rounded-lg"
                    alt=""
                  />

                  <div>
                    <span className="text-white text-sm font-medium block">
                      {LABELS[w.adapter.name] || w.adapter.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}