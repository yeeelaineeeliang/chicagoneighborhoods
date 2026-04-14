import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/favorites/[id]">
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const { error } = await supabase
    .from("user_favorites")
    .delete()
    .eq("id", parseInt(id))
    .eq("user_id", userId);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return new Response(null, { status: 204 });
}
