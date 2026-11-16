"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Menu,
  X,
  ArrowUpRight,
  Download,
  ChevronDown,
  ArrowRight,
  BookOpen,
  Newspaper,
  Terminal,
  ShieldCheck,
} from "lucide-react";
import { SITE_CONFIG, withBasePath } from "@/lib/site";
import type { GuideMeta, NewsMeta } from "@/lib/content";

interface NavbarClientProps {
  guides: GuideMeta[];
  news: NewsMeta[];
}

type DropdownKind = "guides" | "news" | null;

export function NavbarClient({ guides, news }: NavbarClientProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<DropdownKind>(null);
  const pathname = usePathname();
  const prefersReduced = useReducedMotion();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openDropdown = (kind: DropdownKind) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(kind);
  };

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 130);
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname === "";
    return pathname?.startsWith(href);
  };

  const latestGuide = guides[0];
  const latestNews = news[0];

  return (
    <motion.header
      initial={prefersReduced ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-200 ${
        scrolled || mobileOpen
          ? "bg-[#0d0e12]/90 backdrop-blur-xl border-b border-white/[0.08]"
          : "bg-[#0d0e12]/55 backdrop-blur-md border-b border-transparent"
      }`}
    >
      <div
        ref={navRef}
        className="relative max-w-6xl mx-auto px-5 md:px-8 h-14 flex items-center justify-between gap-4"
        onMouseLeave={scheduleClose}
      >
        {/* Brand: real Aurora squircle app icon */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <img
            src={withBasePath("/app-icon.png")}
            alt="MCP Code"
            width={28}
            height={28}
            className="w-7 h-7 rounded-lg object-cover shadow-[0_2px_10px_rgba(0,0,0,0.45)] group-hover:scale-105 transition-transform duration-150"
          />
          <span className="text-sm font-semibold text-[#f0f0f4] tracking-tight">
            {SITE_CONFIG.name}
          </span>
          <span className="hidden sm:inline-flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.1] text-[#9496a0] leading-none">
            v{SITE_CONFIG.version}
          </span>
        </Link>

        {/* Desktop pill navigation */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-0.5 bg-white/[0.03] border border-white/[0.08] rounded-full px-1.5 py-1"
        >
          <Link
            href="/"
            onMouseEnter={() => setOpenMenu(null)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isActive("/")
                ? "bg-white/[0.1] text-[#f0f0f4]"
                : "text-[#9496a0] hover:text-[#f0f0f4] hover:bg-white/[0.06]"
            }`}
          >
            Overview
          </Link>

          <button
            type="button"
            onMouseEnter={() => openDropdown("guides")}
            onClick={() => setOpenMenu(openMenu === "guides" ? null : "guides")}
            aria-expanded={openMenu === "guides"}
            className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              openMenu === "guides" || isActive("/guides/")
                ? "bg-white/[0.1] text-[#f0f0f4]"
                : "text-[#9496a0] hover:text-[#f0f0f4] hover:bg-white/[0.06]"
            }`}
          >
            Guides
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-150 ${
                openMenu === "guides" ? "rotate-180" : ""
              }`}
            />
          </button>

          <button
            type="button"
            onMouseEnter={() => openDropdown("news")}
            onClick={() => setOpenMenu(openMenu === "news" ? null : "news")}
            aria-expanded={openMenu === "news"}
            className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              openMenu === "news" || isActive("/news/")
                ? "bg-white/[0.1] text-[#f0f0f4]"
                : "text-[#9496a0] hover:text-[#f0f0f4] hover:bg-white/[0.06]"
            }`}
          >
            News
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-150 ${
                openMenu === "news" ? "rotate-180" : ""
              }`}
            />
          </button>

          <Link
            href="/#download"
            onMouseEnter={() => setOpenMenu(null)}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium text-[#9496a0] hover:text-[#f0f0f4] hover:bg-white/[0.06] transition-colors"
          >
            Download
          </Link>

          <a
            href={SITE_CONFIG.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setOpenMenu(null)}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-medium text-[#9496a0] hover:text-[#f0f0f4] hover:bg-white/[0.06] transition-colors"
          >
            GitHub
            <ArrowUpRight className="w-3 h-3 opacity-60" />
          </a>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <a
            href={SITE_CONFIG.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#f0f0f4] text-[#0d0e12] text-xs font-semibold hover:bg-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </a>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="md:hidden p-2 text-[#9496a0] hover:text-[#f0f0f4] rounded-lg bg-white/[0.04] border border-white/[0.08]"
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={16} /> : <Menu size={16} />}
        </button>

        {/* Aurora-native mega dropdown */}
        <AnimatePresence>
          {openMenu && (
            <motion.div
              key={openMenu}
              onMouseEnter={() => openDropdown(openMenu)}
              onMouseLeave={scheduleClose}
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.985 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="hidden md:block absolute left-1/2 -translate-x-1/2 top-[calc(100%+8px)] w-[640px] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/[0.12] bg-[#13151b] shadow-[0_28px_80px_rgba(0,0,0,0.88),0_0_0_1px_rgba(255,255,255,0.03)] overflow-hidden"
            >
              {openMenu === "guides" && (
                <div>
                  <div className="px-4 py-2.5 bg-[#0f1116] border-b border-white/[0.07] flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-2 text-[#9496a0]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Setup & Troubleshooting Guides
                    </span>
                    <Link
                      href="/guides/"
                      onClick={() => setOpenMenu(null)}
                      className="inline-flex items-center gap-1 font-medium text-[#f0f0f4] hover:text-white transition-colors"
                    >
                      All guides
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="p-3.5 grid grid-cols-12 gap-3.5">
                    {latestGuide && (
                      <Link
                        href={`/guides/${latestGuide.slug}/`}
                        onClick={() => setOpenMenu(null)}
                        className="col-span-5 rounded-xl border border-white/[0.09] bg-[#0d0e12] overflow-hidden flex flex-col justify-between group hover:border-white/[0.18] transition-colors"
                      >
                        <div className="relative h-28 overflow-hidden border-b border-white/[0.07]">
                          <img
                            src={withBasePath("/screenshots/settings-tunnel.png")}
                            alt="Settings Connections and Secure Tunnel in MCP Code"
                            className="w-full h-full object-cover object-top opacity-90 group-hover:scale-[1.03] transition-transform duration-300"
                          />
                          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#0d0e12]/90 border border-white/[0.12] text-[10px] font-medium text-emerald-300">
                            Featured guide
                          </span>
                        </div>
                        <div className="p-3">
                          <div className="text-xs font-semibold text-[#f0f0f4] leading-snug mb-1 group-hover:text-white">
                            {latestGuide.title}
                          </div>
                          <div className="text-[11px] text-[#7d808c]">
                            {latestGuide.readingTime} · Updated {latestGuide.updatedAt}
                          </div>
                        </div>
                      </Link>
                    )}

                    <div className="col-span-7 flex flex-col justify-between gap-1">
                      {[
                        {
                          title: "1. Start Local MCP (:8765)",
                          desc: "Enable the local workspace server in Settings → Connections.",
                          href: "/guides/connect-chatgpt/#step-1-install-and-start-local-mcp",
                          Icon: BookOpen,
                        },
                        {
                          title: "2. Open Secure Tunnel & Add Connector",
                          desc: "Validate tunnel-client.exe and paste /mcp into ChatGPT Web.",
                          href: "/guides/connect-chatgpt/#step-2-configure-and-start-secure-tunnel",
                          Icon: Terminal,
                        },
                        {
                          title: "3. Pair Mico & Troubleshoot",
                          desc: "Connect ChatGPT widget, pairing codes, and common fixes.",
                          href: "/guides/connect-chatgpt/#troubleshooting",
                          Icon: ShieldCheck,
                        },
                      ].map((row) => {
                        const RowIcon = row.Icon;
                        return (
                          <Link
                            key={row.title}
                            href={row.href}
                            onClick={() => setOpenMenu(null)}
                            className="flex items-start gap-3 p-2.5 rounded-xl border border-transparent hover:border-white/[0.08] hover:bg-[#191c24] transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border border-white/[0.09] bg-[#1a1d26] text-[#d1d5db]">
                              <RowIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-[#f0f0f4] leading-snug mb-0.5">
                                {row.title}
                              </div>
                              <div className="text-[11px] text-[#8b8e98] line-clamp-1">
                                {row.desc}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {openMenu === "news" && (
                <div>
                  <div className="px-4 py-2.5 bg-[#0f1116] border-b border-white/[0.07] flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-2 text-[#9496a0]">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                      Release Notes & Announcements
                    </span>
                    <Link
                      href="/news/"
                      onClick={() => setOpenMenu(null)}
                      className="inline-flex items-center gap-1 font-medium text-[#f0f0f4] hover:text-white transition-colors"
                    >
                      All news
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="p-3.5 grid grid-cols-12 gap-3.5">
                    {latestNews && (
                      <Link
                        href={`/news/${latestNews.slug}/`}
                        onClick={() => setOpenMenu(null)}
                        className="col-span-5 rounded-xl border border-white/[0.09] bg-[#0d0e12] overflow-hidden flex flex-col justify-between group hover:border-white/[0.18] transition-colors"
                      >
                        <div className="relative h-28 overflow-hidden border-b border-white/[0.07]">
                          <img
                            src={withBasePath("/screenshots/mico-chat.png")}
                            alt="MCP Code v0.1.0 Beta"
                            className="w-full h-full object-cover object-top opacity-90 group-hover:scale-[1.03] transition-transform duration-300"
                          />
                          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#0d0e12]/90 border border-white/[0.12] text-[10px] font-medium text-sky-300">
                            v{SITE_CONFIG.version} {SITE_CONFIG.stage}
                          </span>
                        </div>
                        <div className="p-3">
                          <div className="text-xs font-semibold text-[#f0f0f4] leading-snug mb-1 group-hover:text-white">
                            {latestNews.title}
                          </div>
                          <div className="text-[11px] text-[#7d808c]">
                            {latestNews.date}
                          </div>
                        </div>
                      </Link>
                    )}

                    <div className="col-span-7 flex flex-col justify-between gap-1">
                      {news.map((post) => (
                        <Link
                          key={post.slug}
                          href={`/news/${post.slug}/`}
                          onClick={() => setOpenMenu(null)}
                          className="flex items-start gap-3 p-2.5 rounded-xl border border-transparent hover:border-white/[0.08] hover:bg-[#191c24] transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border border-white/[0.09] bg-[#1a1d26] text-[#d1d5db]">
                            <Newspaper className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-[#f0f0f4] leading-snug mb-0.5">
                              {post.title}
                            </div>
                            <div className="text-[11px] text-[#8b8e98]">
                              {post.date}
                            </div>
                          </div>
                        </Link>
                      ))}

                      <a
                        href={SITE_CONFIG.releasesUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setOpenMenu(null)}
                        className="flex items-start gap-3 p-2.5 rounded-xl border border-transparent hover:border-white/[0.08] hover:bg-[#191c24] transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border border-white/[0.09] bg-[#1a1d26] text-[#d1d5db]">
                          <Download className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#f0f0f4] leading-snug mb-0.5">
                            GitHub Releases
                          </div>
                          <div className="text-[11px] text-[#8b8e98]">
                            Windows installers and release history
                          </div>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden border-t border-white/[0.08] bg-[#0d0e12] px-5 py-4 space-y-2"
          >
            {[
              { label: "Overview", href: "/" },
              { label: "Guides", href: "/guides/" },
              { label: "News", href: "/news/" },
              { label: "Download", href: "/#download" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive(item.href)
                    ? "bg-white/[0.08] text-[#f0f0f4]"
                    : "text-[#9496a0] hover:text-[#f0f0f4] hover:bg-white/[0.05]"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <a
              href={SITE_CONFIG.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full bg-[#f0f0f4] text-[#0d0e12] text-sm font-semibold"
            >
              <Download className="w-4 h-4" />
              Download for Windows
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
