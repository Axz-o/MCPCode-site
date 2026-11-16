"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { MessageSquare, FileDiff, ShieldCheck, ArrowRight, Check } from "lucide-react";
import { withBasePath } from "@/lib/site";

type StepId = "task" | "proposal" | "approval";

const WORKFLOW_STEPS: {
  id: StepId;
  step: string;
  title: string;
  subtitle: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "task",
    step: "01",
    title: "Ask Mico in your project",
    subtitle: "Send a task from the local chat workspace",
    detail:
      "Pick a local project and write what you need in Mico. In MCP mode, your request routes through Local MCP and Secure Tunnel to ChatGPT with read access scoped to that folder.",
    icon: MessageSquare,
  },
  {
    id: "proposal",
    step: "02",
    title: "Review proposed file changes",
    subtitle: "Edits are staged. Nothing writes to disk yet.",
    detail:
      "Instead of silently overwriting files, Mico submits structured change proposals. You see every file path and exact line delta before deciding what to keep.",
    icon: FileDiff,
  },
  {
    id: "approval",
    step: "03",
    title: "Approve locally in Approvals",
    subtitle: "Apply selected files and keep a per-message audit card",
    detail:
      "Open Approvals to inspect the full diff and approve individual files. Once applied, Mico attaches a persistent summary card directly under that response in chat.",
    icon: ShieldCheck,
  },
];

export function WorkflowSection() {
  const [active, setActive] = useState<StepId>("task");
  const prefersReduced = useReducedMotion();

  return (
    <section
      id="workflow"
      className="py-16 md:py-24 border-t border-white/[0.07] bg-[#0d0e12]"
    >
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <div className="max-w-2xl mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#f0f0f4] tracking-[-0.025em] mb-3">
            One clear loop from prompt to disk
          </h2>
          <p className="text-sm sm:text-base text-[#9496a0] leading-relaxed">
            Follow a single task in MCP Code: ask Mico, inspect the staged diff, and
            approve only the changes you want on disk.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left: 3-step selector */}
          <div className="lg:col-span-5 space-y-3">
            {WORKFLOW_STEPS.map((item) => {
              const Icon = item.icon;
              const selected = active === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActive(item.id)}
                  className={`w-full text-left rounded-xl p-4 sm:p-5 border transition-colors ${
                    selected
                      ? "bg-[#161920] border-white/[0.16]"
                      : "bg-[#111318] border-white/[0.07] hover:border-white/[0.12]"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                        selected
                          ? "bg-white/[0.08] border-white/[0.16] text-[#f0f0f4]"
                          : "bg-white/[0.03] border-white/[0.07] text-[#9496a0]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-[#7d808c]">
                          {item.step}
                        </span>
                        <span className="text-sm font-semibold text-[#f0f0f4]">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-xs text-[#9496a0] mb-1.5">{item.subtitle}</p>
                      {selected && (
                        <p className="text-xs sm:text-sm text-[#b4b7c2] leading-relaxed pt-1">
                          {item.detail}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            <div className="pt-2">
              <Link
                href="/guides/connect-chatgpt/"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#f0f0f4] hover:text-white transition-colors"
              >
                Read the Connect to ChatGPT guide
                <ArrowRight className="w-3.5 h-3.5 text-[#9496a0]" />
              </Link>
            </div>
          </div>

          {/* Right: Step visual stage */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-white/[0.09] bg-[#111318] overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.65)]">
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#12141a] border-b border-white/[0.07]">
                  <span className="text-xs font-medium text-[#9496a0]">
                    {active === "task" && "Step 01: Mico Chat"}
                    {active === "proposal" && "Step 02: Staged Proposal Queue"}
                    {active === "approval" && "Step 03: Approvals & Applied Card"}
                  </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Approval-gated
                </span>
              </div>

              <AnimatePresence mode="wait">
                {active === "task" && (
                  <motion.div
                    key="task"
                    initial={prefersReduced ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <img
                      src={withBasePath("/screenshots/mico-chat.png")}
                      alt="Mico chat workspace in MCP Code"
                      width={1440}
                      height={900}
                      className="w-full h-auto block"
                    />
                  </motion.div>
                )}

                {active === "proposal" && (
                  <motion.div
                    key="proposal"
                    initial={prefersReduced ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="p-5 sm:p-7 space-y-4"
                  >
                    <div className="rounded-xl border border-white/[0.08] bg-[#161920] p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <span className="text-xs font-semibold text-[#f0f0f4]">
                          Pending proposal from Mico
                        </span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-400/20">
                          Waiting for approval
                        </span>
                      </div>
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#0d0e12] border border-white/[0.06]">
                          <span className="text-[#f0f0f4] truncate">
                            AuroraTooltip.tsx{" "}
                            <span className="text-[#7d808c]">· ui/src/aurora</span>
                          </span>
                          <span className="shrink-0 ml-3 flex items-center gap-2">
                            <span className="text-emerald-400">+34</span>
                            <span className="text-red-400">−14</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#0d0e12] border border-white/[0.06]">
                          <span className="text-[#f0f0f4] truncate">
                            aurora.css{" "}
                            <span className="text-[#7d808c]">· ui/src/aurora</span>
                          </span>
                          <span className="shrink-0 ml-3 flex items-center gap-2">
                            <span className="text-emerald-400">+27</span>
                            <span className="text-red-400">−6</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/[0.07] bg-[#0d0e12] p-4 font-mono text-xs space-y-1.5">
                      <div className="text-[#7d808c]">@@ ui/src/aurora/AuroraTooltip.tsx</div>
                      <div className="text-red-400/90 bg-red-500/10 px-2 py-0.5 rounded">
                        - const offset = 6;
                      </div>
                      <div className="text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded">
                        + const offset = 10;
                      </div>
                      <div className="text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded">
                        + const dismissDelayMs = 120;
                      </div>
                    </div>
                  </motion.div>
                )}

                {active === "approval" && (
                  <motion.div
                    key="approval"
                    initial={prefersReduced ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-0"
                  >
                    <img
                      src={withBasePath("/screenshots/approvals-diff.png")}
                      alt="Approvals diff screen in MCP Code"
                      width={1440}
                      height={900}
                      className="w-full h-auto block"
                    />
                    <div className="px-4 py-3 bg-[#12141a] border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 font-medium text-[#f0f0f4]">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        2 changed files applied to disk
                      </span>
                      <span className="font-mono flex items-center gap-2">
                        <span className="text-emerald-400">+61</span>
                        <span className="text-red-400">−20</span>
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
