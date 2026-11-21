export interface ReleaseSnapshotRow {
  snapshot_date: string;
  release_tag: string;
  asset_name: string;
  asset_ext: ".exe" | ".msi";
  download_count: number;
  fetched_at: string;
}

export interface VersionStats {
  tag: string;
  total: number;
  exe: number;
  msi: number;
  assets: { name: string; ext: ".exe" | ".msi"; downloads: number }[];
}

export interface DailyStatPoint {
  date: string;
  total: number;
  exe: number;
  msi: number;
  delta: number | null;
}

export interface ReleaseStatsSummary {
  latestDate: string | null;
  lastFetchedAt: string | null;
  totalDownloads: number;
  exeDownloads: number;
  msiDownloads: number;
  byVersion: VersionStats[];
  dailySeries: DailyStatPoint[];
}

export function computeReleaseSummary(
  rows: ReleaseSnapshotRow[]
): ReleaseStatsSummary {
  if (!rows.length) {
    return {
      latestDate: null,
      lastFetchedAt: null,
      totalDownloads: 0,
      exeDownloads: 0,
      msiDownloads: 0,
      byVersion: [],
      dailySeries: [],
    };
  }

  const byDate = new Map<string, ReleaseSnapshotRow[]>();
  for (const row of rows) {
    const list = byDate.get(row.snapshot_date) ?? [];
    list.push(row);
    byDate.set(row.snapshot_date, list);
  }

  const sortedDates = [...byDate.keys()].sort((a, b) => a.localeCompare(b));
  const latestDate = sortedDates[sortedDates.length - 1] ?? null;

  const dailySeries: DailyStatPoint[] = sortedDates.map((date, idx) => {
    const dayRows = byDate.get(date) ?? [];
    let total = 0;
    let exe = 0;
    let msi = 0;
    for (const r of dayRows) {
      const count = Number(r.download_count || 0);
      total += count;
      if (r.asset_ext === ".exe") exe += count;
      else if (r.asset_ext === ".msi") msi += count;
    }
    const prevTotal =
      idx > 0
        ? (byDate.get(sortedDates[idx - 1]) ?? []).reduce(
            (sum, r) => sum + Number(r.download_count || 0),
            0
          )
        : null;
    return {
      date,
      total,
      exe,
      msi,
      delta: prevTotal === null ? null : total - prevTotal,
    };
  });

  const latestRows = latestDate ? (byDate.get(latestDate) ?? []) : [];
  let totalDownloads = 0;
  let exeDownloads = 0;
  let msiDownloads = 0;
  let lastFetchedAt: string | null = null;

  const versionMap = new Map<string, VersionStats>();

  for (const r of latestRows) {
    const count = Number(r.download_count || 0);
    totalDownloads += count;
    if (r.asset_ext === ".exe") exeDownloads += count;
    else if (r.asset_ext === ".msi") msiDownloads += count;

    if (!lastFetchedAt || r.fetched_at > lastFetchedAt) {
      lastFetchedAt = r.fetched_at;
    }

    const existing = versionMap.get(r.release_tag) ?? {
      tag: r.release_tag,
      total: 0,
      exe: 0,
      msi: 0,
      assets: [],
    };
    existing.total += count;
    if (r.asset_ext === ".exe") existing.exe += count;
    else if (r.asset_ext === ".msi") existing.msi += count;
    existing.assets.push({
      name: r.asset_name,
      ext: r.asset_ext,
      downloads: count,
    });
    versionMap.set(r.release_tag, existing);
  }

  const byVersion = [...versionMap.values()].sort((a, b) =>
    b.tag.localeCompare(a.tag)
  );

  return {
    latestDate,
    lastFetchedAt,
    totalDownloads,
    exeDownloads,
    msiDownloads,
    byVersion,
    dailySeries,
  };
}
