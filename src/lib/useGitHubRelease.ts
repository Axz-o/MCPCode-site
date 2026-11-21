"use client";

import { useEffect, useState } from "react";
import { SITE_CONFIG } from "./site";

interface GitHubAsset { name: string; browser_download_url: string; size: number }
interface GitHubRelease { tag_name: string; html_url: string; draft: boolean; prerelease: boolean; assets: GitHubAsset[]; published_at: string | null }
export interface ReleaseInfo { downloadUrl: string; releaseUrl: string; tag: string | null; filename: string | null; sizeBytes: number | null; stars: number | null; isDirectAsset: boolean; accessRestricted: boolean; checked: boolean }

const API = "https://api.github.com/repos/Axz-o/MCPCode";
const CACHE_KEY = "mcpcode_gh_release_v3";
const FALLBACK: ReleaseInfo = { downloadUrl: SITE_CONFIG.releasesUrl, releaseUrl: SITE_CONFIG.releasesUrl, tag: null, filename: null, sizeBytes: null, stars: null, isDirectAsset: false, accessRestricted: false, checked: false };
let activeRequest: Promise<ReleaseInfo> | null = null;
let lastResult: { at: number; data: ReleaseInfo } | null = null;

function isRelease(value: unknown): value is GitHubRelease {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<GitHubRelease>;
  return typeof item.tag_name === "string" && typeof item.html_url === "string" && Array.isArray(item.assets) && !item.draft;
}

function installer(assets: GitHubAsset[]): GitHubAsset | null {
  const valid = assets.filter(asset => typeof asset.name === "string" && typeof asset.browser_download_url === "string" && asset.browser_download_url.startsWith("https://github.com/Axz-o/MCPCode/releases/download/"));
  return valid.find(asset => /(?:setup|installer)[^/]*\.exe$/i.test(asset.name)) ?? valid.find(asset => /\.msi$/i.test(asset.name)) ?? null;
}

function chooseRelease(value: unknown): GitHubRelease | null {
  if (!Array.isArray(value)) return null;
  const candidates = value.filter(isRelease).filter(release => installer(release.assets));
  candidates.sort((a, b) => (Date.parse(b.published_at ?? "") || 0) - (Date.parse(a.published_at ?? "") || 0));
  return candidates[0] ?? null;
}

export function formatBytes(bytes: number | null): string | null {
  return bytes && bytes > 0 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : null;
}

async function loadRelease(): Promise<ReleaseInfo> {
  if (lastResult && Date.now() - lastResult.at < 5 * 60_000) return lastResult.data;
  if (activeRequest) return activeRequest;
  activeRequest = (async () => {
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? "null") as { at: number; data: ReleaseInfo } | null;
      if (cached?.data?.isDirectAsset && Date.now() - cached.at < 5 * 60_000) {
        lastResult = cached;
        return cached.data;
      }
    } catch { /* Storage is optional. */ }

    let next: ReleaseInfo = { ...FALLBACK, checked: true };
    try {
      const [releaseResponse, repoResponse] = await Promise.all([
        fetch(`${API}/releases?per_page=30`, { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" }),
        fetch(API, { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" }),
      ]);
      const release = releaseResponse.ok ? chooseRelease(await releaseResponse.json()) : null;
      const asset = release ? installer(release.assets) : null;
      const repo = repoResponse.ok ? await repoResponse.json() as { stargazers_count?: number } : null;
      next = {
        downloadUrl: asset?.browser_download_url ?? SITE_CONFIG.releasesUrl,
        releaseUrl: release?.html_url ?? SITE_CONFIG.releasesUrl,
        tag: release?.tag_name ?? null,
        filename: asset?.name ?? null,
        sizeBytes: typeof asset?.size === "number" ? asset.size : null,
        stars: typeof repo?.stargazers_count === "number" ? repo.stargazers_count : null,
        isDirectAsset: Boolean(asset),
        accessRestricted: releaseResponse.status === 404 && repoResponse.status === 404,
        checked: true,
      };
      if (asset) try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data: next })); } catch { /* Storage is optional. */ }
    } catch { /* Keep the releases-page fallback. */ }
    lastResult = { at: Date.now(), data: next };
    return next;
  })();
  try {
    return await activeRequest;
  } finally {
    activeRequest = null;
  }
}

export function useGitHubRelease(): ReleaseInfo {
  const [info, setInfo] = useState<ReleaseInfo>(FALLBACK);
  useEffect(() => {
    let cancelled = false;
    void loadRelease().then(result => { if (!cancelled) setInfo(result); });
    return () => { cancelled = true; };
  }, []);
  return info;
}
