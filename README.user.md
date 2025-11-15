# HighestVoice

**A daily, uncensorable voice auction on the blockchain.**

HighestVoice is a 24‑hour, fully decentralized auction where people compete to project the **loudest voice** for a day.  
The winner’s message is highlighted on the platform and recorded forever on-chain.

No central admin. No delete button. Your voice, if it wins, lives on.

---

## Why HighestVoice Exists

Today, most platforms are:

- **Centralized** – A company or small group decides what stays or goes.
- **Easy to spam** – Posting is free, so low-quality or meaningless content floods feeds.
- **Opaque** – You don’t really know who controls what you see.

HighestVoice was created to be the opposite:

- **No censorship** – Once a winner’s message is on-chain, nobody can silently remove or edit it.
- **Skin in the game** – You must win an auction (and pay) to publish, which makes messages more meaningful.
- **Transparent rules** – The auction code is public, on-chain, and the same for everyone.
- **Ownership** – Winners receive an NFT that proves their voice won that day.

---

## Core Idea (Simple)

Every 24 hours, there is **one auction round**:

1. **Commit phase (sealed bids) – 12 hours**
   - You submit a *hidden* bid with your message.
   - Others can’t see your exact bid or content yet.

2. **Reveal phase – 12 hours**
   - You reveal your bid and message.
   - Only revealed bids count.

3. **Settlement**
   - The **highest revealed bid wins**, but **pays only the second‑highest bid** (second-price auction).
   - Everyone else gets their ETH back.
   - The winner’s message becomes the featured “HighestVoice” and an NFT is minted.

You can also **tip past winners** with ETH, and the most‑tipped winner holds a special **Legendary** NFT.

---

## Key Features (User View)

- **Sealed-bid auction**  
  In the commit phase, your bid is locked in but hidden. No one can see your exact amount or content until you reveal.

- **Second-price payment**  
  If you win, you pay the second‑highest bid, not your own. This encourages you to bid honestly.

- **Uncensorable winner message**  
  The winner’s text (and references to image/voice via IPFS CIDs) is stored on-chain. There is no admin “delete this” function in the contract.

- **Winner NFTs**  
  Each daily winner receives a unique ERC‑721 NFT. It’s permanent proof that your voice was the loudest for that round.

- **Legendary Token (Soulbound)**  
  A special NFT that belongs to the most‑tipped winner across all auctions.  
  - It **cannot be traded** like a normal NFT.  
  - If someone else accumulates more tips, the Legendary token automatically moves to them.

- **Tipping System**  
  - You can send ETH tips to any past winner.  
  - 90% goes directly to the winner.  
  - 10% goes to the protocol treasury to support development and public goods.

- **Clear Withdrawals**  
  If you don’t win, or you don’t reveal, you can always **withdraw your funds** using simple functions:
  - Withdraw refunds from settled auctions.
  - Withdraw collateral for bids that were never revealed.
  - Or use a **one-click “withdraw everything”** option for your recent auctions.

---

## What You Need to Participate

- A **Web3 wallet** (e.g. MetaMask, Rainbow, Rabby, etc.).
- Some **ETH** on a supported network (e.g. Sepolia testnet or a main network, depending on deployment).
- A modern browser that can connect to Web3 sites.

When you connect your wallet in the UI, it automatically talks to the HighestVoice contract using a secure RPC proxy.

---

## How to Participate (Step-by-Step)

### 1. Connect Your Wallet

1. Open the HighestVoice app.
2. Click **“Connect Wallet”** and choose your preferred wallet.
3. Make sure you are on the correct network (the app will show you which one it expects).

---

### 2. Commit Your Bid (Commit Phase)

During the **commit phase** (first 12 hours of each auction):

1. Go to the **Bid/Commit** page.
2. Enter:
   - Your **bid amount** in ETH.
   - Your **message text**.
   - Optional **image** and **voice** files (these are uploaded to IPFS and stored by content hash).
3. The app generates a **secret “salt”** and a **commit hash** from your inputs.
4. You choose a **collateral amount** (at least the minimum shown). You can pay the rest later during reveal.
5. Confirm the transaction in your wallet.

After the transaction confirms:

- Your commit is stored on-chain.
- Your reveal data (bid, message, CIDs, salt, collateral) is stored **locally in your browser**, and you can download a backup file.
- No one can see your exact bid or message yet.

---

### 3. Wait for Reveal Phase

- Watch the countdown timer on the homepage.
- When the timer switches phase to **reveal**, you can proceed.

---

### 4. Reveal Your Bid (Reveal Phase)

During the **reveal phase** (next 12 hours):

1. Open the **Reveal** page.
2. Load your saved data automatically (from your browser) or by uploading the backup file.
3. The app calculates how much ETH you still need to pay (if your initial collateral was lower than your full bid).
4. Confirm the reveal transaction in your wallet.

On-chain, the contract:

- Verifies that your reveal matches the previous commit.
- Verifies your text / image / voice limits and that total ETH you’ve provided covers your full bid.
- Updates your status as **revealed**, which is required to be eligible to win.

---

### 5. Settlement & Results

After reveal ends:

- Chainlink Automation or any user can trigger **settlement**.
- The contract:
  - Determines the winner.
  - Calculates refunds for all revealed bidders.
  - Adjusts the minimum collateral for the next auction.
  - Mints the **Winner NFT**.
- The homepage shows the winning post and updates your stats.

If you lost or have leftover funds, you can withdraw them in the **Portfolio** page.

---

## Withdrawing Your Funds

The platform uses a **“pull”** withdrawal model (safer and more transparent):

- **Refunds** – If you revealed but did not win, your ETH is available to withdraw.
- **Unrevealed collateral** – If you committed but never revealed and the reveal phase is over, you can withdraw your locked collateral.
- **Withdraw Everything** – A one-click function that scans your recent auctions and withdraws everything that’s currently available to you.

In the UI:

1. Go to the **Portfolio** page.
2. Check **“Available to Withdraw”**.
3. Click **“Withdraw Funds”** and confirm in your wallet.
4. The UI waits for confirmation on-chain and then updates your balances.

---

## Why Use HighestVoice?

- **Your voice really matters**  
  You’re competing in a single, visible auction round. If you win, everyone sees your message.

- **No silent moderation**  
  There is no owner key that can silently delete your winning post from the contract.

- **Aligned incentives**  
  Second-price auctions and meaningful cost for participation discourage spam and encourage thoughtful content.

- **On-chain, composable data**  
  - Your winner NFT is standard ERC‑721.
  - Stats and leaderboards can be read by any explorer, indexer, or external app.

---

## Important Notes

- Always **back up your reveal data** (especially the salt).  
  Without it, you cannot correctly reveal your bid.
- Only use **test accounts and small amounts** on testnets.  
  On mainnet or live networks, use funds responsibly.
- Never share your **wallet seed phrase** or private keys with anyone.  
  The project will never ask for them.

---

## Learn More

- Technical README for developers: see the main `README.md` in the repository.
- Additional docs (architecture, automation, treasury, cost optimization) are under `docs/` in the repo.

HighestVoice is an experiment in **free expression, skin-in-the-game, and permanent on-chain storytelling**.  
If you resonate with that, join an auction and let your voice compete.
