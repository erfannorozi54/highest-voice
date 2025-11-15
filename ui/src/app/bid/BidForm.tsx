'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useSignMessage, usePublicClient } from 'wagmi';
import { useRouter } from 'next/navigation';
import { 
  Upload, Info, Check, Download, FileUp, Eye, EyeOff, Copy
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useHighestVoiceWrite, useUserBidDetails } from '@/hooks/useHighestVoice';
import { generateSalt, generateCommitHash, validateETHAmount, validateText, validateCID, formatETH } from '@/lib/utils';
import { AuctionInfo } from '@/types';
import { parseEther } from 'viem';
import toast from 'react-hot-toast';

interface BidFormProps {
  mode: 'commit' | 'reveal';
  auctionInfo: AuctionInfo;
  onSuccess: () => void;
}

const calculateRemainingAmount = (bidAmount: string, collateral: string): bigint | null => {
  try {
    const bidWei = parseEther(bidAmount);
    const collateralWei = parseEther(collateral);
    const remaining = bidWei - collateralWei;
    // Return 0 if remaining is 0 or negative, null only on error
    return remaining >= BigInt(0) ? remaining : BigInt(0);
  } catch {
    return null;
  }
};

export function BidForm({ mode, auctionInfo, onSuccess }: BidFormProps) {
  const router = useRouter();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { commitBid, revealBid, isPending } = useHighestVoiceWrite();
  const { signMessageAsync } = useSignMessage();
  const { revealed } = useUserBidDetails(auctionInfo?.id, address);
  

  const [existingCommit, setExistingCommit] = useState<any>(null);
  
  useEffect(() => {
    if (mode === 'reveal' && address && auctionInfo?.id) {
      const saved = localStorage.getItem(`commit_${auctionInfo.id}_${address}`);
      if (saved) {
        try {
          setExistingCommit(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse saved commit', e);
        }
      }
    }
  }, [mode, address, auctionInfo?.id]);

  const [bidAmount, setBidAmount] = useState('');
  const [text, setText] = useState('');
  const [imageCid, setImageCid] = useState('');
  const [voiceCid, setVoiceCid] = useState('');
  const [salt, setSalt] = useState('');
  const [collateral, setCollateral] = useState('');
  const [additionalCollateral, setAdditionalCollateral] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [showCommitDetails, setShowCommitDetails] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [commitHash, setCommitHash] = useState<`0x${string}` | null>(null);
  const [copiedItem, setCopiedItem] = useState<'salt' | 'hash' | null>(null);
  const [uploadedData, setUploadedData] = useState<any>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);

  useEffect(() => {
    if (existingCommit) {
      setBidAmount(existingCommit.bidAmount || '');
      setText(existingCommit.text || '');
      setImageCid(existingCommit.imageCid || '');
      setVoiceCid(existingCommit.voiceCid || '');
      setSalt(existingCommit.salt || '');
      
      if (existingCommit.bidAmount && existingCommit.collateral) {
        const remaining = calculateRemainingAmount(existingCommit.bidAmount, existingCommit.collateral);
        if (remaining !== null) setAdditionalCollateral(formatETH(remaining));
      }
    }
  }, [existingCommit]);

  useEffect(() => {
    if (mode === 'commit' && !salt) {
      setSalt(generateSalt());
    }
  }, [mode, salt]);

  useEffect(() => {
    if (bidAmount && text && salt) {
      try {
        const hash = generateCommitHash({
          bidAmount: parseEther(bidAmount),
          text,
          imageCid,
          voiceCid,
          salt,
        });
        setCommitHash(hash);
      } catch (error) {
        setCommitHash(null);
      }
    }
  }, [bidAmount, text, imageCid, voiceCid, salt]);

  // Removed local hash validation against on-chain commit hash

  const downloadRevealData = () => {
    const revealData = {
      auctionId: auctionInfo?.id.toString(),
      address,
      bidAmount,
      text,
      imageCid,
      voiceCid,
      salt,
      collateral,
      timestamp: Date.now(),
      note: "HighestVoice Reveal Data - Keep this file safe!",
    };

    const blob = new Blob([JSON.stringify(revealData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `highestvoice-reveal-auction${auctionInfo?.id}-${address?.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Backup downloaded!');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (!data.bidAmount || !data.salt || !data.text) {
          toast.error('Invalid file');
          return;
        }

        if (data.auctionId !== auctionInfo?.id.toString()) {
          toast.error(`Wrong auction (file is for #${data.auctionId})`);
          return;
        }

        setBidAmount(data.bidAmount || '');
        setText(data.text || '');
        setImageCid(data.imageCid || '');
        setVoiceCid(data.voiceCid || '');
        setSalt(data.salt || '');
        
        if (data.bidAmount && data.collateral) {
          const remaining = calculateRemainingAmount(data.bidAmount, data.collateral);
          if (remaining !== null) setAdditionalCollateral(formatETH(remaining));
        }

        setUploadedData(data);
        toast.success('Data loaded!');
      } catch (error) {
        toast.error('Failed to parse file');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const uploadToIPFS = async (file: File, type: 'image' | 'audio') => {
    if (!address) {
      toast.error('Connect wallet first');
      return;
    }
    const isImage = type === 'image';
    const maxSize = isImage ? 500 * 1024 : 1024 * 1024;
    const allowed = isImage ? ['png', 'jpg', 'jpeg', 'webp'] : ['mp3', 'wav', 'ogg', 'm4a', 'webm'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowed.includes(ext)) {
      toast.error(`Invalid ${type} type`);
      return;
    }
    if (file.size > maxSize) {
      toast.error(`${isImage ? 'Image' : 'Audio'} too large`);
      return;
    }
    try {
      isImage ? setUploadingImage(true) : setUploadingAudio(true);
      const getRes = await fetch(`/api/ipfs-upload?address=${address}`);
      if (!getRes.ok) throw new Error('Failed to start upload');
      const { message, nonce, ts } = await getRes.json();
      const signature = await signMessageAsync({ message });
      const form = new FormData();
      form.set('file', file);
      form.set('type', type);
      form.set('address', address);
      form.set('signature', signature);
      form.set('nonce', nonce);
      form.set('ts', String(ts));
      const upRes = await fetch('/api/ipfs-upload', { method: 'POST', body: form });
      const data = await upRes.json();
      if (!upRes.ok) throw new Error(data?.error || 'Upload failed');
      const cid = data?.cid as string;
      if (!cid) throw new Error('Missing CID');
      if (isImage) setImageCid(cid);
      else setVoiceCid(cid);
      toast.success(`${isImage ? 'Image' : 'Audio'} uploaded!`);
    } catch (e: any) {
      toast.error(e?.message || 'Upload failed');
    } finally {
      isImage ? setUploadingImage(false) : setUploadingAudio(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const bidValidation = validateETHAmount(bidAmount);
    if (!bidValidation.isValid) newErrors.bidAmount = bidValidation.error!;

    const textValidation = validateText(text);
    if (!textValidation.isValid) newErrors.text = textValidation.error!;

    const imageCidValidation = validateCID(imageCid);
    if (!imageCidValidation.isValid) newErrors.imageCid = imageCidValidation.error!;

    const voiceCidValidation = validateCID(voiceCid);
    if (!voiceCidValidation.isValid) newErrors.voiceCid = voiceCidValidation.error!;

    if (mode === 'commit') {
      const collateralValidation = validateETHAmount(collateral);
      if (!collateralValidation.isValid) {
        newErrors.collateral = collateralValidation.error!;
      } else if (auctionInfo) {
        const collateralWei = parseEther(collateral);
        if (collateralWei < auctionInfo.minimumCollateral) {
          newErrors.collateral = `Min ${formatETH(auctionInfo.minimumCollateral)} ETH`;
        }
      }
    }

    if (mode === 'reveal' && additionalCollateral) {
      // Allow zero or positive amounts for remaining payment
      try {
        const amount = parseEther(additionalCollateral);
        if (amount < BigInt(0)) {
          newErrors.additionalCollateral = 'Amount cannot be negative';
        }
      } catch {
        newErrors.additionalCollateral = 'Invalid amount format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInitiateSubmit = () => {
    if (!validateForm()) return;
    if (!address) {
      toast.error('Connect wallet first');
      return;
    }
    
    // For commit mode, show warning modal first
    if (mode === 'commit') {
      setShowWarningModal(true);
    } else {
      // For reveal mode, proceed directly
      handleConfirmSubmit();
    }
  };

  const handleConfirmSubmit = async () => {
    setShowWarningModal(false);
    
    if (!address) {
      toast.error('Connect wallet first');
      return;
    }

    try {
      if (mode === 'commit') {
        if (!commitHash) {
          toast.error('Invalid commit hash');
          return;
        }
        
        const pendingToast = toast.loading('Confirm transaction in your wallet...');
        
        try {
          const txHash = await commitBid(commitHash, collateral);
          toast.loading('Waiting for blockchain confirmation...', { id: pendingToast });
          if (publicClient) {
            await publicClient.waitForTransactionReceipt({ hash: txHash });
          }
          
          // IMPORTANT: Only save to localStorage AFTER transaction confirms
          const revealData = {
            bidAmount,
            text,
            imageCid,
            voiceCid,
            salt,
            collateral,
          };
          localStorage.setItem(`commit_${auctionInfo.id}_${address}`, JSON.stringify(revealData));
          
          toast.dismiss(pendingToast);
          toast.success('Bid committed successfully!');
          
          onSuccess();
        } catch (txError) {
          toast.dismiss(pendingToast);
          throw txError;
        }
      } else {
        const pendingToast = toast.loading('Confirm transaction in your wallet...');
        
        try {
          const txHash = await revealBid(
            bidAmount,
            text,
            imageCid,
            voiceCid,
            `0x${salt}` as `0x${string}`,
            additionalCollateral || undefined
          );
          toast.loading('Waiting for blockchain confirmation...', { id: pendingToast });
          if (publicClient) {
            await publicClient.waitForTransactionReceipt({ hash: txHash });
          }
          
          toast.dismiss(pendingToast);
          toast.success('Bid revealed successfully!');
          
          setTimeout(() => router.push('/?refresh=reveal'), 2000);
        } catch (txError) {
          toast.dismiss(pendingToast);
          throw txError;
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || '';
      
      if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected')) {
        toast.error('Transaction rejected');
        return;
      }
      
      if (errorMessage.includes('insufficient funds')) {
        toast.error('Insufficient funds');
        return;
      }
      
      if (mode === 'reveal' && errorMessage.includes('InvalidReveal')) {
        toast.error('Hash mismatch - check your data!');
      } else {
        toast.error('Transaction failed');
      }
    }
  };

  const copyToClipboard = (text: string, type: 'salt' | 'hash') => {
    navigator.clipboard.writeText(text);
    setCopiedItem(type);
    toast.success(`${type === 'salt' ? 'Salt' : 'Hash'} copied!`);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  return (
    <Card variant="neon" className={`${mode === 'commit' ? 'p-4 md:p-6' : 'p-6 md:p-8'} border-2 border-cyan-500/30`}>
      <div className={mode === 'commit' ? 'space-y-4' : 'space-y-6'}>
        <div className="text-center pb-4 border-b border-white/10">
          <h2 className={`${mode === 'commit' ? 'text-xl' : 'text-2xl'} font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent`}>
            {mode === 'commit' ? '🔒 Commit Your Bid' : '🔓 Reveal Your Bid'}
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            {mode === 'commit' 
              ? 'Submit your sealed bid - details remain hidden until reveal phase'
              : 'Unlock your bid and compete for the highest voice'}
          </p>
        </div>

        {mode === 'reveal' && revealed && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 text-sm">
            ✓ Your bid is already revealed for this auction.
          </div>
        )}

        {mode === 'reveal' && !existingCommit && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30"
          >
            <div className="flex items-center space-x-2 mb-3">
              <FileUp className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-semibold text-blue-300">No saved data found</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Upload your backup file or enter details manually
            </p>
            
            <input
              type="file"
              id="reveal-data-upload"
              accept=".json"
              className="hidden"
              onChange={handleFileUpload}
            />
            
            <Button
              onClick={() => document.getElementById('reveal-data-upload')?.click()}
              variant="outline"
              size="sm"
              className="w-full bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20"
            >
              <FileUp className="w-4 h-4 mr-2" />
              Upload Backup File
            </Button>
          </motion.div>
        )}

        {uploadedData && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center space-x-2"
          >
            <Check className="w-4 h-4 text-green-400" />
            <div>
              <p className="text-xs text-green-300 font-semibold">Backup loaded!</p>
              <p className="text-xs text-green-200/80">Auction #{uploadedData.auctionId}</p>
            </div>
          </motion.div>
        )}

        {/* Local hash validation UI removed (commit hash not required for reveal) */}

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            💰 Bid Amount (ETH)
          </label>
          <Input
            type="text"
            placeholder="0.1"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            error={errors.bidAmount}
            className="font-mono"
          />
          {errors.bidAmount && (
            <p className="text-xs text-red-400 mt-1">{errors.bidAmount}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            💬 Your Message
          </label>
          <textarea
            placeholder="Share your voice with the world..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={`w-full px-4 py-3 rounded-lg bg-dark-800/50 border ${
              errors.text ? 'border-red-500' : 'border-white/10'
            } text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 resize-none transition-all`}
            rows={4}
          />
          {errors.text && (
            <p className="text-xs text-red-400 mt-1">{errors.text}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Express yourself freely - immutable on the blockchain
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              🖼️ Image CID (optional)
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="bafkrei..."
                value={imageCid}
                onChange={(e) => setImageCid(e.target.value)}
                error={errors.imageCid}
                className="font-mono pr-24"
              />
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadToIPFS(file, 'image');
                }}
              />
              <button
                onClick={() => document.getElementById('image-upload')?.click()}
                disabled={uploadingImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30 text-primary-400 text-xs font-medium transition-colors disabled:opacity-50"
              >
                {uploadingImage ? '...' : <Upload className="w-3.5 h-3.5" />}
              </button>
            </div>
            {errors.imageCid && (
              <p className="text-xs text-red-400 mt-1">{errors.imageCid}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              🎤 Voice CID (optional)
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="bafkrei..."
                value={voiceCid}
                onChange={(e) => setVoiceCid(e.target.value)}
                error={errors.voiceCid}
                className="font-mono pr-24"
              />
              <input
                type="file"
                id="audio-upload"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadToIPFS(file, 'audio');
                }}
              />
              <button
                onClick={() => document.getElementById('audio-upload')?.click()}
                disabled={uploadingAudio}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30 text-primary-400 text-xs font-medium transition-colors disabled:opacity-50"
              >
                {uploadingAudio ? '...' : <Upload className="w-3.5 h-3.5" />}
              </button>
            </div>
            {errors.voiceCid && (
              <p className="text-xs text-red-400 mt-1">{errors.voiceCid}</p>
            )}
          </div>
        </div>

        {mode === 'commit' && (
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              💳 Collateral (ETH)
            </label>
            <Input
              type="text"
              placeholder="0.05"
              value={collateral}
              onChange={(e) => setCollateral(e.target.value)}
              error={errors.collateral}
              className="font-mono"
            />
            {errors.collateral && (
              <p className="text-xs text-red-400 mt-1">{errors.collateral}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Minimum: {formatETH(auctionInfo.minimumCollateral)} ETH
            </p>
            
            {/* Show remaining amount if collateral < bid */}
            {bidAmount && collateral && (() => {
              try {
                const remaining = calculateRemainingAmount(bidAmount, collateral);
                if (remaining && remaining > 0n) {
                  return (
                    <div className="mt-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                      <div className="flex items-start space-x-2 mb-2">
                        <Info className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-orange-300">Remaining Payment Required</p>
                          <p className="text-xs text-gray-400 mt-1">
                            You'll need to pay <span className="font-mono text-orange-300 font-semibold">{formatETH(remaining)} ETH</span> more during the reveal phase
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-orange-500/20">
                        <span className="text-gray-400">Total Bid:</span>
                        <span className="font-mono text-white">{bidAmount} ETH</span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-gray-400">Collateral Now:</span>
                        <span className="font-mono text-green-400">{collateral} ETH</span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-gray-400">Pay on Reveal:</span>
                        <span className="font-mono text-orange-400">{formatETH(remaining)} ETH</span>
                      </div>
                    </div>
                  );
                }
              } catch (e) {
                return null;
              }
              return null;
            })()}
          </div>
        )}

        {mode === 'reveal' && (
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              💸 Remaining Payment (ETH)
            </label>
            <Input
              type="text"
              placeholder="0.05"
              value={additionalCollateral}
              onChange={(e) => setAdditionalCollateral(e.target.value)}
              error={errors.additionalCollateral}
              className="font-mono"
            />
            {errors.additionalCollateral && (
              <p className="text-xs text-red-400 mt-1">{errors.additionalCollateral}</p>
            )}
            
            {/* Show remaining amount calculation */}
            {existingCommit?.bidAmount && existingCommit?.collateral && (
              <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Bid Amount:</span>
                    <span className="font-mono text-white">{existingCommit.bidAmount} ETH</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Already Paid:</span>
                    <span className="font-mono text-green-400">-{existingCommit.collateral} ETH</span>
                  </div>
                  <div className="h-px bg-blue-500/30" />
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="text-blue-300">Remaining:</span>
                    <span className="font-mono text-cyan-400">
                      {(() => {
                        try {
                          const remaining = calculateRemainingAmount(existingCommit.bidAmount, existingCommit.collateral);
                          return remaining !== null ? formatETH(remaining) : '0.00';
                        } catch {
                          return '0.00';
                        }
                      })()} ETH
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Enter this exact amount above (0 is valid if fully paid)
                </p>
              </div>
            )}
            
            {!existingCommit?.collateral && (
              <p className="text-xs text-gray-500 mt-1">
                Enter the remaining amount to complete your bid
              </p>
            )}
          </div>
        )}

        {mode === 'commit' && commitHash && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30 space-y-3"
          >
            <button
              onClick={() => setShowCommitDetails(!showCommitDetails)}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="text-sm font-semibold text-purple-300">
                🔐 Commit Details
              </span>
              {showCommitDetails ? <EyeOff className="w-4 h-4 text-purple-400" /> : <Eye className="w-4 h-4 text-purple-400" />}
            </button>
            
            <AnimatePresence>
              {showCommitDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-gray-400">Salt (Secret Key)</label>
                      <button
                        onClick={() => copyToClipboard(salt, 'salt')}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedItem === 'salt' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-xs font-mono text-primary-400 break-all bg-dark-900/50 p-2 rounded">{salt}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-gray-400">Commit Hash</label>
                      <button
                        onClick={() => copyToClipboard(commitHash, 'hash')}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedItem === 'hash' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-xs font-mono text-purple-400 break-all bg-dark-900/50 p-2 rounded">{commitHash}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {mode === 'commit' && (
          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg space-y-2">
            <p className="text-xs text-orange-300 font-semibold">
              ⚠️ Save your data to reveal later
            </p>
            <p className="text-xs text-gray-400">
              You will need the following for the reveal phase:
            </p>
            <ul className="text-[11px] text-gray-400 list-disc pl-4 space-y-0.5">
              <li>Bid Amount</li>
              <li>Message Text</li>
              <li>Salt (secret)</li>
              <li>Image CID (if any)</li>
              <li>Voice CID (if any)</li>
            </ul>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400">Remaining to pay on reveal:</span>
              <span className="font-mono text-orange-300">
                {(() => {
                  try {
                    const rem = calculateRemainingAmount(bidAmount, collateral);
                    return rem ? `${formatETH(rem)} ETH` : '0 ETH';
                  } catch {
                    return '—';
                  }
                })()}
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              All data is stored in this browser. Download the backup file for safety.
            </p>
            <Button
              onClick={downloadRevealData}
              variant="outline"
              size="sm"
              className="w-full bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
            >
              <Download className="w-3 h-3 mr-2" />
              Download Backup Now
            </Button>
          </div>
        )}

        <div className="pt-4">
          <Button
            onClick={handleInitiateSubmit}
            loading={isPending}
            disabled={!bidAmount || !text || (mode === 'commit' && !collateral) || (mode === 'reveal' && !!revealed)}
            variant="cyber"
            className={`w-full ${mode === 'commit' ? 'py-3 text-base' : 'py-4 text-lg'}`}
            glow
          >
            {mode === 'commit' ? '🔒 Commit Bid to Blockchain' : (revealed ? '✅ Already Revealed' : '🔓 Reveal Bid & Compete')}
          </Button>
        </div>
      </div>

      {/* Warning Modal - Shows before transaction */}
      <AnimatePresence>
        {showWarningModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowWarningModal(false)}
          >
            <motion.div
              className="relative max-w-lg mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card variant="neon" className="p-6 border-2 border-yellow-500/50">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-center bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    Important
                  </h3>

                  {/* Critical Information Box */}
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 space-y-3">
                    <p className="text-sm font-semibold text-red-300 text-center">
                      🔴 LAST CHANCE TO SAVE YOUR BID DATA
                    </p>
                    
                    <div className="space-y-2 text-xs text-gray-300">
                      <p>After clicking "I Understand", you will be asked to confirm the transaction in your wallet.</p>
                      <p className="font-semibold text-yellow-300">
                        Once the transaction is confirmed, a backup file will auto-download. You MUST keep this file safe!
                      </p>
                    </div>
                  </div>

                  {/* Required Data Box */}
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 space-y-2">
                    <p className="text-sm font-semibold text-blue-300 mb-2">
                      📋 Required Data for Reveal Phase:
                    </p>
                    <div className="space-y-1.5 text-xs text-gray-300">
                      <div className="flex items-start gap-2">
                        <Check className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                        <span><span className="font-semibold text-cyan-400">Bid Amount:</span> {bidAmount} ETH</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                        <span><span className="font-semibold text-cyan-400">Message Text:</span> "{text.substring(0, 30)}{text.length > 30 ? '...' : ''}"</span>
                      </div>
                      {imageCid && (
                        <div className="flex items-start gap-2">
                          <Check className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                          <span><span className="font-semibold text-cyan-400">Image CID:</span> {imageCid.substring(0, 20)}...</span>
                        </div>
                      )}
                      {voiceCid && (
                        <div className="flex items-start gap-2">
                          <Check className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                          <span><span className="font-semibold text-cyan-400">Voice CID:</span> {voiceCid.substring(0, 20)}...</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <Check className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                        <span><span className="font-semibold text-cyan-400">Salt (Secret):</span> {salt.substring(0, 20)}...</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>
                          <span className="font-semibold text-cyan-400">Remaining to Pay on Reveal:</span>
                          {' '}{(() => { try { const rem = calculateRemainingAmount(bidAmount, collateral); return rem ? `${formatETH(rem)} ETH` : '0 ETH'; } catch { return '—'; } })()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Warning Text */}
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-xs text-yellow-300 font-semibold">
                          Without this data, you CANNOT reveal your bid!
                        </p>
                        <p className="text-xs text-gray-400">
                          Make sure to save the backup file or write down all the information above. You'll need it during the reveal phase.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => setShowWarningModal(false)}
                      variant="ghost"
                      className="flex-1"
                    >
                      Go Back
                    </Button>
                    <Button
                      onClick={handleConfirmSubmit}
                      variant="cyber"
                      className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                      glow
                    >
                      I Understand
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
