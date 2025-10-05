'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuctionNFT } from '@/hooks/useHighestVoiceFeatures';
import { getOpenSeaUrl, getBlockExplorerUrl } from '@/contracts/config';
import { useChainId } from 'wagmi';
import { motion } from 'framer-motion';

interface NFTDisplayProps {
  contractAddress: `0x${string}`;
  auctionId: bigint;
}

export function NFTDisplay({ contractAddress, auctionId }: NFTDisplayProps) {
  const chainId = useChainId();
  const { nft, tokenId, isLoading } = useAuctionNFT(contractAddress, auctionId);

  if (isLoading) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-white/20">
        <CardHeader>
          <div className="h-6 w-48 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-32 bg-white/10 rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-white/10 rounded-xl animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!nft || !tokenId || tokenId === 0n) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-dashed border-white/10">
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-3">🎨</div>
          <p className="text-sm text-white/60">
            No NFT minted yet
          </p>
          <p className="text-xs text-white/40 mt-1">
            Certificate minted upon settlement
          </p>
        </CardContent>
      </Card>
    );
  }

  const openSeaUrl = getOpenSeaUrl(chainId, contractAddress, nft.tokenId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-indigo-900/20 backdrop-blur-xl border-purple-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400">
              🏆 Winner NFT #{nft.tokenId}
            </CardTitle>
            <CardDescription className="text-white/60">HighestVoice Winner Certificate</CardDescription>
          </div>
          <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full">
            <span className="text-purple-300 text-xs font-mono font-semibold">ERC-721</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* NFT Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div whileHover={{ scale: 1.02 }} className="bg-yellow-500/10 backdrop-blur p-3 rounded-xl border border-yellow-500/30">
            <p className="text-xs text-yellow-400/80 mb-1">🎪 AUCTION</p>
            <p className="font-bold text-yellow-400">#{nft.auctionId}</p>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.02 }} className="bg-green-500/10 backdrop-blur p-3 rounded-xl border border-green-500/30">
            <p className="text-xs text-green-400/80 mb-1">💰 WINNING BID</p>
            <p className="font-bold text-green-400">{parseFloat(nft.winningBid).toFixed(4)} ETH</p>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.02 }} className="bg-blue-500/10 backdrop-blur p-3 rounded-xl border border-blue-500/30">
            <p className="text-xs text-blue-400/80 mb-1">📅 MINTED</p>
            <p className="font-semibold text-blue-400 text-xs">
              {nft.timestamp.toLocaleDateString()}
            </p>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.02 }} className="bg-pink-500/10 backdrop-blur p-3 rounded-xl border border-pink-500/30">
            <p className="text-xs text-pink-400/80 mb-1">💝 TIPS</p>
            <p className="font-bold text-pink-400">{parseFloat(nft.tipsReceived).toFixed(4)} ETH</p>
          </motion.div>
        </div>

        {/* Winning Message */}
        <div>
          <p className="text-sm font-semibold text-purple-300 mb-2">🎤 Winning Message</p>
          <div className="bg-black/40 backdrop-blur p-4 rounded-xl border border-purple-500/20">
            <p className="text-sm leading-relaxed text-white/80">{nft.text || 'No message'}</p>
          </div>
        </div>

        {/* Current Owner */}
        {nft.owner && (
          <div>
            <p className="text-sm font-semibold text-cyan-300 mb-2">👤 Current Owner</p>
            <a
              href={getBlockExplorerUrl(chainId, 'address', nft.owner)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-mono text-sm bg-cyan-500/10 backdrop-blur px-3 py-2 rounded-lg border border-cyan-500/30 hover:border-cyan-500/50 transition-colors text-cyan-300"
            >
              {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
              <span className="text-xs">↗</span>
            </a>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {openSeaUrl && (
            <a href={openSeaUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="outline" className="w-full bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 text-blue-300" size="sm">
                <span className="mr-2">🌊</span>
                OpenSea
              </Button>
            </a>
          )}
          <a
            href={getBlockExplorerUrl(chainId, 'token', `${contractAddress}?a=${nft.tokenId}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="outline" className="w-full bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20 text-purple-300" size="sm">
              Explorer ↗
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
}
