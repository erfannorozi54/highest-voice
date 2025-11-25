'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PostCard } from '@/components/PostCard';
import { useWinnerNFT } from '@/hooks/useHighestVoice';
import { useChainId } from 'wagmi';

interface LegendaryHolderProps {
  tokenId: bigint;
  holder: `0x${string}`;
  auctionId: bigint;
  tipAmount: bigint;
  onTip?: () => void;
  onShare?: () => void;
}

interface PostData {
  text: string;
  imageCid?: string;
  voiceCid?: string;
}

export function LegendaryHolder({ tokenId, holder, auctionId, tipAmount, onTip, onShare }: LegendaryHolderProps) {
  const { nft } = useWinnerNFT(tokenId);
  const chainId = useChainId();
  const [postData, setPostData] = useState<PostData | null>(null);

  // Fetch full post data from API to get imageCid and voiceCid
  useEffect(() => {
    const fetchPostData = async () => {
      try {
        const response = await fetch(`/api/winners?chainId=${chainId}`);
        if (response.ok) {
          const data = await response.json();
          const post = data.posts?.find((p: any) => p.auctionId === Number(auctionId));
          if (post) {
            setPostData({
              text: post.text || nft?.text || '',
              imageCid: post.imageCid || '',
              voiceCid: post.voiceCid || '',
            });
          }
        }
      } catch (error) {
        console.error('Error fetching post data:', error);
      }
    };

    if (auctionId && chainId) {
      fetchPostData();
    }
  }, [auctionId, chainId, nft?.text]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-6"
    >
      <Card variant="glass" className="relative overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/20 via-gold-400/10 to-pink-500/20 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-pink-500/10" />
        
        {/* Sparkle Effects */}
        <motion.div
          className="absolute top-4 left-4"
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Sparkles className="w-6 h-6 text-gold-400 opacity-60" />
        </motion.div>
        <motion.div
          className="absolute top-4 right-4"
          animate={{ 
            rotate: [360, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
        >
          <Sparkles className="w-6 h-6 text-pink-400 opacity-60" />
        </motion.div>

        <div className="relative p-6">
          {/* Header - The Most Beloved Voice Badge */}
          <div className="flex items-center justify-center mb-6">
            <motion.div
              animate={{ 
                boxShadow: [
                  '0 0 20px rgba(251, 191, 36, 0.3)',
                  '0 0 40px rgba(251, 191, 36, 0.5)',
                  '0 0 20px rgba(251, 191, 36, 0.3)',
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 border-2 border-gold-300"
            >
              <Crown className="w-6 h-6 text-white drop-shadow-lg" />
              <span className="text-lg font-black text-white tracking-wider drop-shadow-lg">
                THE MOST BELOVED VOICE
              </span>
              <Crown className="w-6 h-6 text-white drop-shadow-lg" />
            </motion.div>
          </div>

          {/* Post Card with legendary variant */}
          <PostCard
            owner={holder}
            text={postData?.text || nft?.text || ''}
            imageCid={postData?.imageCid}
            voiceCid={postData?.voiceCid}
            tipsReceived={tipAmount}
            auctionId={auctionId}
            variant="legendary"
            onTip={onTip}
            onShare={onShare}
          />

          {/* Non-Transferable Badge */}
          <div className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-dark-800/50 border border-pink-500/30">
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">
              Soulbound - Non-Transferable
            </span>
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
          </div>
        </div>

        {/* Corner Decorations */}
        <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-gold-500/30 rounded-tl-2xl" />
        <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-gold-500/30 rounded-br-2xl" />
      </Card>
    </motion.div>
  );
}
