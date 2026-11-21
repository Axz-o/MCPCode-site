export const SITE_CONFIG = {
  name: "MCP Code",
  version: "0.1.0",
  stage: "alpha",
  releaseTag: "v0.1.0-alpha",
  tagline: "Local-first AI workspace with approval-gated edits.",
  description:
    "Connect ChatGPT and MCP clients to your local projects. Review every proposed file change in Approvals before it touches disk.",
  repoUrl: "https://github.com/Axz-o/MCPCode",
  releasesUrl: "https://github.com/Axz-o/MCPCode/releases",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://axz-o.github.io/MCPCode-site",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  guidesAppUrl: "https://axz-o.github.io/MCPCode-site/guides/",
} as const;

export function withBasePath(path: string): string {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_CONFIG.basePath}${normalized}`;
}

export function absoluteUrl(path: string): string {
  const base = SITE_CONFIG.siteUrl.replace(/\/+$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
