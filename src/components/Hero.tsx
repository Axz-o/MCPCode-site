"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Download, BookOpen, Lock, CheckCircle2, Cpu, Star } from "lucide-react";
import { SITE_CONFIG } from "@/lib/site";
import { useGitHubRelease } from "@/lib/useGitHubRelease";
import { AuroraHeroFrame } from "./AuroraHeroFrame";
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
      className="relative pt-24 pb-14 md:pt-32 md:pb-20 overflow-hidden bg-[#0d0e12]"
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

      <div className="relative z-10 max-w-4xl mx-auto px-5 md:px-8 text-center flex flex-col items-center">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2.5 px-2.5 py-1 rounded-full border border-white/[0.1] bg-white/[0.03] mb-6"
        >
          <span className="px-2 py-0.5 rounded-full bg-[#f0f0f4] text-[#0d0e12] text-[10px] font-semibold tracking-wide uppercase">
            Beta
          </span>
          <span className="text-xs font-medium text-[#d1d5db] pr-1.5">
            MCP Code v{SITE_CONFIG.version} · Windows 11
          </span>
        </motion.div>

        <motion.h1
          initial={prefersReduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-5xl md:text-6xl font-semibold text-[#f0f0f4] tracking-[-0.03em] leading-[1.06] mb-5 max-w-3xl flex flex-wrap items-center justify-center gap-x-3 gap-y-2"
        >
          <span>Meet</span>
          <span className="inline-flex items-center justify-center align-middle">
            <MicoMascot size={46} state="default" label="Mico" />
          </span>
          <span>MCP Code</span>
        </motion.h1>

        <motion.p
          initial={prefersReduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-base sm:text-lg text-[#9496a0] max-w-xl mx-auto leading-relaxed mb-8"
        >
          MCP Code connects ChatGPT and MCP clients directly to your local projects.
          Mico proposes file edits in a staged queue so you can inspect every diff in
          Approvals before anything writes to disk.
        </motion.p>

        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto mb-8"
        >
          <a
            href={release.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#f0f0f4] text-[#0d0e12] text-sm font-semibold hover:bg-white transition-colors shadow-[0_0_24px_rgba(255,255,255,0.14)]"
          >
            <Download className="w-4 h-4" />
            Download for Windows
          </a>
          <Link
            href="/guides/connect-chatgpt/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.07] text-[#f0f0f4] text-sm font-medium transition-colors"
          >
            <BookOpen className="w-4 h-4 text-[#9496a0]" />
            Setup Guide
          </Link>
          <a
            href={SITE_CONFIG.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.07] text-[#f0f0f4] text-sm font-medium transition-colors"
          >
            <Star className="w-4 h-4 text-amber-300" />
            <span>Star on GitHub</span>
            {release.stars !== null && (
              <span className="text-xs text-[#9496a0]">{release.stars}</span>
            )}
          </a>
        </motion.div>

        <motion.div
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#7d808c] mb-12"
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
          Interactive 1:1 preview of MCP Code. Click through Chats, Projects, Approvals, and Settings.
        </p>
      </div>
    </section>
  );
}
