'use client';
import { useState } from 'react';
import { TOKEN } from '@/config';

export default function AddTokenCard({ address, tronWeb }) {
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState(null);

  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  const addToken = async () => {
    if (!TOKEN.contractAddress) return;
    setAdding(true);
    setErr(null);
    try {
      await window.tronLink.request({
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
      setErr(e.message || 'Failed to add token. Try again.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-3xl p-8 w-full max-w-md">
      {/* Token info */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full bg-green-400/20 border border-green-400/40 flex items-center justify-center text-2xl font-black text-green-400">
          Z
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
          <p className="text-white/40 text-xs mb-0.5">Connected Wallet</p>
          <p className="text-white font-mono text-sm">{short}</p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-6">
        <Step number={1} done label="Connect wallet" />
        <Step number={2} done={added} active={!added} label={`Add ${TOKEN.symbol} to your wallet`} />
        <Step number={3} label="Wait for airdrop announcement" muted />
      </div>

      {/* Add token button */}
      {!added ? (
        <button
          onClick={addToken}
          disabled={adding || !TOKEN.contractAddress}
          className="w-full bg-green-400 hover:bg-green-300 disabled:bg-white/20 disabled:cursor-not-allowed disabled:text-white/40 text-black font-bold py-4 rounded-2xl transition-all text-base"
        >
          {adding ? 'Adding...' : `Add ${TOKEN.symbol} to TronLink`}
        </button>
      ) : (
        <div className="w-full bg-green-400/10 border border-green-400/30 rounded-2xl py-4 px-6 text-center">
          <p className="text-green-400 font-bold text-base">You&apos;re on the list!</p>
          <p className="text-green-400/60 text-sm mt-1">Follow our socials for airdrop announcements.</p>
        </div>
      )}

      {!TOKEN.contractAddress && (
        <p className="text-white/20 text-xs text-center mt-3">Contract not deployed yet</p>
      )}

      {err && (
        <p className="text-red-400 text-sm text-center mt-3">{err}</p>
      )}
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
