export const HIGHEST_VOICE_ABI = [
  {
    inputs: [],
    name: 'getCurrentHighest',
    outputs: [
      { name: 'bidder', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'voiceHash', type: 'string' },
      { name: 'timestamp', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getWinners',
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'bidder', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'voiceHash', type: 'string' },
          { name: 'timestamp', type: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'voiceHash', type: 'string' }],
    name: 'placeBid',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCountdownEnd',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { name: 'bidder', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'voiceHash', type: 'string', indexed: false }
    ],
    name: 'NewHighestBid',
    type: 'event',
  }
] as const;
