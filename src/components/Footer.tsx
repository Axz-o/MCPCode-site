import Link from "next/link";
import { Download, BookOpen } from "lucide-react";
import { SITE_CONFIG, withBasePath } from "@/lib/site";
import { MicoMascot } from "./MicoMascot";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.07] bg-[#0d0e12]">
      {/* Pre-footer CTA banner */}
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-14 md:py-16 border-b border-white/[0.07] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0 mt-0.5">
            <MicoMascot size={42} state="default" label="Mico" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#f0f0f4] tracking-[-0.02em] mb-1.5">
              Start working with Mico locally
            </h2>
            <p className="text-sm text-[#9496a0] max-w-md">
              Download MCP Code v{SITE_CONFIG.version} {SITE_CONFIG.stage} for Windows 11
              and connect ChatGPT in a few minutes.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={SITE_CONFIG.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#f0f0f4] text-[#0d0e12] text-sm font-semibold hover:bg-white transition-colors"
          >
            <Download className="w-4 h-4" />
            Download for Windows
          </a>
          <Link
            href="/guides/connect-chatgpt/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.07] text-[#f0f0f4] text-sm font-medium transition-colors"
          >
            <BookOpen className="w-4 h-4 text-[#9496a0]" />
            Setup Guide
          </Link>
        </div>
      </div>

      {/* Directory */}
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-xs">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <img
              src={withBasePath("/app-icon.png")}
              alt="MCP Code"
              width={24}
              height={24}
              className="w-6 h-6 rounded-md object-cover"
            />
            <span className="text-sm font-semibold text-[#f0f0f4]">
              {SITE_CONFIG.name}
            </span>
          </div>
          <p className="text-[#7d808c] leading-relaxed">
            Local-first AI coding workspace with approval-gated file edits for Windows 11.
          </p>
        </div>

        <div>
          <div className="font-semibold text-[#f0f0f4] mb-3">Product</div>
          <ul className="space-y-2 text-[#9496a0]">
            <li>
              <Link href="/" className="hover:text-[#f0f0f4] transition-colors">
                Overview
              </Link>
            </li>
            <li>
              <Link href="/#workflow" className="hover:text-[#f0f0f4] transition-colors">
                Workflow
              </Link>
            </li>
            <li>
              <Link href="/news/" className="hover:text-[#f0f0f4] transition-colors">
                News & Releases
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="font-semibold text-[#f0f0f4] mb-3">Guides</div>
          <ul className="space-y-2 text-[#9496a0]">
            <li>
              <Link href="/guides/" className="hover:text-[#f0f0f4] transition-colors">
                All Guides
              </Link>
            </li>
            <li>
              <Link
                href="/guides/connect-chatgpt/"
                className="hover:text-[#f0f0f4] transition-colors"
              >
                Connect MCP Code to ChatGPT
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="font-semibold text-[#f0f0f4] mb-3">Repository</div>
          <ul className="space-y-2 text-[#9496a0]">
            <li>
              <a
                href={SITE_CONFIG.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#f0f0f4] transition-colors"
              >
                GitHub (Axz-o/MCPCode)
              </a>
            </li>
            <li>
              <a
                href={SITE_CONFIG.releasesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#f0f0f4] transition-colors"
              >
                Windows Releases
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#7d808c]">
          <span>
            {SITE_CONFIG.name} v{SITE_CONFIG.version} {SITE_CONFIG.stage}
          </span>
          <span>Local MCP · Secure Tunnel · Approvals</span>
        </div>
      </div>
    </footer>
  );
}
