import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface GitHubAsset {
  name: string;
  download_count: number;
}

interface GitHubRelease {
  tag_name: string;
  draft: boolean;
  assets: GitHubAsset[];
}

Deno.serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cronSecret = Deno.env.get("COLLECTOR_CRON_SECRET");
  if (cronSecret) {
    const authHeader = req.headers.get("authorization") ?? "";
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase env" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ghHeaders: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "MCPCode-Site-Stats-Collector",
  };
  const ghToken = Deno.env.get("GITHUB_TOKEN");
  if (ghToken) ghHeaders.Authorization = `Bearer ${ghToken}`;

  const ghRes = await fetch(
    "https://api.github.com/repos/Axz-o/MCPCode/releases?per_page=30",
    { headers: ghHeaders }
  );
  if (!ghRes.ok) {
    return new Response(
      JSON.stringify({ error: `GitHub API error: ${ghRes.status}` }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  const releases = (await ghRes.json()) as GitHubRelease[];
  const snapshotDate = new Date().toISOString().slice(0, 10);
  const fetchedAt = new Date().toISOString();

  const rows: {
    snapshot_date: string;
    release_tag: string;
    asset_name: string;
    asset_ext: ".exe" | ".msi";
    download_count: number;
    fetched_at: string;
  }[] = [];

  for (const rel of releases) {
    if (!rel || rel.draft || !Array.isArray(rel.assets)) continue;
    for (const asset of rel.assets) {
      const lower = asset.name.toLowerCase();
      const ext = lower.endsWith(".exe")
        ? ".exe"
        : lower.endsWith(".msi")
          ? ".msi"
          : null;
      if (!ext) continue;
      rows.push({
        snapshot_date: snapshotDate,
        release_tag: rel.tag_name,
        asset_name: asset.name,
        asset_ext: ext,
        download_count: Number(asset.download_count ?? 0),
        fetched_at: fetchedAt,
      });
    }
  }

  if (rows.length > 0) {
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase
      .from("release_snapshots")
      .upsert(rows, { onConflict: "snapshot_date,release_tag,asset_name" });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response(
    JSON.stringify({ ok: true, snapshot_date: snapshotDate, rows: rows.length }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
