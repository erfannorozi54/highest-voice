'use client';

import { useState } from 'react';
import { parseEther } from 'viem';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTipWinner, useAuctionTips } from '@/hooks/useHighestVoiceFeatures';
import { motion, AnimatePresence } from 'framer-motion';

interface TipButtonProps {
  contractAddress: `0x${string}`;
  auctionId: bigint;
  winnerAddress: string;
}

export function TipButton({ contractAddress, auctionId, winnerAddress }: TipButtonProps) {
  const [open, setOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState('0.01');
  
  const { tips, refetch: refetchTips } = useAuctionTips(contractAddress, auctionId);
  const { tipWinner, isPending, isConfirming, isSuccess, error, hash } = useTipWinner(contractAddress);

  const handleTip = () => {
    try {
      const amount = parseEther(tipAmount);
      if (amount <= 0n) {
        throw new Error('Amount must be greater than 0');
      }
      tipWinner(auctionId, amount);
    } catch (err) {
      console.error('Tip error:', err);
    }
  };

  // Reset and close on success
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isSuccess) {
      refetchTips();
      setTipAmount('0.01');
    }
    setOpen(newOpen);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-gradient-to-r from-pink-500/20 to-rose-500/20 hover:from-pink-500/30 hover:to-rose-500/30 border border-pink-500/40 text-pink-300 rounded-lg transition-all text-sm font-semibold"
      >
        💝 Tip Winner
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => !isPending && !isConfirming && setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 to-black border border-pink-500/30 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {isSuccess ? (
                <div className="py-8 text-center space-y-4">
                  <div className="text-6xl">✅</div>
                  <div>
                    <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                      Tip Sent!
                    </p>
                    <p className="text-sm text-white/60 mt-2">
                      Your tip has been sent to the winner
                    </p>
                  </div>
                  {hash && (
                    <p className="text-xs font-mono text-white/40 break-all">
                      {hash.slice(0, 10)}...{hash.slice(-8)}
                    </p>
                  )}
                  <Button
                    onClick={() => setOpen(false)}
                    className="mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    Close
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">
                      💝 Tip the Winner
                    </h3>
                    <p className="text-white/60 text-sm mt-2">
                      Support great content • 90% to winner, 10% to treasury
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-white/70 mb-2 block">Tip Amount (ETH)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.001"
                        value={tipAmount}
                        onChange={(e) => setTipAmount(e.target.value)}
                        placeholder="0.01"
                        disabled={isPending || isConfirming}
                        className="bg-black/40 border-pink-500/30 text-white"
                      />
                    </div>

                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2 text-sm">
                      <div className="flex justify-between text-white/80">
                        <span>Winner receives:</span>
                        <span className="font-bold text-green-400">
                          {(parseFloat(tipAmount || '0') * 0.9).toFixed(4)} ETH (90%)
                        </span>
                      </div>
                      <div className="flex justify-between text-white/60">
                        <span>Treasury fee:</span>
                        <span>{(parseFloat(tipAmount || '0') * 0.1).toFixed(4)} ETH (10%)</span>
                      </div>
                    </div>

                    {tips && (
                      <div className="text-sm text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 p-3 rounded-lg">
                        📊 Total tips: {parseFloat(tips.total).toFixed(4)} ETH
                      </div>
                    )}

                    {error && (
                      <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded-lg">
                        ❌ {error.message || 'Transaction failed'}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setOpen(false)}
                      disabled={isPending || isConfirming}
                      className="flex-1 border-gray-600 hover:border-gray-500 text-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleTip}
                      disabled={isPending || isConfirming || !tipAmount || parseFloat(tipAmount) <= 0}
                      className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
                    >
                      {isPending || isConfirming ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          {isPending ? 'Confirming...' : 'Processing...'}
                        </>
                      ) : (
                        <>
                          💝 Send Tip
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
