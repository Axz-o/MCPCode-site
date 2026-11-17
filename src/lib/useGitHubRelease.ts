"use client";

import { useEffect, useState } from "react";
import { SITE_CONFIG } from "./site";

interface GitHubAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

interface GitHubRelease {
  tag_name: string;
  html_url: string;
  prerelease: boolean;
  assets: GitHubAsset[];
}

export interface ReleaseInfo {
  downloadUrl: string;
  releaseUrl: string;
  tag: string;
  filename: string | null;
  sizeBytes: number | null;
  stars: number | null;
  isDirectAsset: boolean;
}

const CACHE_KEY = "mcpcode_gh_release_v1";

const DEFAULT_INFO: ReleaseInfo = {
  downloadUrl: SITE_CONFIG.downloadUrl,
  releaseUrl: "https://github.com/Axz-o/MCPCode/releases/tag/v0.1.0-alpha",
  tag: "v0.1.0-alpha",
  filename: "MCP.Code_0.1.0_x64-setup.exe",
  sizeBytes: 25421544,
  stars: null,
  isDirectAsset: true,
};

function pickWindowsAsset(assets: GitHubAsset[]): GitHubAsset | null {
  if (!Array.isArray(assets) || assets.length === 0) return null;
  return (
    assets.find((a) => /setup.*\.exe$/i.test(a.name)) ??
    assets.find((a) => /\.exe$/i.test(a.name)) ??
    assets.find((a) => /\.msi$/i.test(a.name)) ??
    null
  );
}

export function formatBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "~25 MB";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export async function resolveLatestStableDownload(): Promise<{
  url: string;
  tag: string;
  filename: string | null;
  isDirectAsset: boolean;
}> {
  try {
    // 1. Check latest stable release first
    const latestRes = await fetch(
      "https://api.github.com/repos/Axz-o/MCPCode/releases/latest",
      { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" }
    );
    if (latestRes.ok) {
      const rel = (await latestRes.json()) as GitHubRelease;
      const asset = pickWindowsAsset(rel.assets);
      if (asset) {
        return {
          url: asset.browser_download_url,
          tag: rel.tag_name || `v${SITE_CONFIG.version}`,
          filename: asset.name,
          isDirectAsset: true,
        };
      }
      return {
        url: rel.html_url || SITE_CONFIG.releasesUrl,
        tag: rel.tag_name || `v${SITE_CONFIG.version}`,
        filename: null,
        isDirectAsset: false,
      };
    }

    // 2. Fallback to newest release with a Windows installer asset
    const listRes = await fetch(
      "https://api.github.com/repos/Axz-o/MCPCode/releases?per_page=5",
      { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" }
    );
    if (listRes.ok) {
      const releases = (await listRes.json()) as GitHubRelease[];
      const match =
        releases.find((r) => !r.prerelease && pickWindowsAsset(r.assets)) ??
        releases.find((r) => pickWindowsAsset(r.assets)) ??
        releases[0];
      if (match) {
        const asset = pickWindowsAsset(match.assets);
        return {
          url: asset?.browser_download_url ?? match.html_url,
          tag: match.tag_name || `v${SITE_CONFIG.version}`,
          filename: asset?.name ?? null,
          isDirectAsset: Boolean(asset),
        };
      }
    }
  } catch {
    // Network / private repo fallback
  }

  return {
    url: SITE_CONFIG.releasesUrl,
    tag: `v${SITE_CONFIG.version}`,
    filename: null,
    isDirectAsset: false,
  };
}

export function triggerFileDownload(url: string, filename?: string | null) {
  const link = document.createElement("a");
  link.href = url;
  if (filename) link.download = filename;
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function useGitHubRelease(): ReleaseInfo {
  const [info, setInfo] = useState<ReleaseInfo>(DEFAULT_INFO);

  useEffect(() => {
    let cancelled = false;

    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as { ts: number; data: ReleaseInfo };
        if (Date.now() - parsed.ts < 5 * 60 * 1000 && parsed.data) {
          setInfo(parsed.data);
          return;
        }
      }
    } catch {
      // Ignore storage errors
    }

    async function load() {
      let stars: number | null = null;
      let next: ReleaseInfo = { ...DEFAULT_INFO };

      try {
        const [repoRes, relRes] = await Promise.all([
          fetch("https://api.github.com/repos/Axz-o/MCPCode", {
            headers: { Accept: "application/vnd.github+json" },
          }),
          fetch("https://api.github.com/repos/Axz-o/MCPCode/releases?per_page=5", {
            headers: { Accept: "application/vnd.github+json" },
          }),
        ]);

        if (repoRes.ok) {
          const repoJson = (await repoRes.json()) as { stargazers_count?: number };
          if (typeof repoJson.stargazers_count === "number") {
            stars = repoJson.stargazers_count;
          }
        }

        if (relRes.ok) {
          const releases = (await relRes.json()) as GitHubRelease[];
          const preferred =
            releases.find((r) => !r.prerelease && pickWindowsAsset(r.assets)) ??
            releases.find((r) => pickWindowsAsset(r.assets)) ??
            releases[0];

          if (preferred) {
            const asset = pickWindowsAsset(preferred.assets);
            next = {
              downloadUrl: asset?.browser_download_url ?? preferred.html_url,
              releaseUrl: preferred.html_url,
              tag: preferred.tag_name || DEFAULT_INFO.tag,
              filename: asset?.name ?? null,
              sizeBytes: asset?.size ?? null,
              stars,
              isDirectAsset: Boolean(asset),
            };
          } else {
            next.stars = stars;
          }
        } else {
          next.stars = stars;
        }
      } catch {
        // Keep fallback values
      }

      if (!cancelled) {
        setInfo(next);
        try {
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ ts: Date.now(), data: next })
          );
        } catch {
          // Ignore storage errors
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return info;
}
