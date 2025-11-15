"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Info, BookOpenCheck } from "lucide-react";
// Removed next/font/google to avoid build-time fetch from Google Fonts in restricted environments

export function MissionCTA() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "fa">("en");

  useEffect(() => {
    try {
      const key = "hv_seen_mission_v1";
      if (typeof window === "undefined") return;
      const seen = window.localStorage.getItem(key);

      const onLoad = () => {
        if (!seen) {
          setOpen(true);
          window.localStorage.setItem(key, "1");
        }
      };

      if (document.readyState === "complete") {
        onLoad();
      } else {
        window.addEventListener("load", onLoad);
      }

      return () => {
        window.removeEventListener("load", onLoad);
      };
    } catch {}
  }, []);

  return (
    <>
      <div
        className={`fixed z-[60] pb-2 safe-area-pb flex justify-end
        right-4 bottom-24 md:bottom-6 md:right-6
        ${open ? 'opacity-0 pointer-events-none' : ''}`}
      >
        <div className="pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{
              opacity: 1,
              scale: [1, 1.05, 1],
              y: [0, -4, 0],
            }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'mirror' }}
          >
            <Button
              onClick={() => setOpen(true)}
              variant="cyber"
              size="lg"
              glow
              aria-label="How it works"
              className="px-3 py-3 md:px-6 md:py-3 rounded-full md:rounded-lg shadow-[0_0_20px_rgba(129,140,248,0.6)] hover:shadow-[0_0_30px_rgba(129,140,248,0.9)]"
            >
              <Info className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">How it works!</span>
            </Button>
          </motion.div>
        </div>
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={lang === 'en' ? 'How HighestVoice Works' : 'راهنمای HighestVoice'}
        size="lg"
      >
        <div
          className="space-y-6"
          style={{
            fontFamily:
              lang === 'fa'
                ? 'var(--font-vazirmatn), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
                : 'var(--font-inter), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
          }}
        >
          {/* Language toggle */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {lang === 'en' ? 'Choose language' : 'زبان را انتخاب کنید'}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={lang === 'en' ? 'primary' : 'outline'}
                onClick={() => setLang('en')}
                aria-pressed={lang === 'en'}
              >
                EN
              </Button>
              <Button
                size="sm"
                variant={lang === 'fa' ? 'primary' : 'outline'}
                onClick={() => setLang('fa')}
                aria-pressed={lang === 'fa'}
              >
                FA
              </Button>
            </div>
          </div>

          {/* Content */}
          {lang === 'en' ? (
            <div className="space-y-6" dir="ltr">
              <section className="space-y-3">
                <h2 className="text-xl font-bold">HighestVoice: Where Your Voice Shines Forever!</h2>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold">What's the Challenge?</h3>
                <p className="text-gray-300">
                  In today’s digital world, your words either get lost in the noise or censored! Centralized platforms control content, and a small group decides what stays or goes—sometimes for political, economic, or personal reasons. On top of that, since posting is usually free, tons of inaccurate or pointless content flood the internet. We all want a fair space where we can speak freely and our message lasts forever.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold">What Did We Do?</h3>
                <p className="text-gray-300">
                  <span className="font-semibold">HighestVoice</span> is a decentralized platform on the blockchain where you can share your words, opinions, and any content you care about in a daily open auction without censorship. Your post (text, image, or audio) is recorded on the blockchain forever, and no one can censor or delete it. Because you must win the auction to publish a post, content becomes more valuable and there’s no spam. Winners receive a special “HighestVoice Winner” NFT.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold">What is HighestVoice?</h3>
                <p className="text-gray-300">
                  It’s a 24-hour daily auction on the blockchain where you can showcase your creativity. In the first phase, you submit a secret bid (to keep your amount and content hidden from others) along with a message—like text, an image, or audio. In the second phase (reveal), you unveil your message. The highest bid wins, pays the second-highest bid amount, and gets a unique NFT. Your message stays on the blockchain forever, uncensorable. The cost of participating ensures content is high-quality and meaningful.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold">Auction Flow (Start to Finish)</h2>
                <ol className="list-decimal list-inside text-gray-300 space-y-1">
                  <li>
                    <strong>Start</strong>: Connect your wallet and check the timer to see the current phase.
                  </li>
                  <li>
                    <strong>Commit Phase (First 12h)</strong>: Choose your bid, write your message, optionally add image/voice. A secret “salt” is generated—keep it safe. Pay at least the minimum collateral to lock your bid (you can pay the rest later at reveal).
                  </li>
                  <li>
                    <strong>Wait</strong>: Watch the countdown until the reveal phase begins.
                  </li>
                  <li>
                    <strong>Reveal Phase (Next 12h)</strong>: Use the same bid and your secret salt to reveal. Send any remaining ETH to match your bid. Only revealed bids count.
                  </li>
                  <li>
                    <strong>Settlement</strong>: When reveal ends, the auction settles. The highest revealed bid wins and pays the second-highest price. All other bidders get their ETH back, and any extra ETH Winner sent above the price is returned.
                  </li>
                  <li>
                    <strong>Rewards</strong>: The winner receives the “HighestVoice Winner” NFT on-chain. A new round begins.
                  </li>
                </ol>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold">How to Participate</h2>
                <ol className="list-decimal list-inside text-gray-300 space-y-1">
                  <li>Connect your wallet and make sure you have enough ETH for your bid and network fees.</li>
                  <li>During the commit phase, enter your bid and message. Optionally attach an image or voice note. We’ll generate a secret salt—save it. Your browser stores it, but you can also download a backup.</li>
                  <li>Pay at least the minimum collateral to submit your commit. You can pay the rest during reveal.</li>
                  <li>When reveal starts, open reveal, paste your salt (or load your saved data), and send any remaining ETH. Submit the reveal transaction. Only revealed bids are valid.</li>
                  <li>After reveal ends, check results. If you win, you pay the second-highest price, your post is shown as the winner for 24 hours, and you receive the winner NFT.</li>
                </ol>
              </section>

              <section className="space-y-2">
                <h2 className="text-xl font-bold">Why is HighestVoice Awesome?</h2>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  <li><strong>Total Freedom</strong>: Speak without censorship.</li>
                  <li><strong>Forever Lasting</strong>: Your message is etched on the blockchain.</li>
                  <li><strong>Quality Content</strong>: Participation cost means valuable content, no spam.</li>
                  <li><strong>Fair</strong>: Same rules for everyone.</li>
                  <li><strong>Transparent</strong>: Everything’s on the blockchain.</li>
                </ul>
              </section>

              <p className="text-gray-300">
                HighestVoice is a unique space to express yourself, uncensored, with valuable content. Come make your message immortal!
              </p>
            </div>
          ) : (
            <div className="space-y-6 text-right" dir="rtl">
              <section className="space-y-3">
                <h2 className="text-xl font-bold">هایست‌وویس: جایی که صدات برای همیشه می‌درخشه!</h2>
                <h3 className="font-semibold">چالش چیه؟</h3>
                <p className="text-gray-300">
                  تو دنیای دیجیتال امروز، حرفات یا تو شلوغی گم می‌شن یا سانسور! پلتفرم‌های متمرکز محتوا رو کنترل می‌کنن و یه عده محدود تصمیم می‌گیرن چی بمونه، چی بره—گاهی به دلایل سیاسی، اقتصادی یا سلیقه‌ای. از اون طرف، کلی محتوای نادرست و بیهوده فضای مجازی رو پر کرده. همه ما یه فضای منصفانه و آزاد می‌خوایم که بتونیم آزادانه پست بزاریم و پستمون رو بدون محدودیت و همیشگی منتشر کنیم.
                </p>
                <h3 className="font-semibold">ما چی کار کردیم؟</h3>
                <p className="text-gray-300">
                  هایست‌وویس یه پلتفرم غیرمتمرکز روی بلاک‌چینه که توش می‌تونی حرفت، عقیده، نظر، یا محتوای مد نظرت رو تو یه حراجی روزانه آزاده و بدون هیچ گونه محدودیتی منتشر کنی. پستت (متن، عکس یا صوت) برای همیشه روی بلاک‌چین ثبت می‌شه و هیچ‌کس نمی‌تونه سانسور یا حذفش کنه. چون برای گذاشتن پست باید تو حراجی برنده شی، محتواها باارزش‌ترن و خبری از اسپم نیست. برنده‌ها یه NFT خفن “Highest-Voice Winner” می‌گیرن.
                </p>
                <h3 className="font-semibold">هایست‌وویس چیه؟</h3>
                <p className="text-gray-300">
                  یه حراجی روزانه 24 ساعته روی بلاک‌چینه که توش می‌تونی پستت رو منتشر کنی. تو فاز اول، یه پیشنهاد مخفی (برای مخفی موندن مبلغ و محتوا از بقیه) با یه پیام—مثل متن، عکس یا صوت—ثبت می‌کنی. تو فاز دوم (افشا)، پیامت رو رونمایی می‌کنی. بالاترین پیشنهاد برنده می‌شه، مبلغ دومین پیشنهاد رو می‌ده و یه NFT یونیک می‌گیره. پست فرد برنده برای همیشه روی بلاک‌چین می‌مونه، بدون امکان سانسور یا تغییر. هزینه شرکت باعث می‌شه محتواها ارزشمندتر و باکیفیت‌تر باشن.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold">جریان حراجی (از اول تا آخر)</h2>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  <li>شروع: کیف‌پولت رو وصل کن و تایمر رو چک کن تا ببینی تو کدوم فازیم.</li>
                  <li>فاز پیشنهاد (12 ساعت اول): مبلغ پیشنهادت رو انتخاب کن، پیامت رو بنویس و اگه خواستی عکس یا صوت اضافه کن. یه کد “سالت” می‌گیری—امن نگهش دار. یه وثیقه کوچیک بده تا پیشنهادت قفل بشه (بقیه مبلغ پیشنهادیت رو بعداً می‌تونی بدی).</li>
                  <li>صبر کن: شمارش معکوس رو دنبال کن تا فاز رونمایی شروع بشه.</li>
                  <li>فاز رونمایی (12 ساعت بعدی): با همون پیشنهاد و کد سالت برگرد. بقیه اتریوم رو بفرست تا پیشنهادت کامل بشه. دقت کن که فقط پیشنهاد هایی که رونمایی شده حساب میشه.</li>
                  <li>تسویه: وقتی رونمایی تموم شد، حراجی جمع‌بندی می‌شه. بالاترین پیشنهاد برنده می‌شه و فرد برنده مبلغ دومین پیشنهاد رو می‌ده. اتریوم های همه (کسایی که برنده نشدن و بقیه اتریوم‌های فرد برنده) برمی‌گرده. در واقع فقط فرد برنده به اندازه پیشنهاد نفر دوم، که کمتر از پیشنهاد نفر اول هست، اتریوم پرداخت می‌کنه.</li>
                  <li>پاداش: برنده یه NFT “برنده هایست‌وویس” روی بلاک‌چین می‌گیره. دور جدید شروع می‌شه!</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold">چطور شرکت کنی؟</h2>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  <li>کیف‌پولت رو وصل کن و مطمئن شو اتریوم (ETH) کافی برای پیشنهاد و کارمزد شبکه داری.</li>
                  <li>تو فاز پیشنهاد، مبلغ و پیامت رو بذار. اگه خواستی عکس یا صوت اضافه کن. کد سالت می‌گیری—امن نگهش دار. مرورگرت ذخیره‌ش می‌کنه، ولی می‌تونی نسخه پشتیبان هم دانلود کنی.</li>
                  <li>حداقل وثیقه رو بده تا پیشنهادت ثبت بشه. بقیه رو تو فاز رونمایی می‌تونی بدی.</li>
                  <li>وقتی رونمایی شروع شد، کد سالت رو وارد کن (یا داده‌های ذخیره‌شده رو بارگذاری کن)، بقیه اتریوم رو بفرست و تراکنش رو ثبت کن. فقط پیشنهادهای رونمایی‌شده معتبرن.</li>
                  <li>بعد از تموم شدن رونمایی، نتیجه رو چک کن. اگه برنده شدی، مبلغ دومین پیشنهاد رو می‌دی و پستت روی بلاک‌چین منتشر میشه و برای ۲۴ ساعت به عنوان برنده این حراج نشون داده میشه و NFT برنده رو می‌گیری.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold">چرا هایست‌وویس باحاله؟</h2>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  <li>آزادی کامل: بدون سانسور، حرفات رو بزن.</li>
                  <li>ماندگاری ابدی: پیامت روی بلاک‌چین برای همیشه ثبت می‌شه.</li>
                  <li>محتوای باکیفیت: هزینه شرکت یعنی محتوای ارزشمند، نه اسپم.</li>
                  <li>عادلانه: قوانین برای همه یکیه.</li>
                  <li>شفاف: همه‌چیز روی بلاک‌چینه.</li>
                </ul>
              </section>
            </div>
          )}

          <div className="flex justify-between items-center gap-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpen(false);
                router.push('/how-it-works');
              }}
            >
              {lang === 'en' ? 'Read full explanation' : 'توضیحات بیشتر'}
            </Button>

            <Button onClick={() => setOpen(false)} variant="primary" size="md" icon={<BookOpenCheck className="w-4 h-4" />}>
              {lang === 'en' ? 'Got it' : 'متوجه شدم'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default MissionCTA;
