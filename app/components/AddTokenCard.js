'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';
import { TronWeb } from 'tronweb';
import { TOKEN } from '@/config';

const readTronWeb = new TronWeb({ fullHost: 'https://api.trongrid.io' });

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
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  } catch {
    return false;
  }
}

export default function AddTokenCard() {
  const { address, wallet, connected } = useWallet();
  const walletName = wallet?.adapter?.name;

  const isTronLink =
    walletName === 'TronLink' &&
    typeof window !== 'undefined' &&
    !!window.tronWeb?.request;

  const isOKX =
    walletName === 'OkxWallet' &&
    typeof window !== 'undefined' &&
    !!window.okxwallet?.tronLink?.request;

  const isNativeAutoSupported = isTronLink || isOKX;

  const [balance, setBalance] = useState(null);
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState(null);

  const short = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  // balance fetch
  useEffect(() => {
    let cancel = false;

    (async () => {
      if (!address || !TOKEN.contractAddress) return;

      try {
        readTronWeb.setAddress(address);
        const c = await readTronWeb.contract().at(TOKEN.contractAddress);
        const raw = await c.balanceOf(address).call();
        const v =
          Number(raw?.toString?.() ?? raw) / 10 ** TOKEN.decimals;

        if (!cancel) setBalance(Number.isFinite(v) ? v : 0);
      } catch {
        if (!cancel) setBalance(null);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [address]);

  const hasBalance =
    typeof balance === 'number' && balance > 0;

  // ✅ FIXED addToken logic
  const addToken = async () => {
    if (!TOKEN.contractAddress) return;

    setAdding(true);
    setErr(null);

    try {
      // ✅ Only native TRON wallets support auto-add
      if (isNativeAutoSupported) {
        const provider = isOKX
          ? window.okxwallet?.tronLink
          : window.tronWeb;

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
        return;
      }

      // ❌ WalletConnect / Trust Wallet fallback
      setErr(
        'Trust Wallet does not support automatic token import. Please add it manually.'
      );
    } catch (e) {
      setErr(e?.message || 'Failed to add token.');
    } finally {
      setAdding(false);
    }
  };

  const copy = () => {
    setErr(null);

    const ok = copySync(TOKEN.contractAddress);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } else {
      setErr('Tap & hold to copy address');
    }
  };

  if (!connected) return null;

  const btn =
    'w-full bg-green-400 hover:bg-green-300 disabled:bg-white/20 disabled:text-white/40 text-black font-bold py-4 rounded-2xl';

  return (
    <div className="bg-white/10 border border-white/20 rounded-3xl p-8 w-full max-w-md">

      {/* Token */}
      <div className="flex items-center gap-4 mb-8">
        <img
          src={TOKEN.logoUrl}
          className="w-14 h-14 rounded-full"
          alt={TOKEN.symbol}
        />
        <div>
          <p className="text-white font-bold text-xl">
            {TOKEN.name}
          </p>
          <p className="text-white/50 text-sm">
            {TOKEN.symbol} · Tron Network
          </p>
        </div>
      </div>

      {/* Wallet */}
      <div className="bg-white/5 rounded-2xl p-4 mb-6">
        <p className="text-white/40 text-xs">
          Connected · {walletName}
        </p>
        <p className="text-white font-mono text-sm">
          {short}
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-6">
        <Step number={1} done label="Connect wallet" />
        <Step
          number={2}
          done={hasBalance || added}
          active={!(hasBalance || added)}
          label={`Add ${TOKEN.symbol}`}
        />
        <Step number={3} muted label="Wait for airdrop" />
      </div>

      {/* State UI */}
      {hasBalance ? (
        <Success
          title={`${TOKEN.symbol} is already in wallet ✓`}
          sub={`Balance: ${balance} ${TOKEN.symbol}`}
        />
      ) : added ? (
        <Success
          title="Token added ✓"
          sub="You're verified. Follow updates."
        />
      ) : isNativeAutoSupported ? (
        <button onClick={addToken} disabled={adding} className={btn}>
          {adding
            ? 'Confirm in wallet...'
            : `Add ${TOKEN.symbol}`}
        </button>
      ) : (
        <>
          <p className="text-white/60 text-sm text-center mb-3">
            Manual add required for Trust Wallet
          </p>

          <button onClick={copy} className={btn}>
            {copied ? 'Copied ✓' : 'Copy Contract Address'}
          </button>

          <p className="text-white/40 text-xs mt-4 break-all text-center">
            {TOKEN.contractAddress}
          </p>

          <button
            onClick={() => setAdded(true)}
            className="w-full text-white/40 text-xs mt-3"
          >
            I’ve added it ✓
          </button>
        </>
      )}

      {err && (
        <p className="text-red-400 text-sm mt-3 text-center">
          {err}
        </p>
      )}
    </div>
  );
}

function Step({ number, label, done, active, muted }) {
  return (
    <div className={`flex items-center gap-3 ${muted ? 'opacity-30' : ''}`}>
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
        ${
          done
            ? 'bg-green-400 text-black'
            : active
            ? 'border-2 border-green-400 text-green-400'
            : 'border border-white/20 text-white/40'
        }`}
      >
        {done ? '✓' : number}
      </div>
      <p
        className={`text-sm ${
          done
            ? 'text-white'
            : active
            ? 'text-green-400'
            : 'text-white/40'
        }`}
      >
        {label}
      </p>
    </div>
  );
}

function Success({ title, sub }) {
  return (
    <div className="bg-green-400/10 border border-green-400/30 rounded-2xl p-4 text-center">
      <p className="text-green-400 font-bold">{title}</p>
      <p className="text-green-400/60 text-sm mt-1">{sub}</p>
    </div>
  );
}