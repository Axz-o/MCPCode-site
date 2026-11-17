"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Download } from "lucide-react";
import { useGitHubRelease } from "@/lib/useGitHubRelease";

interface DownloadButtonProps {
  label?: string;
  compact?: boolean;
  className?: string;
}

export function DownloadButton({
  label = "Download for Windows",
  compact = false,
  className = "",
}: DownloadButtonProps) {
  const release = useGitHubRelease();
  const prefersReduced = useReducedMotion();

  return (
    <motion.a
      href={release.downloadUrl}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={prefersReduced ? undefined : { y: -1 }}
      whileTap={prefersReduced ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#f0f0f4] text-[#0d0e12] font-semibold hover:bg-white transition-colors ${
        compact
          ? "px-3.5 py-1.5 text-xs"
          : "px-6 py-3 text-sm shadow-[0_0_24px_rgba(255,255,255,0.14)]"
      } ${className}`}
    >
      <Download className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
      <span>{label}</span>
    </motion.a>
  );
}
