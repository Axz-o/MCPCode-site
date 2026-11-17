"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Copy,
  HardDrive,
  BookOpen,
  ExternalLink,
  Bell,
  ChevronDown,
  Package,
  Star,
} from "lucide-react";
import { SITE_CONFIG, withBasePath } from "@/lib/site";
import { formatBytes, useGitHubRelease } from "@/lib/useGitHubRelease";
import { DownloadButton } from "./DownloadButton";

type PlatformId = "windows" | "macos" | "linux";
type WindowsPackage = "installer" | "portable";

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
  tagline: string;
  osRequirement: string;
  arch: string;
  available: boolean;
  statusLabel: string;
  accentGradient: string;
  iconBg: string;
  Icon: React.ComponentType<{ className?: string }>;
  highlights: string[];
  roadmapNote?: string;
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: "windows",
    name: "Windows",
    tagline: "Windows 11 Desktop",
    osRequirement: "Windows 11 (64-bit, 22H2 or newer)",
    arch: "x64",
    available: true,
    statusLabel: "Available",
    accentGradient:
      "radial-gradient(circle at 85% 15%, rgba(96, 165, 250, 0.18), transparent 58%), radial-gradient(circle at 15% 85%, rgba(99, 102, 241, 0.14), transparent 55%)",
    iconBg: "bg-sky-500/15 border-sky-400/30 text-sky-300",
    Icon: WindowsLogo,
    highlights: [
      "Tauri desktop app with native Aurora UI",
      "Bundled Python Local MCP server (:8765)",
      "Secure Tunnel client diagnostics & pairing",
      "Diff review in Approvals before disk write",
    ],
  },
  {
    id: "macos",
    name: "macOS",
    tagline: "Apple Silicon & Intel",
    osRequirement: "macOS 13 Ventura or newer",
    arch: "arm64 / x64",
    available: false,
    statusLabel: "Unavailable",
    accentGradient:
      "radial-gradient(circle at 85% 15%, rgba(167, 139, 250, 0.12), transparent 58%)",
    iconBg: "bg-white/[0.04] border-white/[0.09] text-[#9496a0]",
    Icon: AppleLogo,
    highlights: [
      "Universal .dmg build for Apple Silicon & Intel",
      "Keychain integration for API & tunnel secrets",
      "Native macOS window translucency",
    ],
    roadmapNote:
      "macOS builds are queued after Windows beta stabilization and Apple notarization setup.",
  },
  {
    id: "linux",
    name: "Linux",
    tagline: "AppImage & Debian package",
    osRequirement: "Ubuntu 22.04+, Fedora 39+, Arch",
    arch: "x64",
    available: false,
    statusLabel: "Unavailable",
    accentGradient:
      "radial-gradient(circle at 85% 15%, rgba(52, 211, 153, 0.1), transparent 58%)",
    iconBg: "bg-white/[0.04] border-white/[0.09] text-[#9496a0]",
    Icon: LinuxLogo,
    highlights: [
      "Portable AppImage and .deb / .rpm packages",
      "Secret Service keyring support",
      "Headless Local MCP sidecar compatibility",
    ],
    roadmapNote:
      "Linux packaging (WebKitGTK & AppImage bundling) will follow after the Windows beta.",
  },
];

const WINDOWS_PACKAGES: Record<
  WindowsPackage,
  {
    label: string;
    filename: string;
    format: string;
    size: string;
    command: string;
  }
> = {
  installer: {
    label: "Setup Installer (.exe)",
    filename: `MCP-Code-${SITE_CONFIG.version}-x64-setup.exe`,
    format: "NSIS / MSI Desktop Installer",
    size: "~85 MB",
    command: `Invoke-WebRequest "${SITE_CONFIG.downloadUrl}" -OutFile "MCP-Code-Setup.exe"`,
  },
  portable: {
    label: "Releases Archive",
    filename: `MCPCode-v${SITE_CONFIG.version}-windows-x64.zip`,
    format: "GitHub Releases Assets",
    size: "All checksums & builds",
    command: `Start-Process "${SITE_CONFIG.releasesUrl}"`,
  },
};

