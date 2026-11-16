import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getAllGuides, getGuideBySlug } from "@/lib/content";
import { absoluteUrl } from "@/lib/site";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllGuides().map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return { title: "Guide not found" };

  return {
    title: guide.title,
    description: guide.description,
    alternates: {
      canonical: absoluteUrl(`/guides/${guide.slug}/`),
    },
    openGraph: {
      title: `${guide.title} — MCP Code`,
      description: guide.description,
      url: absoluteUrl(`/guides/${guide.slug}/`),
      type: "article",
    },
  };
}

export default async function GuideDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  return (
    <div className="min-h-screen bg-[#0d0e12] text-[#f0f0f4] flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-20">
        <article className="max-w-3xl mx-auto px-5 md:px-8">
          <Link
            href="/guides/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9496a0] hover:text-[#f0f0f4] mb-6 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All guides
          </Link>

          <header className="mb-8 pb-6 border-b border-white/[0.08]">
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#7d808c] mb-3">
              {guide.badge && (
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.09] text-[#d1d5db] font-medium">
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

            <h1 className="text-3xl sm:text-4xl font-bold text-[#f0f0f4] tracking-tight mb-3">
              {guide.title}
            </h1>
            <p className="text-base text-[#9496a0] leading-relaxed">
              {guide.description}
            </p>
          </header>

          <div
            className="aurora-prose"
            dangerouslySetInnerHTML={{ __html: guide.html }}
          />
        </article>
      </main>
      <Footer />
    </div>
  );
}
