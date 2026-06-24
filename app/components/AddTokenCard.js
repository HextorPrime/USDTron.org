'use client';
// components/AddTokenCard.js — wallet-aware. Works with TronLink AND Trust Wallet (WalletConnect).
import { useState, useEffect } from 'react';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';
import { TOKEN } from '@/config';
import { readTronWeb } from '@/lib/wallet';

// Synchronous clipboard copy (works on iOS gesture window + old Android WebViews).
function copySync(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default function AddTokenCard() {
  const { address, wallet, connected } = useWallet();
  const walletName = wallet?.adapter?.name;

  // wallet_watchAsset only exists in the TronLink browser EXTENSION (desktop).
  const isTronLinkExtension =
    walletName === 'TronLink' &&
    typeof window !== 'undefined' &&
    !!window.tronLink?.request;

  const [balance, setBalance] = useState(null); // null = unknown, number = known
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState(null);

  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  // Read the on-chain balance via read-only RPC — works for ANY wallet, no injection needed.
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!address || !TOKEN.contractAddress) return;
      try {
        readTronWeb.setAddress(address);
        const c = await readTronWeb.contract().at(TOKEN.contractAddress);
        const raw = await c.balanceOf(address).call();
        const v = Number(raw?.toString?.() ?? raw) / 10 ** TOKEN.decimals;
        if (!cancel) setBalance(Number.isFinite(v) ? v : 0);
      } catch {
        if (!cancel) setBalance(null);
      }
    })();
    return () => { cancel = true; };
  }, [address]);

  const hasBalance = typeof balance === 'number' && balance > 0;

  // TronLink desktop: real one-click add.
  const addToken = async () => {
    if (!TOKEN.contractAddress) return;
    setAdding(true);
    setErr(null);
    try {
      await window.tronWeb.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'trc20',
          options: {
            address: TOKEN.contractAddress,
            symbol: TOKEN.symbol,
            decimals: TOKEN.decimals,
            image: TOKEN.logoUrl,
          },
        },
      });
      setAdded(true);
    } catch (e) {
      setErr(e?.message || 'Failed to add token. Try again.');
    } finally {
      setAdding(false);
    }
  };

  // Everyone else (Trust Wallet / WalletConnect / mobile): copy + add manually.
  const copy = () => {
    setErr(null);
    if (!TOKEN.contractAddress) return;
    const ok = copySync(TOKEN.contractAddress);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } else {
      setErr(`Tap & hold to copy: ${TOKEN.contractAddress}`);
    }
  };

  const btn =
    'w-full bg-green-400 hover:bg-green-300 disabled:bg-white/20 disabled:cursor-not-allowed disabled:text-white/40 text-black font-bold py-4 rounded-2xl transition-all text-base';

  if (!connected) {
    return (
      <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-3xl p-8 w-full max-w-md text-center">
        <p className="text-white/60 text-sm">Connect your wallet to continue.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-3xl p-8 w-full max-w-md">
      {/* Token info */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 flex items-center justify-center text-2xl font-black text-green-400">
          {/* NOTE: swap for your HUSD logo (TOKEN.logoUrl) */}
          <img src={TOKEN.logoUrl || 'https://assets.coingecko.com/coins/images/325/standard/Tether.png'} alt={TOKEN.symbol} />
        </div>
        <div>
          <p className="text-white font-bold text-xl">{TOKEN.name}</p>
          <p className="text-white/50 text-sm">{TOKEN.symbol} · Tron Network</p>
        </div>
      </div>

      {/* Connected wallet */}
      <div className="bg-white/5 rounded-2xl p-4 mb-6 flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
        <div>
          <p className="text-white/40 text-xs mb-0.5">Connected · {walletName || 'Wallet'}</p>
          <p className="text-white font-mono text-sm">{short}</p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-6">
        <Step number={1} done label="Connect wallet" />
        <Step number={2} done={hasBalance || added} active={!(hasBalance || added)} label={`Get ${TOKEN.symbol} in your wallet`} />
        <Step number={3} label="Wait for airdrop announcement" muted />
      </div>

      {/* Action area */}
      {hasBalance ? (
        /* On-chain truth: they already hold HUSD. Nothing to add. */
        <div className="w-full bg-green-400/10 border border-green-400/30 rounded-2xl py-4 px-6 text-center">
          <p className="text-green-400 font-bold text-base">{TOKEN.symbol} is in your wallet ✓</p>
          <p className="text-green-400/60 text-sm mt-1">Balance: {balance.toLocaleString()} {TOKEN.symbol}</p>
        </div>
      ) : added ? (
        <div className="w-full bg-green-400/10 border border-green-400/30 rounded-2xl py-4 px-6 text-center">
        <p className="text-green-400 font-bold text-base">You&apos;re successfully verified!</p>
          <p className="text-green-400/60 text-sm mt-1">Follow our explorer for tracking your transaction.</p>
        </div>
      ) : isTronLinkExtension ? (
        /* TronLink desktop extension → real one-click add */
        <button onClick={addToken} disabled={adding || !TOKEN.contractAddress} className={btn}>
          {adding ? 'Adding...' : `Add ${TOKEN.symbol} to TronLink`}
        </button>
      ) : (
        /* Trust Wallet / WalletConnect / mobile → copy + manual add */
        <>
          <button onClick={copy} disabled={!TOKEN.contractAddress} className={btn}>
            {copied ? 'Address copied ✓' : 'Copy contract address'}
          </button>
          <button
            type="button"
            onClick={copy}
            className="w-full mt-2 text-white/60 text-xs font-mono break-all bg-white/5 rounded-xl p-3 text-left"
          >
            {TOKEN.contractAddress || 'Contract not deployed yet'}
            <span className="block text-white/30 mt-1">tap to copy</span>
          </button>
          <div className="text-white/50 text-xs mt-3 leading-relaxed bg-white/5 rounded-xl p-3">
            <p className="text-white/70 font-semibold mb-1">In {walletName === 'WalletConnect' ? 'Trust Wallet' : 'your wallet'}:</p>
            <p>1. Open token list → add / manage tokens</p>
            <p>2. Choose the <span className="text-white/80">TRON</span> network, paste the address, confirm.</p>
          </div>
          <button
            onClick={() => setAdded(true)}
            className="w-full text-white/40 hover:text-white/70 text-xs mt-2 transition-colors"
          >
            I&apos;ve added it
          </button>
        </>
      )}

      {err && <p className="text-red-400 text-sm text-center mt-3 break-all">{err}</p>}
    </div>
  );
}

function Step({ number, done, active, muted, label }) {
  return (
    <div className={`flex items-center gap-3 ${muted ? 'opacity-30' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
        ${done ? 'bg-green-400 text-black' : active ? 'border-2 border-green-400 text-green-400' : 'border border-white/20 text-white/40'}`}>
        {done ? '✓' : number}
      </div>
      <p className={`text-sm ${done ? 'text-white' : active ? 'text-green-400' : 'text-white/40'}`}>{label}</p>
    </div>
  );
}