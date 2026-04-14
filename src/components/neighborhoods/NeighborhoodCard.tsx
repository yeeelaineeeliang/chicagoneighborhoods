import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { NeighborhoodWithStats } from "@/lib/types";
import type { NeighborhoodRank } from "@/lib/rankings";

function formatName(name: string) {
  return name
    .split(" ")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function safetyBadge(percentile: number): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  if (percentile >= 75)
    return { label: `Safer than ${percentile}%`, variant: "secondary" };
  if (percentile >= 40)
    return { label: `Safer than ${percentile}%`, variant: "outline" };
  return { label: `Safer than ${percentile}%`, variant: "destructive" };
}

export default function NeighborhoodCard({
  neighborhood,
  rank,
}: {
  neighborhood: NeighborhoodWithStats;
  rank?: NeighborhoodRank;
}) {
  const stats = neighborhood.neighborhood_stats;
  const housing = stats?.affordable_housing_units ?? 0;
  const safety = safetyBadge(rank?.safetyPercentile ?? 50);

  return (
    <Link href={`/neighborhoods/${neighborhood.area_number}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">
            {formatName(neighborhood.name)}
          </CardTitle>
          <p className="text-base text-muted-foreground">
            Area {neighborhood.area_number}
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant={safety.variant} className="text-sm">
              {safety.label}
            </Badge>
          </div>
          <p className="text-base text-muted-foreground">
            {housing > 0 ? (
              <>
                {housing.toLocaleString()} affordable units
                {rank && rank.housingPercentile >= 60 && (
                  <span className="font-medium text-foreground">
                    {" "}
                    — top {100 - rank.housingPercentile}%
                  </span>
                )}
              </>
            ) : (
              "No affordable housing listed"
            )}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
