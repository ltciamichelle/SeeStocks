import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Star, TrendingUp } from "lucide-react";
import RippleWatermark from "@/components/RippleWatermark";
import { clerkAppearance } from "@/lib/clerkAppearance";

export default function SignInPage() {
  return (
    <div className="relative min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden selection:bg-[#ccff00] selection:text-black">
      {/* Ambient background glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#ccff00]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#06b6d4]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Decorative ripple watermark */}
      <RippleWatermark className="absolute top-10 right-10 pointer-events-none opacity-10" size={360} strokeColor="#ccff00" />
      <RippleWatermark className="absolute bottom-10 left-10 pointer-events-none opacity-10" size={320} strokeColor="#06b6d4" />

      {/* Top back navigation button */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all backdrop-blur-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Market</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ccff00]/10 border border-[#ccff00]/20 text-[11px] font-bold text-[#ccff00] tracking-wide uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-pulse" />
          Live Auth Terminal
        </div>
      </div>

      {/* Brand header */}
      <div className="mb-6 text-center z-10">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-2 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#121214] to-[#27272a] border border-[#ccff00]/30 flex items-center justify-center shadow-lg shadow-[#ccff00]/10 group-hover:border-[#ccff00] transition-colors">
            <svg className="w-5 h-5 text-[#ccff00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <span className="font-black text-2xl tracking-tight text-white flex items-center gap-1">
            See<span className="text-[#ccff00]">Stocks</span>
          </span>
        </Link>
        <p className="text-xs text-zinc-400 font-medium">
          Sign in to unlock real-time streaming market data and sync your portfolio
        </p>

        {/* Perks pill badge strip */}
        <div className="mt-3 flex items-center justify-center gap-2 flex-wrap text-[11px] text-zinc-400">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">
            <Star className="w-3 h-3 text-[#ccff00]" /> Cloud Watchlist
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">
            <TrendingUp className="w-3 h-3 text-[#06b6d4]" /> Live Quotes
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> 256-Bit TLS
          </span>
        </div>
      </div>

      {/* Clerk SignIn Component with Neo-Fintech Appearance */}
      <div className="w-full max-w-md z-10">
        <SignIn appearance={clerkAppearance} />
      </div>

      {/* Footer copyright and status */}
      <div className="mt-8 text-center text-xs text-zinc-500 z-10 flex items-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-zinc-600" />
        <span>Secured with Clerk & MongoDB Atlas Cloud Sync</span>
      </div>
    </div>
  );
}

