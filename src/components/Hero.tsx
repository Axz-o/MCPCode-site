"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { BookOpen, Lock, CheckCircle2, Cpu, Star, ArrowRight } from "lucide-react";
import { SITE_CONFIG } from "@/lib/site";
import { useGitHubRelease } from "@/lib/useGitHubRelease";
import { AuroraHeroFrame } from "./AuroraHeroFrame";
import { DownloadButton } from "./DownloadButton";
import { MicoMascot } from "./MicoMascot";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const release = useGitHubRelease();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const windowY = useTransform(scrollYProgress, [0, 0.7], [0, 24]);
  const windowScale = useTransform(scrollYProgress, [0, 0.7], [1, 0.975]);

  return (
    <section
      ref={ref}
      className="relative pt-28 pb-14 md:pt-36 md:pb-20 overflow-hidden bg-[#0d0e12]"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[780px] h-[360px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 60% at 50% 0%, rgba(255,255,255,0.07) 0%, transparent 72%)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-5 md:px-8 text-center flex flex-col items-center">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2.5 px-2 py-1.5 rounded-full border border-white/[0.1] bg-white/[0.035] mb-7 shadow-[0_10px_30px_rgba(0,0,0,0.28)]"
        >
          <span className="px-2.5 py-1 rounded-full bg-[#f0f0f4] text-[#0d0e12] text-[10px] font-bold tracking-[0.08em] uppercase">
            0.1 Alpha
          </span>
          <span className="text-[11px] sm:text-xs font-medium text-[#b4b7c2] pr-2">
            {release.tag ?? SITE_CONFIG.releaseTag} · Windows 11
          </span>
        </motion.div>

        <motion.h1
          initial={prefersReduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="text-[2.75rem] sm:text-6xl md:text-7xl font-semibold text-[#f0f0f4] tracking-[-0.045em] leading-[0.98] mb-6 max-w-4xl"
        >
          <span className="inline-flex items-center justify-center gap-3 sm:gap-4">
            MCP Code
            <span className="inline-flex translate-y-0.5 items-center justify-center align-middle">
              <MicoMascot size={52} state="default" label="Mico" />
            </span>
          </span>
          <span className="mt-2 block text-[#8f929c]">Your code stays in your hands.</span>
        </motion.h1>

        <motion.p
          initial={prefersReduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-base sm:text-lg text-[#a4a7b0] max-w-2xl mx-auto leading-relaxed mb-8"
        >
          Work with Mico inside your local projects. Every proposed edit waits in a
          readable diff until you explicitly approve it.
        </motion.p>

        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto mb-8"
        >
          <DownloadButton label="Download v0.1 Alpha" />
          <Link
            href="/guides/connect-chatgpt/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.07] text-[#f0f0f4] text-sm font-medium transition-colors"
          >
            <BookOpen className="w-4 h-4 text-[#9496a0]" />
            Connect to ChatGPT
            <ArrowRight className="h-3.5 w-3.5 text-[#777a84]" />
          </Link>
          {release.stars !== null && <a
            href={SITE_CONFIG.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.07] text-[#f0f0f4] text-sm font-medium transition-colors"
          >
            <Star className="w-4 h-4 text-amber-300" />
            <span>Star on GitHub</span>
            <span className="text-xs text-[#9496a0]">{release.stars}</span>
          </a>}
        </motion.div>

        <motion.div
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 rounded-2xl border border-white/[0.07] bg-white/[0.018] px-5 py-3 text-[11px] sm:text-xs text-[#858893] mb-12"
        >
          <span className="inline-flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400/80" />
            Local MCP server on your machine
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/80" />
            Approval-gated file writes
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-emerald-400/80" />
            Works with ChatGPT via Secure Tunnel
          </span>
        </motion.div>
      </div>

      {/* Main visual: interactive TSX replica of MCP Code */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
        <div
          className="absolute -inset-6 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(82, 108, 224, 0.12) 0%, transparent 72%)",
            filter: "blur(32px)",
          }}
        />

        <motion.div
          style={prefersReduced ? undefined : { y: windowY, scale: windowScale }}
          className="relative rounded-2xl p-[1px] bg-gradient-to-b from-white/[0.18] via-white/[0.06] to-transparent shadow-[0_32px_90px_rgba(0,0,0,0.85)]"
        >
          <div className="rounded-[15px] overflow-hidden h-[520px] sm:h-[580px] md:h-[640px]">
            <AuroraHeroFrame />
          </div>
        </motion.div>
        <p className="mt-3 text-center text-xs text-[#7d808c]">
          Interactive 1:1 preview of MCP Code. Click through Chats, Approvals, Settings, or ? → Replay introduction.
        </p>
      </div>
    </section>
  );
}
