/**
 * Seed script: fetches Chicago civic data from Socrata API and populates Supabase.
 *
 * Usage: npx tsx src/scripts/seed.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (bypasses RLS for inserts).
 */

import { createClient } from "@supabase/supabase-js";

const SOCRATA_BASE = "https://data.cityofchicago.org/resource";
const APP_TOKEN = process.env.SOCRATA_APP_TOKEN!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function socrataFetch(endpoint: string, params: Record<string, string>) {
  const url = new URL(`${SOCRATA_BASE}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { "X-App-Token": APP_TOKEN },
  });
  if (!res.ok) throw new Error(`Socrata error ${res.status}: ${await res.text()}`);
  return res.json();
}

async function seed() {
  console.log("Fetching community areas...");
  const areas = await socrataFetch("igwz-8jzy.json", {
    $select: "area_numbe,community",
    $limit: "100",
  });

  const neighborhoods = new Map<number, string>();
  for (const a of areas) {
    const num = parseInt(a.area_numbe);
    const name = a.community?.trim();
    if (num && name) neighborhoods.set(num, name);
  }
  console.log(`Found ${neighborhoods.size} community areas`);

  // Insert neighborhoods
  const rows = Array.from(neighborhoods.entries())
    .sort(([a], [b]) => a - b)
    .map(([area_number, name]) => ({ area_number, name }));

  const { error: nErr } = await supabase.from("neighborhoods").upsert(rows, {
    onConflict: "area_number",
  });
  if (nErr) console.error("Neighborhoods insert error:", nErr);

  // Fetch crime data
  console.log("Fetching crime data...");
  const crimes = await socrataFetch("ijzp-q8t2.json", {
    $select: "community_area,count(*) as total",
    $where: "date > '2025-04-01'",
    $group: "community_area",
    $limit: "100",
  });

  const crimeMap = new Map<number, number>();
  for (const c of crimes) {
    const ca = parseInt(c.community_area);
    if (ca) crimeMap.set(ca, parseInt(c.total));
  }

  // Fetch housing data
  console.log("Fetching housing data...");
  const housing = await socrataFetch("s6ha-ppgi.json", {
    $select: "community_area_number,sum(units) as total_units",
    $group: "community_area_number",
    $limit: "100",
  });

  const housingMap = new Map<number, number>();
  for (const h of housing) {
    const ca = parseInt(h.community_area_number);
    if (ca) housingMap.set(ca, parseInt(h.total_units));
  }

  // Get neighborhood IDs
  const { data: nbData } = await supabase
    .from("neighborhoods")
    .select("id, area_number");

  if (!nbData) {
    console.error("Failed to fetch neighborhood IDs");
    return;
  }

  // Insert stats
  console.log("Inserting stats...");
  const stats = nbData.map((n) => ({
    neighborhood_id: n.id,
    crime_count: crimeMap.get(n.area_number) || 0,
    affordable_housing_units: housingMap.get(n.area_number) || 0,
  }));

  const { error: sErr } = await supabase.from("neighborhood_stats").upsert(stats, {
    onConflict: "neighborhood_id",
  });
  if (sErr) console.error("Stats insert error:", sErr);

  console.log("Seed complete!");
}

seed().catch(console.error);
