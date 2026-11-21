"use client";

import dynamic from "next/dynamic";

const AuroraApp = dynamic(() => import("@/aurora-demo/aurora/AuroraApp"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#0d0e12] flex items-center justify-center text-xs text-[#7d808c]">
      Loading MCP Code workspace…
    </div>
  ),
});

export function AuroraHeroFrame() {
  return (
    <div className="aurora-hero-embed w-full h-full relative overflow-hidden">
      <AuroraApp />
    </div>
  );
}
