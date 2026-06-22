'use client';
import { useState, useEffect } from 'react';
import { TOKEN } from '@/config';

function isMobile() {
  return typeof navigator !== 'undefined' &&
    /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

// Works across modern AND old Android WebViews: modern API first, legacy execCommand fallback.
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through */ }
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
    ta.setSelectionRange(0, text.length); // iOS WebView
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// Open the TronLink app (open-wallet deep link) so the user lands ready to add the token.
function openTronLinkApp() {
  try {
    const param = { action: 'open', protocol: 'TronLink', version: '1.0' };
    const encoded = encodeURIComponent(JSON.stringify(param));
    window.location.href = `tronlinkoutside://pull.activity?param=${encoded}`;
  } catch { /* custom scheme may be blocked in some in-app browsers */ }
}

export default function AddTokenCard({ address, tronWeb }) {
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState(null);

  const [mobile, setMobile] = useState(false);
  useEffect(() => { setMobile(isMobile()); }, []); // client-only → no hydration mismatch

  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  // DESKTOP: real auto-add. wallet_watchAsset lives on tronWeb, NOT tronLink.
  const addToken = async () => {
    if (!TOKEN.contractAddress) return;
    setAdding(true);
    setErr(null);
    try {
      const provider = tronWeb || (typeof window !== 'undefined' && window.tronWeb);
      if (!provider?.request) throw new Error('Wallet not connected.');
      await provider.request({
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

  // MOBILE: no auto-add exists. One tap = copy the contract AND open TronLink, ready to paste.
  const copyAndOpen = async () => {
    if (!TOKEN.contractAddress) return;
    setErr(null);
    const ok = await copyToClipboard(TOKEN.contractAddress);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } else {
      setErr(`Tap & hold to copy: ${TOKEN.contractAddress}`);
    }
    // Give the copy a beat to register, then hand off to the TronLink app.
    setTimeout(openTronLinkApp, 350);
  };

  return (
    <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-3xl p-8 w-full max-w-md">
      {/* Token info */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 flex items-center justify-center text-2xl font-black text-green-400">
          {/* NOTE: Tether's logo — swap for your HUSD logo (e.g. TOKEN.logoUrl) */}
          <img src="https://assets.coingecko.com/coins/images/325/standard/Tether.png" alt={TOKEN.symbol} />
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

      {/* Action area */}
      {added ? (
        <div className="w-full bg-green-400/10 border border-green-400/30 rounded-2xl py-4 px-6 text-center">
          <p className="text-green-400 font-bold text-base">You&apos;re on the list!</p>
          <p className="text-green-400/60 text-sm mt-1">Follow our socials for airdrop announcements.</p>
        </div>
      ) : mobile ? (
        <>
          <button
            onClick={copyAndOpen}
            disabled={!TOKEN.contractAddress}
            className="w-full bg-green-400 hover:bg-green-300 disabled:bg-white/20 disabled:cursor-not-allowed disabled:text-white/40 text-black font-bold py-4 rounded-2xl transition-all text-base"
          >
            {copied ? 'Address copied ✓ Opening TronLink…' : `Add ${TOKEN.symbol} (Copy + Open TronLink)`}
          </button>
          <div className="text-white/50 text-xs mt-3 leading-relaxed bg-white/5 rounded-xl p-3">
            <p className="text-white/70 font-semibold mb-1">In TronLink:</p>
            <p>1. Tap <span className="text-green-400 font-bold">+</span> on the home screen → <span className="text-white/80">Add Custom Token</span></p>
            <p>2. Paste the address (already copied) → confirm</p>
            <p className="mt-1">{TOKEN.symbol} will appear in your assets.</p>
          </div>
          <button
            onClick={() => setAdded(true)}
            className="w-full text-white/40 hover:text-white/70 text-xs mt-2 transition-colors"
          >
            I&apos;ve added it
          </button>
        </>
      ) : (
        <button
          onClick={addToken}
          disabled={adding || !TOKEN.contractAddress}
          className="w-full bg-green-400 hover:bg-green-300 disabled:bg-white/20 disabled:cursor-not-allowed disabled:text-white/40 text-black font-bold py-4 rounded-2xl transition-all text-base"
        >
          {adding ? 'Adding...' : `Add ${TOKEN.symbol} to TronLink`}
        </button>
      )}

      {!TOKEN.contractAddress && (
        <p className="text-white/20 text-xs text-center mt-3">Contract not deployed yet</p>
      )}

      {err && (
        <p className="text-red-400 text-sm text-center mt-3 break-all">{err}</p>
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