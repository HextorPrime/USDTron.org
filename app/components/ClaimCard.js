'use client';
import { useClaim } from '@/app/hooks/useClaim';
import { TOKEN } from '@/config';

export default function ClaimCard({ tronWeb, address, balance, onClaimed }) {
  const { claim, claiming, txHash, claimError } = useClaim(tronWeb, address, onClaimed);

  return (
    <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-3xl p-8 w-full max-w-md">
      {/* Token info */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full border border-green-400/40 flex items-center justify-center text-2xl font-bold text-green-400">
          <img src='https://assets.coingecko.com/coins/images/325/standard/Tether.png'/>
        </div>
        <div>
          <p className="text-white font-bold text-xl">{TOKEN.name}</p>
          <p className="text-white/50 text-sm">{TOKEN.symbol} · Tron Network</p>
        </div>
      </div>

      {/* Balance */}
      <div className="bg-white/5 rounded-2xl p-5 mb-6">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Your Balance</p>
        <p className="text-white text-3xl font-bold">
          {balance ?? '—'} <span className="text-white/40 text-lg font-normal">{TOKEN.symbol}</span>
        </p>
      </div>

      {/* Claim */}
      <div className="mb-4">
        <p className="text-white/40 text-xs text-center mb-4">
          Claim {TOKEN.claimAmount} {TOKEN.symbol} to your wallet
        </p>
        <button
          onClick={claim}
          disabled={claiming || !TOKEN.contractAddress}
          className="w-full bg-green-400 hover:bg-green-300 disabled:bg-white/20 disabled:cursor-not-allowed text-black disabled:text-white/40 font-bold py-4 rounded-2xl transition-all text-base"
        >
          {claiming ? 'Claiming...' : `Claim ${TOKEN.claimAmount} ${TOKEN.symbol}`}
        </button>
        {!TOKEN.contractAddress && (
          <p className="text-white/30 text-xs text-center mt-2">Contract not deployed yet</p>
        )}
      </div>

      {/* Tx success */}
      {txHash && (
        <div className="bg-green-400/10 border border-green-400/30 rounded-xl p-4 mt-4">
          <p className="text-green-400 text-sm font-semibold mb-1">Verified successfully!</p>
          <a
            href={`https://tronscan.org/#/transaction/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-300/70 text-xs break-all hover:underline"
          >
            {txHash}
          </a>
        </div>
      )}

      {/* Error */}
      {claimError && (
        <div className="bg-red-400/10 border border-red-400/30 rounded-xl p-4 mt-4">
          <p className="text-red-400 text-sm">{claimError}</p>
        </div>
      )}
    </div>
  );
}
