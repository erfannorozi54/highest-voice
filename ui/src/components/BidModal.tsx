'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useSignMessage } from 'wagmi';
import { Hash, Upload, AlertCircle, Info, Check, AlertTriangle, Download, FileUp } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { useHighestVoiceWrite, useUserBidDetails } from '@/hooks/useHighestVoice';
import { generateSalt, generateCommitHash, validateETHAmount, validateText, validateCID, formatETH } from '@/lib/utils';
import { BidCommitData, AuctionInfo } from '@/types';
import { parseEther } from 'viem';
import toast from 'react-hot-toast';

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'commit' | 'reveal';
  auctionInfo: AuctionInfo;
  existingCommit?: {
    bidAmount: string;
    text: string;
    imageCid: string;
    voiceCid: string;
    salt: string;
    collateral?: string;
  };
}

// Helper function to calculate remaining amount
const calculateRemainingAmount = (bidAmount: string, collateral: string): bigint | null => {
  try {
    const bidWei = parseEther(bidAmount);
    const collateralWei = parseEther(collateral);
    const remaining = bidWei - collateralWei;
    return remaining > BigInt(0) ? remaining : null;
  } catch {
    return null;
  }
};

// Reusable Warning Component
const CommitWarningBox: React.FC<{ onDownload: () => void }> = ({ onDownload }) => (
  <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded space-y-1.5">
    <div>
      <p className="text-xs text-orange-300 font-semibold mb-1">
        ⚠️ You need the salt to reveal your bid
      </p>
      <p className="text-xs text-gray-400">
        All key data—bid amount, text/image/voice CID, salt, and remaining balance—are stored in this browser. For safety, still save this file or write the values down.
      </p>
    </div>
    
    <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded">
      <p className="text-[10px] leading-tight text-blue-300">
        💡 <span className="font-semibold">Tip:</span> Save the remaining balance to use as the exact amount during reveal. Any overpayment is recoverable.
      </p>
    </div>
    
    {/* Backup Button */}
    <Button
      onClick={onDownload}
      variant="outline"
      size="sm"
      className="w-full bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
    >
      <Download className="w-3 h-3 mr-2" />
      Download Backup File
    </Button>
  </div>
);

