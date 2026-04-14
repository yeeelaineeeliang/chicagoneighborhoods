import { socrataFetch } from "@/lib/socrata";
import type { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/neighborhoods/[id]/crime">
) {
  const { id } = await ctx.params;
  const areaNumber = parseInt(id);

  if (isNaN(areaNumber)) {
    return Response.json({ error: "Invalid area number" }, { status: 400 });
  }

  try {
    const data = await socrataFetch("ijzp-q8t2.json", {
      $select: "primary_type, count(*) as count",
      $where: `community_area='${areaNumber}' AND date > '2025-04-01'`,
      $group: "primary_type",
      $order: "count DESC",
      $limit: "20",
    });

    return Response.json(data);
  } catch {
    return Response.json(
      { error: "Failed to fetch crime data" },
      { status: 502 }
    );
  }
}
