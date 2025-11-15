"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useChainId, useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseEther } from "viem";
import { Header } from "@/components/Header";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { HIGHEST_VOICE_ABI } from "@/contracts/HighestVoiceABI";
import { getContractAddress } from "@/lib/contracts";
import { HeartHandshake, BookOpenText, Wallet } from "lucide-react";
import toast from "react-hot-toast";

export default function HowItWorksPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [activeTab, setActiveTab] = useState("home");
  const [owner, setOwner] = useState<`0x${string}` | null>(null);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [donationAmount, setDonationAmount] = useState("");
  const [donating, setDonating] = useState(false);

  const contractAddress = getContractAddress(chainId, "highestVoice");

  const loadOwner = async () => {
    if (!contractAddress || !publicClient) return;
    try {
      setOwnerLoading(true);
      const dep = (await publicClient.readContract({
        address: contractAddress,
        abi: HIGHEST_VOICE_ABI as any,
        functionName: "DEPLOYER",
        args: [],
      })) as `0x${string}`;
      setOwner(dep);
    } catch (e) {
      console.error("Failed to load owner", e);
    } finally {
      setOwnerLoading(false);
    }
  };

  const handleDonate = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!contractAddress) {
      toast.error("Contract not configured on this network");
      return;
    }
    if (!owner) {
      toast.error("Donation address not loaded yet");
      return;
    }
    const amount = parseFloat(donationAmount || "0");
    if (!amount || amount <= 0) {
      toast.error("Enter a valid donation amount");
      return;
    }
    if (!walletClient || !publicClient) {
      toast.error("Wallet client not available");
      return;
    }

    try {
      setDonating(true);
      const hash = await walletClient.sendTransaction({
        account: address,
        to: owner,
        value: parseEther(donationAmount),
        chain: publicClient.chain,
      });
      toast.loading("Waiting for confirmation...", { id: "donate" });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success("Thank you for your support!", { id: "donate" });
      setDonationAmount("");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.shortMessage || e?.message || "Donation failed");
    } finally {
      setDonating(false);
    }
  };

  if (owner === null && !ownerLoading && contractAddress && publicClient) {
    void loadOwner();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Mobile Header */}
      <MobileHeader title="How HighestVoice Works" />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card variant="neon" className="p-6 md:p-8 space-y-6">
            <header className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
                <BookOpenText className="w-8 h-8 text-primary-400" />
                HighestVoice – Full Explanation
              </h1>
              <p className="text-gray-400">
                A user-friendly overview of why HighestVoice exists, how the auction works, and how you can
                participate.
              </p>
            </header>

            {/* Content copied from README.user.md (English only, lightly formatted for web) */}
            <div className="space-y-6 text-gray-200 text-sm md:text-base leading-relaxed">
              <section className="space-y-2">
                <h2 className="text-2xl font-semibold text-white">Why HighestVoice Exists</h2>
                <p>
                  Today, most platforms are centralized: a small group decides what stays or goes, posting is free so
                  spam and low-quality content flood the feed, and you rarely know who really controls what you see.
                </p>
                <p>
                  HighestVoice is the opposite: a censorship-resistant, auction-based space where you must win a daily
                  bid to project your message on-chain for everyone to see.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-2xl font-semibold text-white">Core Idea (Simple)</h2>
                <p>Each 24-hour round has three main stages:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    <strong>Commit phase (12h)</strong>: Submit a hidden bid + message. No one can see your exact bid or
                    content yet.
                  </li>
                  <li>
                    <strong>Reveal phase (12h)</strong>: Reveal your bid and message. Only revealed bids are valid.
                  </li>
                  <li>
                    <strong>Settlement</strong>: Highest revealed bid wins but pays only the second-highest price.
                    Everyone else gets a refund.
                  </li>
                </ol>
              </section>

              <section className="space-y-2">
                <h2 className="text-2xl font-semibold text-white">Key Features</h2>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Sealed-bid auction</strong> – Your bid is committed secretly first, then revealed later.
                  </li>
                  <li>
                    <strong>Second-price payment</strong> – If you win, you pay the second-highest bid, not your own.
                  </li>
                  <li>
                    <strong>Uncensorable winners</strong> – Winner messages are stored on-chain and can&apos;t be silently
                    removed.
                  </li>
                  <li>
                    <strong>Winner NFTs</strong> – Each daily winner receives a unique NFT as proof they won that round.
                  </li>
                  <li>
                    <strong>Legendary Token</strong> – A special soulbound NFT for the most-tipped winner overall.
                  </li>
                  <li>
                    <strong>Tipping</strong> – Tip ETH to past winners (90% to winner, 10% to protocol treasury).
                  </li>
                  <li>
                    <strong>Clear withdrawals</strong> – One-click withdraw of all refunds and unrevealed collateral.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-2xl font-semibold text-white">How to Participate</h2>
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    <strong>Connect your wallet</strong> and switch to the network used by HighestVoice.
                  </li>
                  <li>
                    <strong>Commit phase</strong>: enter your bid, write your message, optionally attach an image or
                    voice note. The app generates a secret salt and commit hash, and asks you to pay at least the
                    minimum collateral.
                  </li>
                  <li>
                    <strong>Wait for reveal</strong>: when the phase switches, come back to reveal.
                  </li>
                  <li>
                    <strong>Reveal phase</strong>: use the same bid and salt; send any remaining ETH to match your full
                    bid. Only revealed bids are counted.
                  </li>
                  <li>
                    <strong>Settlement & rewards</strong>: after reveal ends, if you win you pay the second-highest bid,
                    your post is featured for 24 hours, and you receive the winner NFT. Others can withdraw their funds.
                  </li>
                </ol>
              </section>

              <section className="space-y-2">
                <h2 className="text-2xl font-semibold text-white">Why It Matters</h2>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Freedom</strong> – No admin button to delete your winning message from the contract.
                  </li>
                  <li>
                    <strong>Persistence</strong> – Winners are etched into the blockchain forever.
                  </li>
                  <li>
                    <strong>Signal over noise</strong> – You must risk and pay to publish, so messages tend to be more
                    meaningful.
                  </li>
                  <li>
                    <strong>Transparency</strong> – Rules and results live in open smart contracts anyone can inspect.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-2xl font-semibold text-white">Safety Notes</h2>
                <ul className="list-disc list-inside space-y-1">
                  <li>Always back up your reveal data (especially the salt).</li>
                  <li>Never share your wallet seed phrase or private keys.</li>
                  <li>Use small amounts on testnets while you learn how the system works.</li>
                </ul>
              </section>

              <section className="space-y-3 border-t border-white/10 pt-6">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-6 h-6 text-pink-400" />
                  <h2 className="text-2xl font-semibold text-white">Support the Project</h2>
                </div>
                <p>
                  If you like HighestVoice and want to support development, you can send a small donation directly to
                  the deployer address of the HighestVoice contract on this network. This goes straight to the builder
                  behind the protocol.
                </p>

                <div className="space-y-2 text-xs text-gray-400">
                  <div>
                    <span className="font-semibold text-gray-300">Network:</span> {publicClient?.chain?.name ||
                      "Unknown"}
                  </div>
                  <div className="break-all">
                    <span className="font-semibold text-gray-300">Deployer Address:</span>{" "}
                    {ownerLoading && !owner && <span>Loading...</span>}
                    {!ownerLoading && owner && <span>{owner}</span>}
                    {!ownerLoading && !owner && <span>Not available on this network</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-3 items-end">
                  <Input
                    label="Donation Amount (ETH)"
                    type="number"
                    step="0.001"
                    placeholder="0.01"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                  />
                  <Button
                    variant="cyber"
                    glow
                    size="md"
                    disabled={donating || ownerLoading || !owner}
                    onClick={handleDonate}
                    icon={<Wallet className="w-4 h-4" />}
                  >
                    {donating ? "Sending..." : "Donate to Deployer"}
                  </Button>
                </div>

                <p className="text-xs text-gray-500">
                  Donations are completely optional and do not grant any special rights. They simply help keep
                  HighestVoice alive and evolving.
                </p>
              </section>
            </div>

            <div className="flex justify-end pt-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
                Back to Auction
              </Button>
            </div>
          </Card>
        </div>
      </main>

      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
