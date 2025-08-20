'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-cyan-300 mb-2">
                  {title}
                </h3>
                <div className="text-gray-300 whitespace-pre-line text-sm leading-relaxed">
                  {message}
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 border-gray-600 hover:border-gray-500 text-gray-300"
                >
                  {cancelText}
                </Button>
                <Button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
                >
                  {isLoading ? 'Processing...' : confirmText}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
