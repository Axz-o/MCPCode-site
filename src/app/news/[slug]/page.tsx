import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getAllNews, getNewsBySlug } from "@/lib/content";
import { absoluteUrl } from "@/lib/site";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllNews().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getNewsBySlug(slug);
  if (!post) return { title: "Post not found" };

  return {
    title: post.title,
    description: post.summary,
    alternates: {
      canonical: absoluteUrl(`/news/${post.slug}/`),
    },
    openGraph: {
      title: `${post.title} — MCP Code`,
      description: post.summary,
      url: absoluteUrl(`/news/${post.slug}/`),
      type: "article",
    },
  };
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getNewsBySlug(slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-[#0d0e12] text-[#f0f0f4] flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-20">
        <article className="max-w-3xl mx-auto px-5 md:px-8">
          <Link
            href="/news/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9496a0] hover:text-[#f0f0f4] mb-6 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All news
          </Link>

          <header className="mb-8 pb-6 border-b border-white/[0.08]">
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#7d808c] mb-3">
              <span className="inline-flex items-center gap-1.5 font-mono">
                <Calendar className="w-3 h-3" />
                {post.date}
              </span>
              {post.version && (
                <span className="font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-400/20">
                  v{post.version}
                </span>
              )}
              {post.tag && (
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.09] text-[#d1d5db] font-medium">
                  {post.tag}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-[#f0f0f4] tracking-tight mb-3">
              {post.title}
            </h1>
            <p className="text-base text-[#9496a0] leading-relaxed">{post.summary}</p>
          </header>

          <div
            className="aurora-prose"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
        </article>
      </main>
      <Footer />
    </div>
  );
}
