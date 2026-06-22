'use client';
import { useState, useEffect, useCallback } from 'react';
import { TOKEN } from '@/config';

export function useTronLink() {
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [tronWeb, setTronWeb] = useState(null);
  const [status, setStatus] = useState('disconnected'); // disconnected | connecting | connected | error
  const [error, setError] = useState(null);

  const fetchBalance = useCallback(async (tw, addr) => {
    if (!tw || !addr || !TOKEN.contractAddress) return;
    try {
      const contract = await tw.contract().at(TOKEN.contractAddress);
      const raw = await contract.balanceOf(addr).call();
      setBalance((Number(raw) / 10 ** TOKEN.decimals).toLocaleString());
    } catch {
      setBalance('0');
    }
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setStatus('connecting');
    try {
      if (!window.tronWeb || !window.tronLink) {
        throw new Error('TronLink not found. Please install the TronLink extension.');
      }
      await window.tronLink.request({ method: 'tron_requestAccounts' });
      const tw = window.tronWeb;
      const addr = tw.defaultAddress.base58;
      if (!addr) throw new Error('No account found in TronLink.');
      setTronWeb(tw);
      setAddress(addr);
      setStatus('connected');
      await fetchBalance(tw, addr);
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  }, [fetchBalance]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setBalance(null);
    setTronWeb(null);
    setStatus('disconnected');
    setError(null);
  }, []);

  // Listen for account changes
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.message?.action === 'setAccount') {
        const newAddr = e.data.message.data?.address;
        if (newAddr && tronWeb) {
          setAddress(newAddr);
          fetchBalance(tronWeb, newAddr);
        }
      }
      if (e.data?.message?.action === 'disconnect') {
        disconnect();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [tronWeb, fetchBalance, disconnect]);

  return { address, balance, tronWeb, status, error, connect, disconnect, fetchBalance };
}
