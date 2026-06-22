'use client';
import { useState } from 'react';
import { TOKEN } from '@/config';

export function useClaim(tronWeb, address, onSuccess) {
  const [claiming, setClaiming] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [claimError, setClaimError] = useState(null);

  const claim = async () => {
    if (!tronWeb || !address || !TOKEN.contractAddress) return;
    setClaiming(true);
    setClaimError(null);
    setTxHash(null);
    try {
      const contract = await tronWeb.contract().at(TOKEN.contractAddress);
      const tx = await contract.claim().send({ from: address });
      setTxHash(tx);
      if (onSuccess) onSuccess();
    } catch (e) {
      setClaimError(e.message || 'Claim failed. Try again.');
    } finally {
      setClaiming(false);
    }
  };

  return { claim, claiming, txHash, claimError };
}
