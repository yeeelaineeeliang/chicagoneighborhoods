import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/neighborhoods/[id]">
) {
  const { id } = await ctx.params;
  const areaNumber = parseInt(id);

  if (isNaN(areaNumber)) {
    return Response.json({ error: "Invalid area number" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("neighborhoods")
    .select("*, neighborhood_stats(*)")
    .eq("area_number", areaNumber)
    .single();

  if (error || !data) {
    return Response.json({ error: "Neighborhood not found" }, { status: 404 });
  }

  return Response.json(data);
}
