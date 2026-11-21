"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, BookOpen, Star } from "lucide-react";
import { SITE_CONFIG, withBasePath } from "@/lib/site";
import { useGitHubRelease } from "@/lib/useGitHubRelease";
import { DownloadButton } from "./DownloadButton";

type PlatformId = "windows" | "macos" | "linux";

function WindowsLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M2 3.5h9.5v9.5H2V3.5zm10.5 0H22v9.5h-9.5V3.5zM2 14h9.5v9.5H2V14zm10.5 0H22v9.5h-9.5V14z" />
    </svg>
  );
}

function AppleLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
    </svg>
  );
}

function LinuxLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2c-2.3 0-3.8 1.6-3.8 4.1 0 1 .2 1.9.4 2.7-.9 1.2-2.4 3.3-2.4 5.7 0 2.1.8 3.7 2 4.7-.5.3-.9.7-.9 1.2 0 .9 1.3 1.6 3 1.6.9 0 1.7-.2 2.2-.5.5.3 1.3.5 2.2.5 1.7 0 3-.7 3-1.6 0-.5-.4-.9-.9-1.2 1.2-1 2-2.6 2-4.7 0-2.4-1.5-4.5-2.4-5.7.2-.8.4-1.7.4-2.7C15.8 3.6 14.3 2 12 2zm-1.4 4.1c.4 0 .7.4.7.9s-.3.9-.7.9-.7-.4-.7-.9.3-.9.7-.9zm2.8 0c.4 0 .7.4.7.9s-.3.9-.7.9-.7-.4-.7-.9.3-.9.7-.9zM12 8.7c.9 0 1.7.5 1.7.9 0 .4-.8 1-1.7 1s-1.7-.6-1.7-1c0-.4.8-.9 1.7-.9zm0 3.2c1.8 0 3.2 1.8 3.2 4.1 0 1.7-.7 3-1.7 3.6-.4-.2-.9-.3-1.5-.3s-1.1.1-1.5.3c-1-.6-1.7-1.9-1.7-3.6 0-2.3 1.4-4.1 3.2-4.1z" />
    </svg>
  );
}

interface PlatformConfig {
  id: PlatformId;
  name: string;
  osRequirement: string;
  available: boolean;
  statusLabel: string;
  accentGradient: string;
  iconBg: string;
  Icon: React.ComponentType<{ className?: string }>;
  highlights: string[];
  unavailableNote?: string;
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: "windows",
    name: "Windows",
    osRequirement: "Windows 11 (64-bit)",
    available: true,
    statusLabel: "Available",
    accentGradient:
      "radial-gradient(circle at 15% 15%, rgba(96, 165, 250, 0.14), transparent 58%)",
    iconBg: "bg-sky-500/15 border-sky-400/30 text-sky-300",
    Icon: WindowsLogo,
    highlights: [
      "Tauri desktop app with native Aurora UI",
      "Bundled Local MCP server on port 8765",
      "Secure Tunnel diagnostics & ChatGPT pairing",
      "Approval-gated diff review before disk write",
    ],
  },
  {
    id: "macos",
    name: "macOS",
    osRequirement: "Apple Silicon & Intel (macOS 13+)",
    available: false,
    statusLabel: "Unavailable",
    accentGradient:
      "radial-gradient(circle at 15% 15%, rgba(167, 139, 250, 0.1), transparent 58%)",
    iconBg: "bg-white/[0.04] border-white/[0.09] text-[#9496a0]",
    Icon: AppleLogo,
    highlights: [
      "Universal .dmg for Apple Silicon and Intel",
      "Keychain integration for API & tunnel keys",
      "Full Local MCP and Approvals support",
    ],
    unavailableNote: "macOS builds will follow after the Windows alpha.",
  },
  {
    id: "linux",
    name: "Linux",
    osRequirement: "AppImage & .deb (x64)",
    available: false,
    statusLabel: "Unavailable",
    accentGradient:
      "radial-gradient(circle at 15% 15%, rgba(52, 211, 153, 0.09), transparent 58%)",
    iconBg: "bg-white/[0.04] border-white/[0.09] text-[#9496a0]",
    Icon: LinuxLogo,
    highlights: [
      "AppImage and Debian packages",
      "Secret Service keyring integration",
      "Full Local MCP and Approvals support",
    ],
    unavailableNote: "Linux packaging will follow after the Windows alpha.",
  },
];

