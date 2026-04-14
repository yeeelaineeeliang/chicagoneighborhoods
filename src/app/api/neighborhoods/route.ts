import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim() || "";
  const sort = searchParams.get("sort") || "name";

  let query = supabase
    .from("neighborhoods")
    .select("*, neighborhood_stats(*)");

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  if (sort === "crime") {
    query = query.order("crime_count", {
      referencedTable: "neighborhood_stats",
      ascending: true,
    });
  } else if (sort === "housing") {
    query = query.order("affordable_housing_units", {
      referencedTable: "neighborhood_stats",
      ascending: false,
    });
  } else {
    query = query.order("name", { ascending: true });
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
