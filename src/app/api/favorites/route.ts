import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_favorites")
    .select("*, neighborhoods(*, neighborhood_stats(*))")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const neighborhoodId = body.neighborhood_id;

  if (!neighborhoodId) {
    return Response.json(
      { error: "neighborhood_id required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("user_favorites")
    .insert({ user_id: userId, neighborhood_id: neighborhoodId })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "Already saved" }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}
