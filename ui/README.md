This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Highest Voice Living Gallery

An immersive, real-time "living gallery" that feels more like an interactive art installation than a typical dApp. Every projection and auction tick is visually alive, adapting to the content it displays and to the on-chain state in real time.

## 🎨 Living Gallery Features

### Core Visual Components

1. **Immersive Backdrop**
   - Full-screen generative backdrop with color-palette extraction
   - Parallax layers responsive to cursor/device gyro
   - WebWorker-based performance optimization

2. **Temporal Ribbon**
   - Horizontal ribbon showing last 24 winners as morphing thumbnails
   - Hover-to-scrub functionality with deep-linking
   - AR-style carousel on mobile swipe-up

3. **Holographic Bid Pod**
   - Floating glassmorphic card with neon pulse effects
   - Commit/Reveal tabs with liquid-shape transitions
   - Firework burst animations on bid confirmation

4. **Countdown Heartbeat**
   - 3D ring countdown with color-coded phases
   - Haptic feedback on cycle rollover
   - Real-time phase indicators

5. **Audio-Reactive Player**
   - Concentric ripples synced to audio waveform
   - Real-time waveform visualization
   - Morphing mute/unmute icons

### Interactive Features

- **Konami Code Easter Egg**: Type the Konami code for CRT scanline aesthetic
- **Accessibility**: WCAG 2.2 AA compliant with reduced motion support
- **Performance**: <1.5s first paint on 4G networks
- **Responsive Design**: Optimized for all screen sizes

## 🚀 Getting Started

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start Storybook for component development
npm run storybook
```

### Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run storybook` - Start Storybook development environment
- `npm run build-storybook` - Build Storybook for deployment

## 🎭 Component Stories

All living-gallery components are available in Storybook for isolated development and testing:

- **ImmersiveBackdrop** - Generative animated background
- **TemporalRibbon** - Winner history display
- **CountdownHeartbeat** - 3D ring countdown timer
- **HolographicBidPod** - Interactive bidding interface
- **AudioReactivePlayer** - Waveform-synced audio player

## 🔧 Technical Stack

- **Framework**: Next.js 15.4.5
- **Styling**: TailwindCSS v4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Blockchain**: Wagmi + RainbowKit (Coinbase Wallet excluded from provider options)
- **Testing**: Storybook
- **Performance**: WebWorkers + OffscreenCanvas

## 🎯 Usage

The living gallery automatically connects to the Highest Voice smart contract via Wagmi hooks. Simply:

1. Connect your wallet
2. View the current highest voice
3. Place bids through the holographic bid pod
4. Monitor the countdown heartbeat for cycle timing
5. Explore previous winners via the temporal ribbon

## 🌈 Design Tokens

All visual elements use CSS custom properties for instant theming:

```css
:root {
  --primary: #3b82f6;
  --secondary: #8b5cf6;
  --accent: #ec4899;
  --background: #0f172a;
}
```

## 📱 Mobile Experience

- **Swipe gestures** for temporal ribbon interaction
- **Device orientation** support for parallax effects
- **Touch-optimized** controls
- **Reduced motion** respects OS accessibility settings

## 🎮 Easter Eggs

- **Konami Code**: ArrowUp×2, ArrowDown×2, ArrowLeft, ArrowRight, ArrowLeft, ArrowRight, B, A
- **CRT Mode**: 1980s scanline aesthetic with green phosphor glow
- **Audio Visualizer**: Real-time waveform sync with music

## 🔗 Integration

The living gallery is designed to integrate seamlessly with the Highest Voice smart contract. All components are:

- **Wagmi-ready** with built-in wallet connection
- **Responsive** across all device sizes
- **Accessible** with full keyboard navigation
- **Performant** with optimized rendering

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
