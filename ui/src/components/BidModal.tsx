'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useSignMessage } from 'wagmi';
import { Hash, Eye, EyeOff, Upload, AlertCircle, Info } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Card, CardContent } from './ui/Card';
import { useHighestVoiceWrite } from '@/hooks/useHighestVoice';
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
  };
}

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

  // UI state
  const [showCommitDetails, setShowCommitDetails] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [commitHash, setCommitHash] = useState<`0x${string}` | null>(null);

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
        if (collateralWei < bidAmountWei) {
          newErrors.collateral = 'Collateral must be at least equal to bid amount';
        }
        if (collateralWei < auctionInfo.minimumCollateral) {
          newErrors.collateral = `Collateral must be at least ${formatETH(auctionInfo.minimumCollateral)} ETH`;
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

    try {
      if (mode === 'commit') {
        if (!commitHash) {
          toast.error('Invalid commit hash');
          return;
        }
        
        await commitBid(commitHash, collateral);
        
        // Save commit details to localStorage for reveal phase
        localStorage.setItem(`commit_${auctionInfo.id}_${address}`, JSON.stringify({
          bidAmount,
          text,
          imageCid,
          voiceCid,
          salt,
          commitHash,
        }));
        
        toast.success('Bid committed successfully!');
      } else {
        await revealBid(
          bidAmount,
          text,
          imageCid,
          voiceCid,
          `0x${salt}` as `0x${string}`,
          additionalCollateral || undefined
        );
        
        toast.success('Bid revealed successfully!');
      }
      
      onClose();
    } catch (error) {
      console.error('Transaction failed:', error);
      toast.error('Transaction failed. Please try again.');
    }
  };

  const handleClose = () => {
    if (!isPending) {
      onClose();
    }
  };

  return (
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
      <div className="space-y-6">
        {/* Phase Info */}
        <Card variant="cyber" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary-500/20">
              <Info className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">
                {mode === 'commit' ? 'Commit Phase' : 'Reveal Phase'}
              </h3>
              <p className="text-sm text-gray-400">
                {mode === 'commit' 
                  ? 'Your bid will be hidden until the reveal phase'
                  : 'Reveal your bid to compete for the win'
                }
              </p>
            </div>
          </div>
        </Card>

        {/* Form */}
        <div className="space-y-4">
          {/* Bid Amount */}
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

          {/* Text Content */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Message (Max 500 characters)
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share your voice with the world..."
              className="w-full h-24 px-3 py-2 bg-dark-800/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all duration-200 resize-none"
              maxLength={500}
              disabled={isPending}
            />
            <div className="flex justify-between mt-1">
              {errors.text && (
                <p className="text-xs text-red-400">{errors.text}</p>
              )}
              <p className="text-xs text-gray-500 ml-auto">
                {text.length}/500
              </p>
            </div>
          </div>

          {/* IPFS CIDs with integrated upload */}
          {!address && (
            <Card variant="cyber" className="p-3 bg-yellow-500/10 border-yellow-500/30">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                <p className="text-sm text-yellow-300">Please connect your wallet first to upload files</p>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                helper={uploadingImage ? "Uploading..." : "Click upload icon or paste CID. Max 500KB"}
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
                className="absolute right-3 top-[38px] p-2 rounded-lg bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Upload image"
              >
                <Upload className={`w-4 h-4 ${uploadingImage ? 'animate-pulse' : ''}`} />
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
                helper={uploadingAudio ? "Uploading..." : "Click upload icon or paste CID. Max 1MB"}
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
                className="absolute right-3 top-[38px] p-2 rounded-lg bg-secondary-500/20 hover:bg-secondary-500/30 text-secondary-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Upload audio"
              >
                <Upload className={`w-4 h-4 ${uploadingAudio ? 'animate-pulse' : ''}`} />
              </button>
            </div>
          </div>

          {/* Collateral (Commit mode) */}
          {mode === 'commit' && (
            <Input
              label="Collateral Amount (ETH)"
              type="number"
              step="0.001"
              placeholder="0.1"
              value={collateral}
              onChange={(e) => setCollateral(e.target.value)}
              error={errors.collateral}
              helper={`Minimum: ${formatETH(auctionInfo.minimumCollateral)} ETH`}
              variant="cyber"
              disabled={isPending}
            />
          )}

          {/* Additional Collateral (Reveal mode) */}
          {mode === 'reveal' && (
            <Input
              label="Additional Collateral (ETH, Optional)"
              type="number"
              step="0.001"
              placeholder="0.0"
              value={additionalCollateral}
              onChange={(e) => setAdditionalCollateral(e.target.value)}
              error={errors.additionalCollateral}
              helper="Add more collateral if needed"
              variant="cyber"
              disabled={isPending}
            />
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

        {/* Commit Details (Commit mode) */}
        {mode === 'commit' && commitHash && (
          <Card variant="neon" className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Commit Details</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowCommitDetails(!showCommitDetails)}
                icon={showCommitDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              >
                {showCommitDetails ? 'Hide' : 'Show'}
              </Button>
            </div>
            
            {showCommitDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2 text-sm font-mono"
              >
                <div>
                  <span className="text-gray-400">Hash: </span>
                  <span className="text-primary-400 break-all">{commitHash}</span>
                </div>
                <div>
                  <span className="text-gray-400">Salt: </span>
                  <span className="text-secondary-400">{salt}</span>
                </div>
              </motion.div>
            )}
            
            <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-300">
                  Save your salt! You'll need it to reveal your bid. We'll also save it locally for convenience.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
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
  );
};

export { BidModal };