export function DownloadSection() {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId>("windows");
  const [winPkg, setWinPkg] = useState<WindowsPackage>("installer");
  const [showVerify, setShowVerify] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadedPrompt, setDownloadedPrompt] = useState(false);
  const prefersReduced = useReducedMotion();
  const release = useGitHubRelease();

  const activePlatform =
    PLATFORMS.find((p) => p.id === selectedPlatform) ?? PLATFORMS[0];
  const ActiveIcon = activePlatform.Icon;
  const activePkg =
    winPkg === "installer"
      ? {
          ...WINDOWS_PACKAGES.installer,
          filename: release.filename ?? WINDOWS_PACKAGES.installer.filename,
          size: release.sizeBytes
            ? formatBytes(release.sizeBytes)
            : WINDOWS_PACKAGES.installer.size,
          command: `Invoke-WebRequest "${release.downloadUrl}" -OutFile "${release.filename ?? "MCP-Code-Setup.exe"}"`,
        }
      : WINDOWS_PACKAGES.portable;

  const handleCopyCommand = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(activePkg.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <section
      id="download"
      className="py-20 md:py-28 border-t border-white/[0.07] bg-[#0d0e12] relative overflow-hidden"
    >
      {/* Subtle ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[760px] h-[320px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 0%, rgba(99, 102, 241, 0.09) 0%, transparent 72%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-5 md:px-8">
        {/* Centered Header with App Icon + Version + OS Selector */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-12">
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mb-5 relative"
          >
            <div
              className="absolute -inset-4 rounded-3xl pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(99, 102, 241, 0.28), transparent 70%)",
                filter: "blur(16px)",
              }}
            />
            <img
              src={withBasePath("/app-icon.png")}
              alt="MCP Code"
              width={64}
              height={64}
              className="relative w-16 h-16 rounded-2xl object-cover shadow-[0_14px_34px_rgba(0,0,0,0.6)]"
            />
          </motion.div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.1] bg-white/[0.03] text-xs text-[#d1d5db] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>
              MCP Code v{SITE_CONFIG.version} {SITE_CONFIG.stage}
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[#f0f0f4] tracking-[-0.03em] mb-3.5">
            Download for your desktop
          </h2>
          <p className="text-sm sm:text-base text-[#9496a0] leading-relaxed mb-8">
            Run Local MCP, pair Mico with ChatGPT Web, and inspect every proposed
            edit in Approvals before it touches your disk.
          </p>

          {/* Animated OS Switcher Pill */}
          <div className="inline-flex items-center p-1 rounded-full bg-[#111318] border border-white/[0.09] shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
            {PLATFORMS.map((p) => {
              const Icon = p.Icon;
              const isSelected = selectedPlatform === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlatform(p.id)}
                  className={`relative inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors z-10 ${
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

        {/* Interactive Featured OS Stage */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-white/[0.1] bg-[#111318] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.65)] mb-6"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activePlatform.id}
              initial={prefersReduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 lg:grid-cols-12"
            >
              {/* Left side: OS hero & primary action */}
              <div
                className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-7 border-b lg:border-b-0 lg:border-r border-white/[0.07]"
                style={{ backgroundImage: activePlatform.accentGradient }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${activePlatform.iconBg}`}
                    >
                      <ActiveIcon className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5 mb-1">
                        <h3 className="text-xl sm:text-2xl font-semibold text-[#f0f0f4]">
                          {activePlatform.name}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                            activePlatform.available
                              ? "bg-emerald-500/15 border-emerald-400/25 text-emerald-300"
                              : "bg-white/[0.05] border-white/[0.1] text-[#9496a0]"
                          }`}
                        >
                          {activePlatform.statusLabel}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#9496a0]">
                        {activePlatform.osRequirement}
                      </p>
                    </div>
                  </div>
                </div>

                {activePlatform.available ? (
                  <>
                    {/* Windows package selector */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {(["installer", "portable"] as const).map((pkgKey) => (
                          <button
                            key={pkgKey}
                            type="button"
                            onClick={() => setWinPkg(pkgKey)}
                            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
                              winPkg === pkgKey
                                ? "bg-[#161920] border-white/[0.2] text-[#f0f0f4]"
                                : "bg-[#0d0e12]/70 border-white/[0.07] text-[#9496a0] hover:text-[#f0f0f4]"
                            }`}
                          >
                            <Package className="w-3.5 h-3.5" />
                            {WINDOWS_PACKAGES[pkgKey].label}
                          </button>
                        ))}
                      </div>

                      <div className="rounded-xl border border-white/[0.08] bg-[#0d0e12]/90 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-mono text-[#e5e7eb] truncate">
                          {activePkg.filename}
                        </span>
                        <span className="text-[#9496a0]">
                          {activePkg.format} · {activePkg.size}
                        </span>
                      </div>
                    </div>

                    {/* Primary Download CTA + Release link */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <DownloadButton
                          label="Download for Windows"
                          onDownloadTriggered={() => setDownloadedPrompt(true)}
                        />

                        <a
                          href={SITE_CONFIG.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.07] text-sm font-medium text-[#f0f0f4] transition-colors"
                        >
                          <Star className="w-4 h-4 text-amber-300" />
                          <span>Star on GitHub</span>
                          {release.stars !== null && (
                            <span className="text-xs text-[#9496a0]">
                              {release.stars}
                            </span>
                          )}
                        </a>

                        <Link
                          href="/guides/connect-chatgpt/"
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.07] text-sm font-medium text-[#f0f0f4] transition-colors"
                        >
                          <BookOpen className="w-4 h-4 text-[#9496a0]" />
                          Setup Guide
                        </Link>
                      </div>

                      <AnimatePresence>
                        {downloadedPrompt && (
                          <motion.div
                            initial={prefersReduced ? false : { opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="rounded-xl border border-amber-400/20 bg-amber-500/[0.06] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#d1d5db]"
                          >
                            <span>
                              Checking complete. If MCP Code helps your workflow,
                              star the repo on GitHub.
                            </span>
                            <a
                              href={SITE_CONFIG.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-amber-300 hover:text-amber-200"
                            >
                              <Star className="w-3.5 h-3.5" />
                              Star Axz-o/MCPCode
                            </a>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Expandable PowerShell / Releases snippet */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowVerify((v) => !v)}
                          className="inline-flex items-center gap-1.5 text-xs text-[#9496a0] hover:text-[#f0f0f4] transition-colors"
                        >
                          <span>PowerShell download command</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-150 ${
                              showVerify ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        <AnimatePresence initial={false}>
                          {showVerify && (
                            <motion.div
                              initial={
                                prefersReduced
                                  ? { opacity: 1 }
                                  : { opacity: 0, height: 0 }
                              }
                              animate={{ opacity: 1, height: "auto" }}
                              exit={
                                prefersReduced
                                  ? { opacity: 0 }
                                  : { opacity: 0, height: 0 }
                              }
                              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2.5 rounded-xl border border-white/[0.08] bg-[#0d0e12] px-3.5 py-2.5 flex items-center justify-between gap-3">
                                <code className="font-mono text-[11px] text-[#d1d5db] truncate">
                                  {activePkg.command}
                                </code>
                                <button
                                  type="button"
                                  onClick={handleCopyCommand}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-[11px] text-[#f0f0f4] shrink-0 transition-colors"
                                >
                                  {copied ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      Copy
                                    </>
                                  )}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-5">
                    <div className="rounded-xl border border-white/[0.08] bg-[#0d0e12]/80 p-4 text-sm text-[#9496a0] leading-relaxed">
                      {activePlatform.roadmapNote}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/[0.1] bg-white/[0.03] text-sm font-medium text-[#666870] cursor-not-allowed"
                      >
                        Not available yet
                      </button>
                      <a
                        href={SITE_CONFIG.releasesUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.07] text-sm font-medium text-[#f0f0f4] transition-colors"
                      >
                        <Bell className="w-4 h-4 text-[#9496a0]" />
                        Follow GitHub Releases
                        <ExternalLink className="w-3.5 h-3.5 text-[#9496a0]" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Right side: Included capabilities & quick links */}
              <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 bg-[#0f1116] flex flex-col justify-between gap-6">
                <div>
                  <div className="text-xs font-medium text-[#7d808c] mb-2">
                    Included in {activePlatform.name} build
                  </div>
                  <h4 className="text-base font-semibold text-[#f0f0f4] mb-4">
                    {activePlatform.tagline}
                  </h4>
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
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-[#161920] p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#f0f0f4]">
                      First time setting up?
                    </span>
                    <span className="text-[#7d808c]">6 min guide</span>
                  </div>
                  <p className="text-xs text-[#9496a0] leading-relaxed">
                    Start Local MCP on port 8765, open Secure Tunnel, and pair Mico
                    with ChatGPT Web.
                  </p>
                  <Link
                    href="/guides/connect-chatgpt/"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#f0f0f4] hover:text-white pt-1"
                  >
                    Connect MCP Code to ChatGPT
                    <ArrowRight className="w-3.5 h-3.5 text-[#9496a0]" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* 3-Column Platform Matrix (Windows / macOS / Linux) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-6">
          {PLATFORMS.map((platform) => {
            const Icon = platform.Icon;
            const isSelected = selectedPlatform === platform.id;
            return (
              <button
                key={platform.id}
                type="button"
                onClick={() => setSelectedPlatform(platform.id)}
                className={`text-left rounded-2xl border p-5 sm:p-6 transition-all flex flex-col justify-between gap-5 ${
                  isSelected
                    ? "border-white/[0.22] bg-[#161920] shadow-[0_14px_40px_rgba(0,0,0,0.45)]"
                    : platform.available
                      ? "border-white/[0.1] bg-[#111318] hover:border-white/[0.18]"
                      : "border-white/[0.07] bg-[#111318]/75 opacity-80 hover:opacity-100"
                }`}
              >
                <div className="flex items-start justify-between gap-3 w-full">
                  <div
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center ${platform.iconBg}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                      platform.available
                        ? "bg-emerald-500/15 border-emerald-400/25 text-emerald-300"
                        : "bg-white/[0.04] border-white/[0.08] text-[#7d808c]"
                    }`}
                  >
                    {platform.statusLabel}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-base font-semibold text-[#f0f0f4]">
                      {platform.name}
                    </h3>
                    <span className="text-xs text-[#7d808c]">{platform.arch}</span>
                  </div>
                  <p className="text-xs text-[#9496a0]">{platform.osRequirement}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quiet bottom link row */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-6 text-xs text-[#9496a0]">
          <Link
            href="/news/mcp-code-v0-1-0-beta/"
            className="inline-flex items-center gap-1.5 hover:text-[#f0f0f4] transition-colors"
          >
            <HardDrive className="w-3.5 h-3.5" />
            Release Notes (v{SITE_CONFIG.version})
          </Link>
          <a
            href={SITE_CONFIG.releasesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-[#f0f0f4] transition-colors"
          >
            All GitHub Releases
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
