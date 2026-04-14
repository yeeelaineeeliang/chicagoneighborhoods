import { createClient } from "@supabase/supabase-js";
import { clerkClient } from "@clerk/nextjs/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  // Get all favorites with user_ids
  const { data: favorites, error: favError } = await supabase
    .from("user_favorites")
    .select("neighborhood_id, user_id");

  if (favError) {
    return Response.json({ error: favError.message }, { status: 500 });
  }

  // Count saves and collect user_ids per neighborhood
  const counts = new Map<number, { count: number; userIds: string[] }>();
  for (const f of favorites) {
    const existing = counts.get(f.neighborhood_id) || {
      count: 0,
      userIds: [],
    };
    existing.count++;
    if (!existing.userIds.includes(f.user_id)) {
      existing.userIds.push(f.user_id);
    }
    counts.set(f.neighborhood_id, existing);
  }

  const savedIds = Array.from(counts.keys());
  if (savedIds.length === 0) {
    return Response.json([]);
  }

  // Get neighborhood details
  const { data: neighborhoods, error: nbError } = await supabase
    .from("neighborhoods")
    .select("*, neighborhood_stats(*)")
    .in("id", savedIds);

  if (nbError) {
    return Response.json({ error: nbError.message }, { status: 500 });
  }

  // Fetch user profiles from Clerk (deduplicated)
  const allUserIds = new Set<string>();
  for (const entry of counts.values()) {
    for (const uid of entry.userIds) {
      allUserIds.add(uid);
    }
  }

  const userProfiles = new Map<
    string,
    { firstName: string | null; imageUrl: string }
  >();

  try {
    const client = await clerkClient();
    const users = await client.users.getUserList({
      userId: Array.from(allUserIds),
      limit: 100,
    });
    for (const user of users.data) {
      userProfiles.set(user.id, {
        firstName: user.firstName,
        imageUrl: user.imageUrl,
      });
    }
  } catch {
    // If Clerk fails, continue without avatars
  }

  // Combine results
  const result = neighborhoods
    .map((n) => {
      const entry = counts.get(n.id)!;
      return {
        ...n,
        save_count: entry.count,
        saved_by: entry.userIds.slice(0, 5).map((uid) => ({
          id: uid,
          firstName: userProfiles.get(uid)?.firstName || null,
          imageUrl: userProfiles.get(uid)?.imageUrl || null,
        })),
      };
    })
    .sort((a, b) => b.save_count - a.save_count);

  return Response.json(result);
}
