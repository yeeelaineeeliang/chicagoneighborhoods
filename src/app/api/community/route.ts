import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  // Get save counts per neighborhood
  const { data: favorites, error: favError } = await supabase
    .from("user_favorites")
    .select("neighborhood_id");

  if (favError) {
    return Response.json({ error: favError.message }, { status: 500 });
  }

  // Count saves per neighborhood
  const counts = new Map<number, number>();
  for (const f of favorites) {
    counts.set(f.neighborhood_id, (counts.get(f.neighborhood_id) || 0) + 1);
  }

  // Get neighborhood details for those that have been saved
  const savedIds = Array.from(counts.keys());
  if (savedIds.length === 0) {
    return Response.json([]);
  }

  const { data: neighborhoods, error: nbError } = await supabase
    .from("neighborhoods")
    .select("*, neighborhood_stats(*)")
    .in("id", savedIds);

  if (nbError) {
    return Response.json({ error: nbError.message }, { status: 500 });
  }

  // Combine and sort by save count
  const result = neighborhoods
    .map((n) => ({
      ...n,
      save_count: counts.get(n.id) || 0,
    }))
    .sort((a, b) => b.save_count - a.save_count);

  return Response.json(result);
}
