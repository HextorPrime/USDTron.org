'use client';

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';

const LABELS = {
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
    connecting,
    select,
    connect,
    disconnect,
  } = useWallet();

  const [flow, setFlow] = useState('idle');
  const [mobile, setMobile] = useState(false);

  const lockRef = useRef(false);

  const short = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  /**
   * Detect environment
   */
  useEffect(() => {
    setMobile(isMobile());
  }, []);

  /**
   * 🚨 TRUST WALLET AUTO MODE (IMPORTANT FIX)
   * Inside Trust Wallet app → no UI, no selection, just connect
   */
  useEffect(() => {
    if (!isTrustWalletBrowser()) return;

    setFlow('connecting');

    select('WalletConnect')
      .then(() => connect())
      .catch((e) => {
        console.warn('Auto connect error:', e);
        setFlow('error');
      });
  }, []);

  /**
   * NORMAL CONNECT FLOW
   */
  useEffect(() => {
    if (flow !== 'connecting') return;
    if (!wallet) return;
    if (lockRef.current) return;

    lockRef.current = true;

    connect()
      .then(() => setFlow('connected'))
      .catch((e) => {
        console.warn('Wallet connect error:', e);
        setFlow('error');
      })
      .finally(() => {
        lockRef.current = false;
      });
  }, [flow, wallet, connect]);

  /**
   * Sync external wallet state
   */
  useEffect(() => {
    if (connected) {
      setFlow('connected');
    }
  }, [connected]);

  /**
   * Open Trust Wallet deep link (mobile external browser only)
   */
  const openTrustWallet = () => {
    const url = window.location.href;

    const trustUrl =
      'https://link.trustwallet.com/open_url?url=' +
      encodeURIComponent(url);

    window.location.href = trustUrl;
  };

  /**
   * Wallet selection
   */
  const selectWallet = async (name) => {
    setFlow('selecting');

    // 🚨 If inside Trust Wallet app → ignore selection UI
    if (isTrustWalletBrowser()) {
      setFlow('connecting');
      return;
    }

    if (name === 'TrustWallet') {
      if (mobile) {
        setFlow('redirecting');
        openTrustWallet();
        return;
      }

      // Desktop → QR (WalletConnect)
      await select('WalletConnect');
      setFlow('connecting');
      return;
    }

    await select(name);
    setFlow('connecting');
  };

  /**
   * CONNECTED UI
   */
  if (flow === 'connected') {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-white font-mono">{short}</span>
        </div>

        <button
          onClick={() => {
            disconnect();
            setFlow('idle');
          }}
          className="text-xs text-white/50 hover:text-white/80"
        >
          Disconnect
        </button>
      </div>
    );
  }

  /**
   * TRUST WALLET MODE → NO UI (IMPORTANT FIX)
   */
  if (isTrustWalletBrowser()) {
    return (
      <div className="text-white text-sm opacity-70">
        Connecting via Trust Wallet...
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setFlow('selecting')}
        disabled={connecting}
        className="bg-white text-black font-semibold text-sm px-5 py-2 rounded-full hover:bg-white/90 transition-all disabled:opacity-60"
      >
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {flow === 'selecting' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setFlow('idle')}
        >
          <div
            className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-80 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">
                Connect Wallet
              </h2>

              <button
                onClick={() => setFlow('idle')}
                className="text-white/40 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            {mobile && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 mb-4">
                <p className="text-blue-300 text-xs font-semibold">
                  📱 Mobile detected
                </p>
                <p className="text-blue-300/70 text-xs mt-1">
                  Will open Trust Wallet if selected
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {/* Trust Wallet */}
              <button
                onClick={() => selectWallet('TrustWallet')}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/10 border border-white/5"
              >
                <img
                  src="https://avatars.githubusercontent.com/u/32179889?s=200&v=4"
                  className="w-8 h-8 rounded-lg"
                  alt="Trust Wallet"
                />

                <div>
                  <span className="text-white text-sm font-medium block">
                    Trust Wallet
                  </span>

                  <span className="text-green-400/60 text-xs">
                    {mobile ? 'Open App' : 'WalletConnect QR'}
                  </span>
                </div>
              </button>

              {/* Other wallets */}
              {wallets
                .filter((w) => w.adapter.name !== 'WalletConnect')
                .map((w) => (
                  <button
                    key={w.adapter.name}
                    onClick={() => selectWallet(w.adapter.name)}
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