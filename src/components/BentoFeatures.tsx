"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ShieldCheck,
  HardDrive,
  Cable,
  ArrowLeftRight,
  Lock,
  Check,
  FolderGit2,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

const PROVIDERS_ROW_1 = [
  "ChatGPT Web (MCP)",
  "Local MCP :8765",
  "Secure Tunnel",
  "OpenAI API",
  "Anthropic Claude",
];

const PROVIDERS_ROW_2 = [
  "Diff Approvals",
  "Applied Changes Card",
  "Project Permissions",
  "Aurora Dark & Light",
  "Mico Pairing",
];

export function BentoFeatures() {
  const [mode, setMode] = useState<"MCP" | "API">("MCP");
  const [secondApproved, setSecondApproved] = useState(false);
  const prefersReduced = useReducedMotion();

  const fileCount = secondApproved ? 2 : 1;
  const totalAdd = secondApproved ? 61 : 34;
  const totalDel = secondApproved ? 20 : 14;

  return (
    <section className="py-16 md:py-24 border-t border-white/[0.07] bg-[#0d0e12]">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <div className="max-w-2xl mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#f0f0f4] tracking-[-0.025em] mb-3">
            What MCP Code does
          </h2>
          <p className="text-sm sm:text-base text-[#9496a0] leading-relaxed">
            Your repository stays on disk while ChatGPT and API models get structured,
            approval-gated access.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
          {/* Card 1 (wide): Interactive approval-gated writes */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-7 rounded-2xl border border-white/[0.09] bg-[#111318] p-6 flex flex-col justify-between gap-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400 mb-3">
                  <ShieldCheck className="w-4 h-4" />
                  Approval-gated writes
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-[#f0f0f4] mb-2">
                  Review every diff before disk changes
                </h3>
                <p className="text-sm text-[#9496a0] leading-relaxed">
                  Edits wait in Approvals until you accept them. Approved files appear
                  immediately in the message&apos;s applied changes card.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#0d0e12] p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#f0f0f4]">
                  {fileCount} {fileCount === 1 ? "changed file" : "changed files"}
                </span>
                <span className="font-mono flex items-center gap-2">
                  <span className="text-emerald-400">+{totalAdd}</span>
                  <span className="text-red-400">−{totalDel}</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono py-2 px-3 rounded-lg bg-[#161920] border border-white/[0.06]">
                <span className="text-[#e5e7eb] truncate">
                  AuroraTooltip.tsx <span className="text-[#7d808c]">· ui/src/aurora</span>
                </span>
                <span className="shrink-0 ml-2 flex items-center gap-2">
                  <span className="text-emerald-400">+34</span>
                  <span className="text-red-400">−14</span>
                </span>
              </div>

              <AnimatePresence mode="wait">
                {secondApproved ? (
                  <motion.div
                    key="approved-row"
                    initial={prefersReduced ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-between text-xs font-mono py-2 px-3 rounded-lg bg-[#161920] border border-emerald-500/25"
                  >
                    <span className="text-[#e5e7eb] truncate">
                      aurora.css <span className="text-[#7d808c]">· ui/src/aurora</span>
                    </span>
                    <span className="shrink-0 ml-2 flex items-center gap-2.5">
                      <span className="text-emerald-400">+27</span>
                      <span className="text-red-400">−6</span>
                      <button
                        type="button"
                        onClick={() => setSecondApproved(false)}
                        title="Reset demo"
                        className="text-[#7d808c] hover:text-[#f0f0f4] transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="pending-row"
                    initial={prefersReduced ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-between text-xs font-mono py-2 px-3 rounded-lg bg-[#161920]/70 border border-amber-400/20"
                  >
                    <span className="text-[#b4b7c2] truncate">
                      aurora.css <span className="text-[#7d808c]">(pending)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSecondApproved(true)}
                      className="shrink-0 ml-2 px-2.5 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-[11px] font-sans font-medium transition-colors"
                    >
                      Approve
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Card 2: Marquee of connections & capabilities */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-5 rounded-2xl border border-white/[0.09] bg-[#111318] p-6 flex flex-col justify-between gap-6 overflow-hidden"
          >
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[#9496a0] mb-3">
                <Cable className="w-4 h-4 text-[#f0f0f4]" />
                Flexible connections
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-[#f0f0f4] mb-2">
                Use the AI plan you already have
              </h3>
              <p className="text-sm text-[#9496a0] leading-relaxed">
                Pair ChatGPT Web via Local MCP and Secure Tunnel, or use your own
                OpenAI or Anthropic key for direct API tasks.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-2.5 overflow-hidden -mx-2 px-2 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
                <div className="animate-marquee gap-2">
                  {[...PROVIDERS_ROW_1, ...PROVIDERS_ROW_1].map((label, idx) => (
                    <span
                      key={`${label}-${idx}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#161920] border border-white/[0.12] text-[#f0f0f4] whitespace-nowrap shrink-0"
                    >
                      <Check className="w-3 h-3 text-emerald-400" />
                      {label}
                    </span>
                  ))}
                </div>
                <div
                  className="animate-marquee gap-2"
                  style={{ animationDirection: "reverse", animationDuration: "26s" }}
                >
                  {[...PROVIDERS_ROW_2, ...PROVIDERS_ROW_2].map((label, idx) => (
                    <span
                      key={`${label}-${idx}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#161920] border border-white/[0.1] text-[#d1d5db] whitespace-nowrap shrink-0"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-[#0d0e12] px-3.5 py-2.5 flex items-center justify-between text-xs text-[#9496a0]">
                <span>Works with ChatGPT Web or API keys</span>
                <span className="font-medium text-emerald-400">MCP / API</span>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Stored on your computer */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.35, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-5 rounded-2xl border border-white/[0.09] bg-[#111318] p-6 flex flex-col justify-between gap-6"
          >
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[#9496a0] mb-3">
                <HardDrive className="w-4 h-4 text-[#f0f0f4]" />
                Local storage
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-[#f0f0f4] mb-2">
                Your code stays on your disk
              </h3>
              <p className="text-sm text-[#9496a0] leading-relaxed">
                Projects, read/edit/build permissions, chat history, and applied
                change records stay in your local workspace.
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#0d0e12] p-4 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-[#d1d5db]">
                <span className="inline-flex items-center gap-2">
                  <FolderGit2 className="w-3.5 h-3.5 text-emerald-400" />
                  127.0.0.1:8765/mcp
                </span>
                <Lock className="w-3.5 h-3.5 text-[#7d808c]" />
              </div>
              <div className="text-[#7d808c]">
                Permissions: read ✓ · edit (approval) ✓ · delete ✗
              </div>
            </div>
          </motion.div>

          {/* Card 4 (wide): Animated MCP / API mode switch */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.35, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-7 rounded-2xl border border-white/[0.09] bg-[#111318] p-6 flex flex-col justify-between gap-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-medium text-[#9496a0] mb-3">
                  <ArrowLeftRight className="w-4 h-4 text-[#f0f0f4]" />
                  Switch engines mid-project
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-[#f0f0f4] mb-2">
                  Switch between MCP and API without losing context
                </h3>
              </div>

              <div className="inline-flex items-center p-1 rounded-full bg-[#0d0e12] border border-white/[0.09] self-start shrink-0 relative">
                {(["MCP", "API"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMode(item)}
                    className={`relative px-3.5 py-1 rounded-full text-xs font-medium transition-colors z-10 ${
                      mode === item ? "text-[#0d0e12] font-semibold" : "text-[#9496a0] hover:text-[#f0f0f4]"
                    }`}
                  >
                    {mode === item && (
                      <motion.span
                        layoutId="bento-mode-pill"
                        transition={
                          prefersReduced
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 420, damping: 32 }
                        }
                        className="absolute inset-0 rounded-full bg-[#f0f0f4] -z-10"
                      />
                    )}
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#0d0e12] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={prefersReduced ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="text-xs sm:text-sm text-[#b4b7c2]"
                >
                  {mode === "MCP" ? (
                    <>
                      <span className="font-semibold text-[#f0f0f4]">MCP mode:</span>{" "}
                      Routes prompts from Mico through Local MCP and Secure Tunnel to
                      your paired ChatGPT Web session.
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-[#f0f0f4]">API mode:</span>{" "}
                      Uses your configured OpenAI or Anthropic key with model and
                      reasoning effort controls directly in Mico.
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              <Link
                href="/guides/connect-chatgpt/"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#f0f0f4] hover:text-white shrink-0"
              >
                Setup guide
                <ArrowRight className="w-3.5 h-3.5 text-[#9496a0]" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
