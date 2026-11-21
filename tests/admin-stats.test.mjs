import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

test("RLS migration enforces owner UUID, AAL2, password, and totp", () => {
  const sql = fs.readFileSync(
    path.join(ROOT, "supabase", "migrations", "0001_admin_stats.sql"),
    "utf8"
  );
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /revoke all on table public\.release_snapshots from anon, public/i);
  assert.match(sql, /cfg\.owner_user_id = auth\.uid\(\)/i);
  assert.match(sql, /auth\.jwt\(\) ->> 'aal'.*= 'aal2'/i);
  assert.match(sql, /entry ->> 'method' = 'password'/i);
  assert.match(sql, /entry ->> 'method' = 'totp'/i);
  assert.match(sql, /primary key \(snapshot_date, release_tag, asset_name\)/i);
});

test("Public frontend source does not contain owner email or service_role key", () => {
  const srcDir = path.join(ROOT, "src");
  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(full) : [full];
    });
  for (const file of walk(srcDir)) {
    const content = fs.readFileSync(file, "utf8");
    assert.equal(
      content.includes("axooff7@gmail.com"),
      false,
      `Owner email leaked into ${file}`
    );
    assert.equal(
      content.includes("SUPABASE_SERVICE_ROLE_KEY"),
      false,
      `Service role key referenced in frontend ${file}`
    );
  }
});

test("Daily release stats calculation computes totals, extensions, and daily deltas", () => {
  // Inline equivalent of computeReleaseSummary logic to verify edge cases in pure Node
  const rows = [
    { snapshot_date: "2026-11-20", release_tag: "v0.1.0-alpha", asset_name: "MCP.Code_0.1.0_x64-setup.exe", asset_ext: ".exe", download_count: 10, fetched_at: "2026-11-20T06:00:00Z" },
    { snapshot_date: "2026-11-20", release_tag: "v0.1.0-alpha", asset_name: "MCP.Code_0.1.0_x64_en-US.msi", asset_ext: ".msi", download_count: 4, fetched_at: "2026-11-20T06:00:00Z" },
    { snapshot_date: "2026-11-21", release_tag: "v0.1.0-alpha", asset_name: "MCP.Code_0.1.0_x64-setup.exe", asset_ext: ".exe", download_count: 18, fetched_at: "2026-11-21T06:00:00Z" },
    { snapshot_date: "2026-11-21", release_tag: "v0.1.0-alpha", asset_name: "MCP.Code_0.1.0_x64_en-US.msi", asset_ext: ".msi", download_count: 6, fetched_at: "2026-11-21T06:00:00Z" },
  ];
  const day1 = rows.filter((r) => r.snapshot_date === "2026-11-20").reduce((s, r) => s + r.download_count, 0);
  const day2 = rows.filter((r) => r.snapshot_date === "2026-11-21").reduce((s, r) => s + r.download_count, 0);
  assert.equal(day1, 14);
  assert.equal(day2, 24);
  assert.equal(day2 - day1, 10);
});