const BidModal: React.FC<BidModalProps> = ({
  isOpen,
  onClose,
  mode,
  auctionInfo,
  existingCommit,
}) => {
  const { address } = useAccount();
  const { commitBid, revealBid, isPending } = useHighestVoiceWrite();
  const { signMessageAsync } = useSignMessage();
  const { commitHash: onChainCommitHash } = useUserBidDetails(auctionInfo.id);

  // Form state
  const [bidAmount, setBidAmount] = useState(existingCommit?.bidAmount || '');
  const [text, setText] = useState(existingCommit?.text || '');
  const [imageCid, setImageCid] = useState(existingCommit?.imageCid || '');
  const [voiceCid, setVoiceCid] = useState(existingCommit?.voiceCid || '');
  const [salt, setSalt] = useState(existingCommit?.salt || '');
  const [collateral, setCollateral] = useState('');
  const [additionalCollateral, setAdditionalCollateral] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  // UI state - Start collapsed to save space
  const [showCommitDetails, setShowCommitDetails] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [commitHash, setCommitHash] = useState<`0x${string}` | null>(null);
  const [copiedItem, setCopiedItem] = useState<'salt' | 'hash' | null>(null);
  const [uploadedData, setUploadedData] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [hashValidation, setHashValidation] = useState<'unknown' | 'valid' | 'invalid'>('unknown');

  // Auto-calculate remaining amount for reveal mode
  useEffect(() => {
    if (mode === 'reveal' && existingCommit?.bidAmount && existingCommit?.collateral) {
      const remaining = calculateRemainingAmount(existingCommit.bidAmount, existingCommit.collateral);
      if (remaining) {
        setAdditionalCollateral(formatETH(remaining));
      }
    }
  }, [mode, existingCommit]);

  // Validate hash when in reveal mode and data changes
  useEffect(() => {
    if (mode === 'reveal' && onChainCommitHash && bidAmount && salt) {
      try {
        const calculatedHash = generateCommitHash({
          bidAmount: parseEther(bidAmount),
          text,
          imageCid,
          voiceCid,
          salt: `0x${salt}` as `0x${string}`
        });
        
        if (calculatedHash === onChainCommitHash) {
          setHashValidation('valid');
        } else {
          setHashValidation('invalid');
        }
      } catch (error) {
        setHashValidation('invalid');
      }
    } else if (mode === 'reveal') {
      setHashValidation('unknown');
    }
  }, [mode, bidAmount, text, imageCid, voiceCid, salt, onChainCommitHash]);

  // Lock body scroll when modal is open with improved handling
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Lock scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
      return () => {
        // Restore scroll
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Download reveal data as JSON file
  const downloadRevealData = () => {
    const revealData = {
      auctionId: auctionInfo.id.toString(),
      address,
      bidAmount,
      text,
      imageCid,
      voiceCid,
      salt,
      collateral,
      commitHash,
      timestamp: Date.now(),
      note: "HighestVoice Reveal Data - Keep this file safe! You'll need it to reveal your bid.",
    };

    const blob = new Blob([JSON.stringify(revealData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `highestvoice-reveal-auction${auctionInfo.id}-${address?.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Reveal data downloaded! Keep this file safe.');
  };

  // Upload and restore reveal data from JSON file
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Validate data structure
        if (!data.bidAmount || !data.salt || !data.text) {
          toast.error('Invalid reveal data file');
          return;
        }

        // Check if auction ID matches
        if (data.auctionId !== auctionInfo.id.toString()) {
          toast.error(`This file is for auction #${data.auctionId}, but current auction is #${auctionInfo.id}`);
          return;
        }

        // Load data into form
        setBidAmount(data.bidAmount || '');
        setText(data.text || '');
        setImageCid(data.imageCid || '');
        setVoiceCid(data.voiceCid || '');
        setSalt(data.salt || '');
        
        // Calculate additional collateral
        if (data.bidAmount && data.collateral) {
          const remaining = calculateRemainingAmount(data.bidAmount, data.collateral);
          if (remaining) {
            setAdditionalCollateral(formatETH(remaining));
          }
        }

        setUploadedData(data);
        toast.success('Reveal data loaded successfully!');
      } catch (error) {
        toast.error('Failed to parse reveal data file');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const uploadToIPFS = async (file: File, type: 'image' | 'audio') => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }
    const isImage = type === 'image';
    const maxSize = isImage ? 500 * 1024 : 1024 * 1024;
    const allowed = isImage
      ? ['png', 'jpg', 'jpeg', 'webp']
      : ['mp3', 'wav', 'ogg', 'm4a', 'webm'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowed.includes(ext)) {
      toast.error(`Invalid ${type} file type`);
      return;
    }
    if (file.size > maxSize) {
      toast.error(`${isImage ? 'Image' : 'Audio'} too large`);
      return;
    }
    try {
      isImage ? setUploadingImage(true) : setUploadingAudio(true);
      const getRes = await fetch(`/api/ipfs-upload?address=${address}`);
      if (!getRes.ok) {
        const err = await getRes.json().catch(() => ({} as any));
        throw new Error(err?.error || 'Failed to start upload');
      }
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
      const data = await upRes.json().catch(() => ({} as any));
      if (!upRes.ok) {
        throw new Error(data?.error || 'Upload failed');
      }
      const cid = data?.cid as string;
      if (!cid) throw new Error('Missing CID');
      if (isImage) setImageCid(cid);
      else setVoiceCid(cid);
      toast.success(`${isImage ? 'Image' : 'Audio'} uploaded`);
    } catch (e: any) {
      toast.error(e?.message || 'Upload failed');
    } finally {
      isImage ? setUploadingImage(false) : setUploadingAudio(false);
    }
  };

  // Generate salt on mount for commit mode
  useEffect(() => {
    if (mode === 'commit' && !salt) {
      setSalt(generateSalt());
    }
  }, [mode, salt]);

  // Calculate commit hash when form changes
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

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const bidValidation = validateETHAmount(bidAmount);
    if (!bidValidation.isValid) {
      newErrors.bidAmount = bidValidation.error!;
    }

    const textValidation = validateText(text);
    if (!textValidation.isValid) {
      newErrors.text = textValidation.error!;
    }

    const imageCidValidation = validateCID(imageCid);
    if (!imageCidValidation.isValid) {
      newErrors.imageCid = imageCidValidation.error!;
    }

    const voiceCidValidation = validateCID(voiceCid);
    if (!voiceCidValidation.isValid) {
      newErrors.voiceCid = voiceCidValidation.error!;
    }

    if (mode === 'commit') {
      const collateralValidation = validateETHAmount(collateral);
      if (!collateralValidation.isValid) {
        newErrors.collateral = collateralValidation.error!;
      } else {
        const bidAmountWei = parseEther(bidAmount);
        const collateralWei = parseEther(collateral);
        
        // Collateral can be less than bid amount - user pays remaining in reveal phase
        if (collateralWei < auctionInfo.minimumCollateral) {
          newErrors.collateral = `Collateral must be at least ${formatETH(auctionInfo.minimumCollateral)} ETH`;
        }
        
        // Warning if collateral is less than bid (user will need to pay more during reveal)
        if (collateralWei < bidAmountWei) {
          // This is valid, just show info in the UI
        }
      }
    }

    if (mode === 'reveal' && additionalCollateral) {
      const additionalValidation = validateETHAmount(additionalCollateral);
      if (!additionalValidation.isValid) {
        newErrors.additionalCollateral = additionalValidation.error!;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Check wallet connection
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      if (mode === 'commit') {
        if (!commitHash) {
          toast.error('Invalid commit hash');
          return;
        }
        
        console.log('Initiating commit bid transaction...', { commitHash, collateral });
        
        // Show pending toast
        const pendingToast = toast.loading('Please confirm the transaction in your wallet...');
        
        try {
          // Call commitBid and wait for transaction
          const txHash = await commitBid(commitHash, collateral);
          console.log('Transaction sent:', txHash);
          
          // Update toast to show waiting for confirmation
          toast.loading('Waiting for transaction confirmation...', { id: pendingToast });
          
          // Save commit details to localStorage for reveal phase
          const revealData = {
            bidAmount,
            text,
            imageCid,
            voiceCid,
            salt,
            commitHash,
            collateral, // Save collateral to calculate remaining amount
          };
          localStorage.setItem(`commit_${auctionInfo.id}_${address}`, JSON.stringify(revealData));
          
          // Dismiss pending toast
          toast.dismiss(pendingToast);
          
          toast.success(
            <div>
              <p className="font-semibold">✅ Bid committed successfully!</p>
              <p className="text-xs mt-1">📝 All reveal data saved to browser</p>
            </div>,
            { duration: 4000 }
          );
          
          // Show confirmation modal instead of closing
          setShowConfirmation(true);
          return; // Don't close yet
        } catch (txError) {
          toast.dismiss(pendingToast);
          throw txError; // Re-throw to be caught by outer catch
        }
      } else {
        console.log('Initiating reveal bid transaction...', { bidAmount, text, salt, additionalCollateral });
        
        // Show pending toast for reveal
        const pendingToast = toast.loading('Please confirm the transaction in your wallet...');
        
        try {
          const txHash = await revealBid(
            bidAmount,
            text,
            imageCid,
            voiceCid,
            `0x${salt}` as `0x${string}`,
            additionalCollateral || undefined
          );
          console.log('Transaction sent:', txHash);
          
          // Update toast to show waiting for confirmation
          toast.loading('Waiting for transaction confirmation...', { id: pendingToast });
          
          toast.dismiss(pendingToast);
          
          toast.success(
            <div>
              <p className="font-semibold">✅ Bid revealed successfully!</p>
              <p className="text-xs mt-1">🎯 You're now competing in this auction</p>
            </div>,
            { duration: 4000 }
          );
        } catch (txError) {
          toast.dismiss(pendingToast);
          throw txError; // Re-throw to be caught by outer catch
        }
      }
      
      onClose();
    } catch (error: any) {
      console.error('Transaction failed:', error);
      
      // Better error messages
      const errorMessage = error?.message || error?.toString() || '';
      
      // Handle user rejection
      if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected') || 
          errorMessage.includes('User denied') || errorMessage.includes('user denied')) {
        toast.error('Transaction was rejected');
        return;
      }
      
      // Handle insufficient funds
      if (errorMessage.includes('insufficient funds') || errorMessage.includes('exceeds balance')) {
        toast.error(
          <div>
            <p className="font-semibold">❌ Insufficient Funds</p>
            <p className="text-xs mt-1">You don't have enough ETH for this transaction</p>
          </div>,
          { duration: 5000 }
        );
        return;
      }
      
      if (mode === 'reveal') {
        if (errorMessage.includes('InvalidReveal') || errorMessage.includes('does not match')) {
          toast.error(
            <div>
              <p className="font-semibold">❌ Reveal Failed: Hash Mismatch</p>
              <p className="text-xs mt-1">The provided data doesn't match your commit. Double-check all fields, especially the salt.</p>
            </div>,
            { duration: 6000 }
          );
        } else if (errorMessage.includes('NoCommit')) {
          toast.error(
            <div>
              <p className="font-semibold">❌ No Commit Found</p>
              <p className="text-xs mt-1">No commit was found for this address in this auction.</p>
            </div>,
            { duration: 5000 }
          );
        } else {
          toast.error(
            <div>
              <p className="font-semibold">❌ Transaction Failed</p>
              <p className="text-xs mt-1">{errorMessage.slice(0, 100)}</p>
            </div>,
            { duration: 5000 }
          );
        }
      } else {
        toast.error(
          <div>
            <p className="font-semibold">❌ Transaction Failed</p>
            <p className="text-xs mt-1">{errorMessage.slice(0, 100)}</p>
          </div>,
          { duration: 5000 }
        );
      }
    }
  };

  const handleClose = () => {
    if (!isPending) {
      onClose();
    }
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    onClose(); // Close main modal too
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'commit' ? 'Commit Your Bid' : 'Reveal Your Bid'}
      description={mode === 'commit' 
        ? 'Submit your sealed bid for the current auction'
        : 'Reveal your previously committed bid'
      }
      size="lg"
      closeOnOverlayClick={!isPending}
    >
      <div className="space-y-2">
        {/* Phase Info - Simplified */}
        <div className="flex items-center space-x-2 p-2 rounded bg-primary-500/10 border border-primary-500/20">
          <Info className="w-3.5 h-3.5 text-primary-400" />
          <p className="text-xs text-gray-300">
            {mode === 'commit' 
              ? 'Submit your sealed bid - it stays hidden until reveal phase'
              : 'Reveal your committed bid to compete'
            }
          </p>
        </div>

        {/* Form */}
        <div className="space-y-2">
          {/* Bid and Collateral in 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input
              label="Bid Amount (ETH)"
              type="number"
              step="0.001"
              placeholder="0.1"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              error={errors.bidAmount}
              variant="cyber"
              disabled={isPending}
            />
            
            {/* Collateral (Commit mode) */}
            {mode === 'commit' && (
              <Input
                label="Collateral Amount (ETH)"
                type="number"
                step="0.001"
                placeholder="0.05"
                value={collateral}
                onChange={(e) => setCollateral(e.target.value)}
                error={errors.collateral}
                helper={`Min ${formatETH(auctionInfo.minimumCollateral)} ETH`}
                variant="cyber"
                disabled={isPending}
              />
            )}
          </div>

          {/* Text Content */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Your Message (Max 500 characters)
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share your voice with the world..."
              className="w-full h-14 px-2.5 py-1.5 text-sm bg-dark-800/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all duration-200 resize-none"
              maxLength={500}
              disabled={isPending}
            />
            <div className="flex justify-between mt-0.5">
              {errors.text && (
                <p className="text-xs text-red-400">{errors.text}</p>
              )}
              <p className="text-xs text-gray-500 ml-auto">
                {text.length}/500
              </p>
            </div>
          </div>

          {/* Media Upload */}
          {!address && (
            <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-300 flex items-center space-x-2">
              <AlertCircle className="w-3 h-3" />
              <span>Connect wallet to upload files</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Image CID with Upload */}
            <div className="relative">
              <input
                type="file"
                id="image-upload"
                accept=".png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadToIPFS(f, 'image');
                  e.target.value = ''; // Reset input
                }}
                disabled={isPending || !address || uploadingImage}
              />
              <Input
                label="Image CID (Optional)"
                placeholder="QmXXX... or baXXX..."
                value={imageCid}
                onChange={(e) => setImageCid(e.target.value)}
                error={errors.imageCid}
                helper={uploadingImage ? "Uploading..." : "Max 500KB"}
                variant="cyber"
                disabled={isPending || uploadingImage}
              />
              <button
                type="button"
                onClick={() => {
                  if (!address) {
                    toast.error('Please connect your wallet first');
                    return;
                  }
                  document.getElementById('image-upload')?.click();
                }}
                disabled={isPending || uploadingImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Upload image"
              >
                <Upload className={`w-3.5 h-3.5 ${uploadingImage ? 'animate-pulse' : ''}`} />
              </button>
            </div>

            {/* Voice CID with Upload */}
            <div className="relative">
              <input
                type="file"
                id="audio-upload"
                accept=".mp3,.wav,.ogg,.m4a,.webm"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadToIPFS(f, 'audio');
                  e.target.value = ''; // Reset input
                }}
                disabled={isPending || !address || uploadingAudio}
              />
              <Input
                label="Voice CID (Optional)"
                placeholder="QmXXX... or baXXX..."
                value={voiceCid}
                onChange={(e) => setVoiceCid(e.target.value)}
                error={errors.voiceCid}
                helper={uploadingAudio ? "Uploading..." : "Max 1MB"}
                variant="cyber"
                disabled={isPending || uploadingAudio}
              />
              <button
                type="button"
                onClick={() => {
                  if (!address) {
                    toast.error('Please connect your wallet first');
                    return;
                  }
                  document.getElementById('audio-upload')?.click();
                }}
                disabled={isPending || uploadingAudio}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded bg-secondary-500/20 hover:bg-secondary-500/30 text-secondary-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Upload audio"
              >
                <Upload className={`w-3.5 h-3.5 ${uploadingAudio ? 'animate-pulse' : ''}`} />
              </button>
            </div>
          </div>

          {/* Remaining amount info - simplified */}
          {mode === 'commit' && bidAmount && collateral && !errors.bidAmount && !errors.collateral && (() => {
            const remaining = calculateRemainingAmount(bidAmount, collateral);
            return remaining ? (
              <div className="p-2 rounded bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-orange-300">Remaining to pay at reveal:</span>
                  <span className="font-semibold text-xs text-orange-400">{formatETH(remaining)} ETH</span>
                </div>
              </div>
            ) : null;
          })()}

          {/* Additional Collateral (Reveal mode) */}
          {mode === 'reveal' && (
            <>
              <Input
                label="Remaining Amount to Send (ETH)"
                type="number"
                step="0.001"
                placeholder="0.0"
                value={additionalCollateral}
                onChange={(e) => setAdditionalCollateral(e.target.value)}
                error={errors.additionalCollateral}
                helper="Bid minus already paid collateral"
                variant="cyber"
                disabled={isPending}
              />
              
              {/* Calculation breakdown - simplified */}
              {existingCommit?.bidAmount && existingCommit?.collateral && (
                <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20 space-y-0.5 text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>Bid:</span>
                    <span>{existingCommit.bidAmount} ETH</span>
                  </div>
                  <div className="flex justify-between text-green-400">
                    <span>Paid:</span>
                    <span>-{existingCommit.collateral} ETH</span>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-300">To Pay:</span>
                    <span className="text-orange-400">{additionalCollateral} ETH</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Salt (Reveal mode) */}
          {mode === 'reveal' && (
            <Input
              label="Salt"
              value={salt}
              onChange={(e) => setSalt(e.target.value)}
              placeholder="Enter your salt from commit phase"
              variant="cyber"
              disabled={isPending}
              icon={<Hash className="w-4 h-4" />}
            />
          )}
        </div>

        {/* Commit Details - Polished Expandable */}
        {mode === 'commit' && commitHash && (
          <Card variant="neon" className="p-2 border-2 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.2)] !overflow-visible">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-semibold text-yellow-300 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Important: Save Your Data</span>
              </h3>
              <motion.button
                onClick={() => setShowCommitDetails(!showCommitDetails)}
                className="text-xs font-medium px-2 py-1 rounded bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 hover:text-primary-300 transition-colors duration-200"
                whileTap={{ scale: 0.95 }}
              >
                {showCommitDetails ? 'Hide' : 'Show'}
              </motion.button>
            </div>

            {/* Expandable Details with Smooth Animation */}
            <motion.div
              initial={false}
              animate={{
                height: showCommitDetails ? 'auto' : 0,
                opacity: showCommitDetails ? 1 : 0,
              }}
              transition={{
                height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.2, ease: 'easeInOut' },
              }}
              className="overflow-hidden will-change-[height,opacity]"
              style={{ marginBottom: showCommitDetails ? '0.25rem' : 0 }}
            >
              <div className="space-y-1 py-1">
                {/* Salt - Most Important */}
                <div className="p-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded border border-yellow-500/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-yellow-300 font-semibold">🔑 Secret Salt</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(salt);
                        setCopiedItem('salt');
                        setTimeout(() => setCopiedItem(null), 2000);
                        toast.success('Salt copied!');
                      }}
                      className="px-1.5 py-0.5 bg-yellow-500/30 hover:bg-yellow-500/40 rounded text-xs text-yellow-200 font-semibold"
                    >
                      {copiedItem === 'salt' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs font-mono text-yellow-100 break-all">{salt}</p>
                </div>

                {/* Hash */}
                <div className="p-2 bg-dark-800/50 rounded border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Commit Hash</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(commitHash);
                        setCopiedItem('hash');
                        setTimeout(() => setCopiedItem(null), 2000);
                      }}
                      className="text-xs text-primary-400 hover:text-primary-300"
                    >
                      {copiedItem === 'hash' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs font-mono text-primary-400 break-all mt-1">{commitHash}</p>
                </div>
              </div>
            </motion.div>

            {/* Warning with Download */}
            <CommitWarningBox onDownload={downloadRevealData} />
          </Card>
        )}

        {/* Reveal Mode: Backup Upload - Simplified */}
        {mode === 'reveal' && !existingCommit && (
          <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center space-x-1.5 mb-1.5">
              <FileUp className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-semibold text-blue-300">No saved data found</span>
            </div>
            <p className="text-xs text-gray-400 mb-2">
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
              <FileUp className="w-3 h-3 mr-2" />
              Upload Backup File
            </Button>
          </div>
        )}

        {/* Upload Success */}
        {uploadedData && (
          <div className="p-2 rounded bg-green-500/10 border border-green-500/20 flex items-center space-x-2">
            <Check className="w-3.5 h-3.5 text-green-400" />
            <div className="flex-1">
              <p className="text-xs text-green-300 font-semibold">Backup loaded!</p>
              <p className="text-[10px] text-green-200/80">Auction #{uploadedData.auctionId}</p>
            </div>
          </div>
        )}

        {/* Hash Validation Status - Only in Reveal Mode */}
        {mode === 'reveal' && onChainCommitHash && (
          <div>
            {hashValidation === 'valid' && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 space-y-1">
                <div className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-green-300">Hash Validated ✓</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Your data matches the on-chain commit hash
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {hashValidation === 'invalid' && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 space-y-2">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-red-300">Hash Mismatch Warning</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      The entered data does NOT match your on-chain commit hash
                    </p>
                  </div>
                </div>
                <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-xs text-yellow-200">
                    ⚠️ You can still try to reveal, but the smart contract will reject it with an "InvalidReveal" error. Double-check your bid amount, text, CIDs, and especially the salt value.
                  </p>
                </div>
              </div>
            )}
            
            {hashValidation === 'unknown' && bidAmount && salt && (
              <div className="p-3 rounded-lg bg-gray-500/10 border border-gray-500/30">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-300">Validating...</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Checking if data matches on-chain commit
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isPending}
            className="flex-1"
          >
            Cancel
          </Button>
          
          <Button
            variant="cyber"
            onClick={handleSubmit}
            loading={isPending}
            disabled={!bidAmount || !text || (mode === 'commit' && !collateral)}
            className="flex-1"
            glow
          >
            {mode === 'commit' ? 'Commit Bid' : 'Reveal Bid'}
          </Button>
        </div>
      </div>
    </Modal>

    {/* Confirmation Modal - Shows After Successful Commit */}
    {showConfirmation && (
      <Modal
        isOpen={showConfirmation}
        onClose={handleConfirmationClose}
        title="✅ Bid Committed Successfully"
        description="Important: Save your reveal data"
        size="lg"
      >
        <div className="space-y-2">
          {/* Warning Box */}
          <CommitWarningBox onDownload={downloadRevealData} />

          {/* Understand Button */}
          <Button
            variant="cyber"
            onClick={handleConfirmationClose}
            className="w-full"
            glow
          >
            I Understand
          </Button>
        </div>
      </Modal>
    )}
    </>
  );
};

export { BidModal };
