"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown, ArrowRight } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "Can AI overwrite my project files without asking?",
    a: "No. Proposed edits go into the Approvals queue first. Nothing is written to disk until you inspect the diff and explicitly approve each file.",
  },
  {
    q: "Do I need an OpenAI API key to use MCP Code?",
    a: "No. In MCP mode, you can connect your existing ChatGPT Web session using Local MCP and Secure Tunnel. Direct API mode is optional if you want to use your own OpenAI or Anthropic key.",
  },
  {
    q: "How does ChatGPT Web reach my local workspace?",
    a: "Local MCP listens on 127.0.0.1:8765/mcp, and Secure Tunnel (tunnel-client.exe) exposes an encrypted HTTPS /mcp endpoint that you add as a connector in ChatGPT Web.",
  },
  {
    q: "Where do applied file changes get saved in chat history?",
    a: "Each approved change is recorded locally in the backend and linked to the Mico response that produced it, so the per-message summary card stays accurate across restarts.",
  },
  {
    q: "Where can I find the setup walkthrough inside the app?",
    a: "Open ? → Guides inside MCP Code or visit the Connect MCP Code to ChatGPT guide directly on this site.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const prefersReduced = useReducedMotion();

  return (
    <section className="py-16 md:py-24 border-t border-white/[0.07] bg-[#0d0e12]">
      <div className="max-w-6xl mx-auto px-5 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-4">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#f0f0f4] tracking-[-0.025em] mb-3">
            Questions
          </h2>
          <p className="text-sm text-[#9496a0] leading-relaxed mb-5">
            Common answers about local approvals, Secure Tunnel, and pairing Mico
            with ChatGPT.
          </p>
          <Link
            href="/guides/connect-chatgpt/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#f0f0f4] hover:text-white transition-colors"
          >
            Read Setup Guide
            <ArrowRight className="w-3.5 h-3.5 text-[#9496a0]" />
          </Link>
        </div>

        <div className="lg:col-span-8 space-y-2.5">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={item.q}
                className="rounded-xl border border-white/[0.08] bg-[#111318] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-sm sm:text-base font-medium text-[#f0f0f4]">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#9496a0] shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={prefersReduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 text-sm text-[#9496a0] leading-relaxed border-t border-white/[0.05] pt-3">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
