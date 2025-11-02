'use client';

import { motion } from 'framer-motion';
import { Shield, Unlock } from 'lucide-react';

export function FreedomHeader() {
  return (
    <div className="relative py-12 mb-8 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 blur-3xl" />
      
      <div className="relative z-10 text-center space-y-6">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent mb-3">
            HIGHEST VOICE
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 font-light tracking-wide">
            Your Voice, <span className="text-cyan-400 font-semibold">Uncensored</span>, 
            <span className="text-purple-400 font-semibold"> Immutable</span>
          </p>
        </motion.div>

        {/* Freedom badges */}
        <motion.div
          className="flex items-center justify-center gap-6 pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <motion.div
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30"
            whileHover={{ scale: 1.05 }}
          >
            <Unlock className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-300 font-semibold">Uncensored</span>
          </motion.div>

          <motion.div
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30"
            whileHover={{ scale: 1.05 }}
          >
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300 font-semibold">Decentralized</span>
          </motion.div>

          <motion.div
            className="relative px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30"
            whileHover={{ scale: 1.05 }}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <span className="text-sm text-purple-300 font-semibold">Forever On-Chain</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
