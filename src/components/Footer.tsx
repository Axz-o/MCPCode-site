import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { SITE_CONFIG, withBasePath } from "@/lib/site";
import { DownloadButton } from "./DownloadButton";

const footerGroups = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "/" },
      { label: "Workflow", href: "/#workflow" },
      { label: "Download", href: "/#download" },
      { label: "News & releases", href: "/news/" },
    ],
  },
  {
    title: "Guides",
    links: [
      { label: "All guides", href: "/guides/" },
      { label: "Connect to ChatGPT", href: "/guides/connect-chatgpt/" },
      {
        label: "Secure Tunnel setup",
        href: "/guides/connect-chatgpt/#step-2-configure-and-start-secure-tunnel",
      },
      {
        label: "Troubleshooting",
        href: "/guides/connect-chatgpt/#troubleshooting",
      },
    ],
  },
  {
    title: "Workspace",
    links: [
      { label: "Local MCP", href: "/guides/connect-chatgpt/#step-1-install-and-start-local-mcp" },
      { label: "Approvals", href: "/#workflow" },
      { label: "Project permissions", href: "/#workflow" },
      { label: "Mico pairing", href: "/guides/connect-chatgpt/" },
    ],
  },
] as const;

const repositoryLinks = [
  { label: "Source repository", href: SITE_CONFIG.repoUrl },
  { label: "Windows releases", href: SITE_CONFIG.releasesUrl },
  { label: "Report an issue", href: `${SITE_CONFIG.repoUrl}/issues` },
] as const;

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/[0.07] bg-[#08090b]">
      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-7 pt-8 md:px-8 md:pb-9 md:pt-10">
        <div className="flex flex-col gap-6 border-b border-white/[0.07] pb-8 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="group inline-flex w-fit items-center gap-3">
            <Image
              src={withBasePath("/app-icon.png")}
              alt=""
              width={34}
              height={34}
              className="h-[34px] w-[34px] rounded-[10px] object-cover shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-transform duration-200 group-hover:scale-[1.04]"
            />
            <span>
              <span className="block text-sm font-semibold tracking-[-0.015em] text-[#f0f0f4]">
                {SITE_CONFIG.name}
              </span>
              <span className="mt-0.5 block text-[11px] text-[#6f727c]">
                Local workspace for AI coding
              </span>
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/guides/connect-chatgpt/"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.025] px-4 py-2 text-xs font-medium text-[#c5c7ce] transition-colors hover:border-white/[0.18] hover:bg-white/[0.06] hover:text-white"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Setup guide
            </Link>
            <DownloadButton label="Download v0.1 Alpha" compact />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-12 sm:grid-cols-3 md:grid-cols-5 md:gap-x-8 md:py-16">
          {footerGroups.map((group) => (
            <FooterGroup key={group.title} title={group.title} links={group.links} />
          ))}

          <div>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#5f626c]">
              Repository
            </p>
            <ul className="space-y-2.5">
              {repositoryLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1 text-xs leading-5 text-[#9a9ca5] transition-colors hover:text-[#f0f0f4]"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#5f626c]">
              Built around
            </p>
            <p className="max-w-[190px] text-xs leading-5 text-[#9a9ca5]">
              Local projects, explicit permissions and approval-gated file writes.
            </p>
          </div>
        </div>

        <div className="relative flex min-h-[190px] items-end justify-center overflow-hidden border-t border-white/[0.055] pt-10 sm:min-h-[250px] md:min-h-[310px]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-[-0.17em] select-none whitespace-nowrap text-center text-[clamp(4.25rem,15.5vw,11.5rem)] font-semibold leading-none tracking-[-0.075em] text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(255,255,255,0.085) 0%, rgba(255,255,255,0.018) 82%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
            }}
          >
            MCP Code
          </div>

          <div className="relative z-10 mb-2 flex w-full flex-col items-center justify-between gap-2 text-[10px] text-[#555861] sm:flex-row">
            <span>© {new Date().getFullYear()} AX Labs</span>
            <span className="hidden sm:inline">MCP Code · v0.1.0 Alpha</span>
            <span className="hidden sm:inline">Local MCP · Secure Tunnel · Approvals</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#5f626c]">
        {title}
      </p>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-xs leading-5 text-[#9a9ca5] transition-colors hover:text-[#f0f0f4]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