export function DownloadSection() {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId>("windows");
  const prefersReduced = useReducedMotion();
  const release = useGitHubRelease();

  const activePlatform =
    PLATFORMS.find((p) => p.id === selectedPlatform) ?? PLATFORMS[0];
  const ActiveIcon = activePlatform.Icon;

  return (
    <section
      id="download"
      className="py-20 md:py-24 border-t border-white/[0.07] bg-[#0d0e12]"
    >
      <div className="max-w-5xl mx-auto px-5 md:px-8">
        {/* Clean centered header + animated OS switcher */}
        <div className="flex flex-col items-center text-center max-w-xl mx-auto mb-10">
          <img
            src={withBasePath("/app-icon.png")}
            alt="MCP Code"
            width={56}
            height={56}
            className="w-14 h-14 rounded-2xl object-cover shadow-[0_12px_30px_rgba(0,0,0,0.55)] mb-4"
          />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.1] bg-white/[0.03] text-xs text-[#d1d5db] mb-4">
              <span className={`w-1.5 h-1.5 rounded-full ${release.isDirectAsset ? "bg-emerald-400" : "bg-[#8b8e98]"}`} />
            <span>{release.tag ?? (release.accessRestricted ? "v0.1.0 Alpha · private release" : release.checked ? SITE_CONFIG.releaseTag : "Checking releases…")}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-semibold text-[#f0f0f4] tracking-[-0.028em] mb-3">
            Download MCP Code
          </h2>
          <p className="text-sm sm:text-base text-[#9496a0] mb-7">
            Run Mico locally on your machine with approval-gated file edits.
          </p>

          {/* Animated OS switcher pill */}
          <div className="inline-flex items-center p-1 rounded-full bg-[#111318] border border-white/[0.09]">
            {PLATFORMS.map((p) => {
              const Icon = p.Icon;
              const isSelected = selectedPlatform === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlatform(p.id)}
                  className={`relative inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors z-10 cursor-pointer ${
                    isSelected
                      ? "text-[#0d0e12] font-semibold"
                      : "text-[#9496a0] hover:text-[#f0f0f4]"
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="download-os-pill"
                      transition={
                        prefersReduced
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 420, damping: 32 }
                      }
                      className="absolute inset-0 rounded-full bg-[#f0f0f4] -z-10"
                    />
                  )}
                  <Icon className="w-4 h-4" />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Single clean animated platform card */}
        <div className="rounded-2xl border border-white/[0.1] bg-[#111318] overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePlatform.id}
              initial={prefersReduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 md:grid-cols-12"
            >
              {/* Left: OS identity + actions */}
              <div
                className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-7 border-b md:border-b-0 md:border-r border-white/[0.07]"
                style={{ backgroundImage: activePlatform.accentGradient }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${activePlatform.iconBg}`}
                  >
                    <ActiveIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <h3 className="text-xl font-semibold text-[#f0f0f4]">
                        {activePlatform.name}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                          activePlatform.available && release.isDirectAsset
                            ? "bg-emerald-500/15 border-emerald-400/25 text-emerald-300"
                            : "bg-white/[0.05] border-white/[0.1] text-[#9496a0]"
                        }`}
                      >
                          {activePlatform.id === "windows" && !release.isDirectAsset ? (release.accessRestricted ? "0.1 Alpha" : release.checked ? "Check releases" : "Checking…") : activePlatform.statusLabel}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#9496a0]">
                      {activePlatform.osRequirement}
                    </p>
                  </div>
                </div>

                {activePlatform.available ? (
                  <div className="space-y-3">
                    <p className="text-xs text-[#b4b7c2]">
                      {release.isDirectAsset
                        ? `${release.tag} · ${release.filename}${release.sizeBytes ? ` · ${(release.sizeBytes / 1048576).toFixed(1)} MB` : ""}`
                        : !release.checked
                          ? "Checking the current Windows installer on GitHub…"
                          : release.accessRestricted
                          ? "Installers are in a private repository. GitHub access is required to view or download them."
                          : "No public Windows installer was confirmed. Check GitHub Releases for availability."}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                    <DownloadButton label="Download for Windows" />
                    {release.stars !== null && <a
                      href={SITE_CONFIG.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.07] text-sm font-medium text-[#f0f0f4] transition-colors"
                    >
                      <Star className="w-4 h-4 text-amber-300" />
                      <span>Star on GitHub</span>
                      <span className="text-xs text-[#9496a0]">{release.stars}</span>
                    </a>}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-[#9496a0]">
                      {activePlatform.unavailableNote}
                    </p>
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/[0.08] bg-white/[0.02] text-sm font-medium text-[#666870] cursor-not-allowed"
                    >
                      Not available yet
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Clean highlights + Setup Guide */}
              <div className="md:col-span-5 p-6 sm:p-8 bg-[#0f1116] flex flex-col justify-between gap-6">
                <ul className="space-y-3">
                  {activePlatform.highlights.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-[#b4b7c2]"
                    >
                      <Check
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          activePlatform.available
                            ? "text-emerald-400"
                            : "text-[#666870]"
                        }`}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/guides/connect-chatgpt/"
                  className="inline-flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#161920] border border-white/[0.08] hover:border-white/[0.16] text-xs font-medium text-[#f0f0f4] transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#9496a0]" />
                    Setup Guide
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#9496a0]" />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[#9496a0]">
          <Link
            href="/news/mcp-code-v0-1-0-alpha/"
            className="hover:text-[#f0f0f4] transition-colors"
          >
            Release Notes
          </Link>
          <a
            href={SITE_CONFIG.releasesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#f0f0f4] transition-colors"
          >
            GitHub Releases
          </a>
        </div>
      </div>
    </section>
  );
}
