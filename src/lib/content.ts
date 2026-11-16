import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { withBasePath } from "./site";

const CONTENT_ROOT = path.join(process.cwd(), "content");

export interface GuideMeta {
  slug: string;
  title: string;
  description: string;
  order: number;
  updatedAt: string;
  readingTime: string;
  badge?: string;
}

export interface GuideDoc extends GuideMeta {
  html: string;
}

export interface NewsMeta {
  slug: string;
  title: string;
  summary: string;
  date: string;
  version?: string;
  tag?: string;
}

export interface NewsDoc extends NewsMeta {
  html: string;
}

function renderMarkdown(source: string): string {
  const html = marked.parse(source, { gfm: true, breaks: false }) as string;
  // Ensure root-relative markdown images and internal links work when deployed under a GitHub Pages basePath
  return html
    .replace(/src="(\/[^"]+)"/g, (_, p1: string) => `src="${withBasePath(p1)}"`)
    .replace(/href="(\/(?!\/)[^"]*)"/g, (_, p1: string) => `href="${withBasePath(p1)}"`);
}

function readCollectionFiles(folder: "guides" | "news"): string[] {
  const dir = path.join(CONTENT_ROOT, folder);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => path.join(dir, file));
}

export function getAllGuides(): GuideMeta[] {
  return readCollectionFiles("guides")
    .map((filePath) => {
      const raw = fs.readFileSync(filePath, "utf8");
      const { data } = matter(raw);
      const slug = path.basename(filePath, ".md");
      return {
        slug,
        title: String(data.title ?? slug),
        description: String(data.description ?? ""),
        order: Number(data.order ?? 99),
        updatedAt: String(data.updatedAt ?? ""),
        readingTime: String(data.readingTime ?? "5 min"),
        badge: data.badge ? String(data.badge) : undefined,
      };
    })
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function getGuideBySlug(slug: string): GuideDoc | null {
  const filePath = path.join(CONTENT_ROOT, "guides", `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    order: Number(data.order ?? 99),
    updatedAt: String(data.updatedAt ?? ""),
    readingTime: String(data.readingTime ?? "5 min"),
    badge: data.badge ? String(data.badge) : undefined,
    html: renderMarkdown(content),
  };
}

export function getAllNews(): NewsMeta[] {
  return readCollectionFiles("news")
    .map((filePath) => {
      const raw = fs.readFileSync(filePath, "utf8");
      const { data } = matter(raw);
      const slug = path.basename(filePath, ".md");
      return {
        slug,
        title: String(data.title ?? slug),
        summary: String(data.summary ?? ""),
        date: String(data.date ?? "2026-01-01"),
        version: data.version ? String(data.version) : undefined,
        tag: data.tag ? String(data.tag) : undefined,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getNewsBySlug(slug: string): NewsDoc | null {
  const filePath = path.join(CONTENT_ROOT, "news", `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: String(data.title ?? slug),
    summary: String(data.summary ?? ""),
    date: String(data.date ?? "2026-01-01"),
    version: data.version ? String(data.version) : undefined,
    tag: data.tag ? String(data.tag) : undefined,
    html: renderMarkdown(content),
  };
}
