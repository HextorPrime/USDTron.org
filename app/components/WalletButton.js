'use client';

export default function WalletButton({ status, address, onConnect, onDisconnect }) {
  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  if (status === 'connected') {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-white font-mono">{short}</span>
        </div>
        <button
          onClick={onDisconnect}
          className="text-xs text-white/50 hover:text-white/80 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onConnect}
      disabled={status === 'connecting'}
      className="bg-white text-black font-semibold text-sm px-5 py-2 rounded-full hover:bg-white/90 transition-all disabled:opacity-60"
    >
      {status === 'connecting' ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
