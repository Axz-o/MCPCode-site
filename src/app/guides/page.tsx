import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getAllGuides } from "@/lib/content";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Guides",
  description:
    "Step-by-step setup and troubleshooting guides for MCP Code, Local MCP, Secure Tunnel, and ChatGPT pairing.",
  alternates: {
    canonical: absoluteUrl("/guides/"),
  },
  openGraph: {
    title: "Guides — MCP Code",
    description:
      "Step-by-step setup and troubleshooting guides for MCP Code, Local MCP, Secure Tunnel, and ChatGPT pairing.",
    url: absoluteUrl("/guides/"),
    type: "website",
  },
};

export default function GuidesIndexPage() {
  const guides = getAllGuides();

  return (
    <div className="min-h-screen bg-[#0d0e12] text-[#f0f0f4] flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-5 md:px-8">
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#f0f0f4] tracking-tight mb-3">
              Guides
            </h1>
            <p className="text-sm sm:text-base text-[#9496a0] max-w-2xl leading-relaxed">
              Practical walkthroughs for setting up MCP Code, connecting external AI
              clients, and troubleshooting Local MCP or Secure Tunnel.
            </p>
          </div>

          <div className="space-y-4">
            {guides.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}/`}
                className="group block rounded-2xl border border-white/[0.08] bg-[#111318] hover:border-white/[0.16] hover:bg-[#161920] p-6 transition-colors"
              >
                <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-[#7d808c]">
                  {guide.badge && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.09] text-[#d1d5db] font-medium">
                      <BookOpen className="w-3 h-3" />
                      {guide.badge}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {guide.readingTime}
                  </span>
                  {guide.updatedAt && (
                    <span className="font-mono">Updated {guide.updatedAt}</span>
                  )}
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-[#f0f0f4] group-hover:text-white mb-2">
                      {guide.title}
                    </h2>
                    <p className="text-sm text-[#9496a0] leading-relaxed">
                      {guide.description}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#7d808c] group-hover:text-[#f0f0f4] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
