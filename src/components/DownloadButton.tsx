"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Download, Loader2, Check } from "lucide-react";
import {
  resolveLatestStableDownload,
  triggerFileDownload,
} from "@/lib/useGitHubRelease";

interface DownloadButtonProps {
  label?: string;
  compact?: boolean;
  className?: string;
  onDownloadTriggered?: (result: {
    url: string;
    tag: string;
    filename: string | null;
    isDirectAsset: boolean;
  }) => void;
}

export function DownloadButton({
  label = "Download for Windows",
  compact = false,
  className = "",
  onDownloadTriggered,
}: DownloadButtonProps) {
  const [status, setStatus] = useState<"idle" | "checking" | "started">("idle");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const prefersReduced = useReducedMotion();

  const handleClick = async () => {
    if (status === "checking") return;
    setStatus("checking");

    const resolved = await resolveLatestStableDownload();
    setActiveTag(resolved.tag);

    if (resolved.isDirectAsset) {
      triggerFileDownload(resolved.url, resolved.filename);
    } else {
      window.open(resolved.url, "_blank", "noopener,noreferrer");
    }

    setStatus("started");
    onDownloadTriggered?.(resolved);

    setTimeout(() => {
      setStatus("idle");
    }, 2800);
  };

  return (
    <motion.button
      type="button"
      onClick={() => void handleClick()}
      whileHover={prefersReduced ? undefined : { y: -1 }}
      whileTap={prefersReduced ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#f0f0f4] text-[#0d0e12] font-semibold hover:bg-white transition-colors cursor-pointer ${
        compact
          ? "px-3.5 py-1.5 text-xs"
          : "px-6 py-3 text-sm shadow-[0_0_24px_rgba(255,255,255,0.14)]"
      } ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {status === "checking" ? (
          <motion.span
            key="checking"
            initial={prefersReduced ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="inline-flex items-center gap-2"
          >
            <Loader2 className={compact ? "w-3.5 h-3.5 animate-spin" : "w-4 h-4 animate-spin"} />
            <span>{compact ? "Checking..." : "Checking latest..."}</span>
          </motion.span>
        ) : status === "started" ? (
          <motion.span
            key="started"
            initial={prefersReduced ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="inline-flex items-center gap-2"
          >
            <Check className={compact ? "w-3.5 h-3.5 text-emerald-600" : "w-4 h-4 text-emerald-600"} />
            <span>
              {compact
                ? "Downloading"
                : activeTag
                  ? `Downloading ${activeTag}`
                  : "Download started"}
            </span>
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={prefersReduced ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="inline-flex items-center gap-2"
          >
            <Download className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
            <span>{label}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
