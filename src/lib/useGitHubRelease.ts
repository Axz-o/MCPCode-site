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
  releaseUrl: SITE_CONFIG.releasesUrl,
  tag: `v${SITE_CONFIG.version}`,
  filename: null,
  sizeBytes: null,
  stars: null,
  isDirectAsset: false,
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
