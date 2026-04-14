"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import FavoriteButton from "@/components/neighborhoods/FavoriteButton";
import { computeRankings } from "@/lib/rankings";
import { NEIGHBORHOOD_COORDS } from "@/lib/coordinates";
import type { NeighborhoodWithStats, CrimeRecord } from "@/lib/types";

function formatName(name: string) {
  return name
    .split(" ")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

const AVG_CRIME = 3100;

export default function NeighborhoodDetailPage() {
  const params = useParams<{ id: string }>();
  const [neighborhood, setNeighborhood] =
    useState<NeighborhoodWithStats | null>(null);
  const [allNeighborhoods, setAllNeighborhoods] = useState<
    NeighborhoodWithStats[]
  >([]);
  const [crimes, setCrimes] = useState<CrimeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [crimesLoading, setCrimesLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/neighborhoods/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setNeighborhood(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch(`/api/neighborhoods/${params.id}/crime`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCrimes(data);
        setCrimesLoading(false);
      })
      .catch(() => setCrimesLoading(false));

    fetch("/api/neighborhoods")
      .then((res) => res.json())
      .then((data) => setAllNeighborhoods(data))
      .catch(() => {});
  }, [params.id]);

  const rankings = useMemo(
    () => computeRankings(allNeighborhoods),
    [allNeighborhoods]
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-4 h-64" />
      </div>
    );
  }

  if (!neighborhood) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Neighborhood not found</h1>
        <Link href="/neighborhoods">
          <Button className="mt-4" variant="outline">
            Back to Browse
          </Button>
        </Link>
      </div>
    );
  }

  const stats = neighborhood.neighborhood_stats;
  const crimeCount = stats?.crime_count ?? 0;
  const housingUnits = stats?.affordable_housing_units ?? 0;
  const maxCrime = crimes.length > 0 ? parseInt(crimes[0].count) : 1;
  const rank = rankings.get(neighborhood.id);

  const crimeVsAvg = crimeCount < AVG_CRIME ? "below" : "above";
  const crimeVsAvgPct = Math.abs(
    Math.round(((crimeCount - AVG_CRIME) / AVG_CRIME) * 100)
  );

  const coords = NEIGHBORHOOD_COORDS[neighborhood.area_number];
  const mapSrc = coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords[1] - 0.025}%2C${coords[0] - 0.015}%2C${coords[1] + 0.025}%2C${coords[0] + 0.015}&layer=mapnik&marker=${coords[0]}%2C${coords[1]}`
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/neighborhoods"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Back to Browse
      </Link>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            {formatName(neighborhood.name)}
          </h1>
          <p className="mt-1 text-lg text-muted-foreground">
            Community Area {neighborhood.area_number} &middot; Chicago, IL
          </p>
        </div>
        <FavoriteButton neighborhoodId={neighborhood.id} />
      </div>

      {/* Map */}
      {mapSrc && (
        <div className="mt-6 overflow-hidden rounded-lg border">
          <iframe
            title={`Map of ${formatName(neighborhood.name)}`}
            width="100%"
            height="300"
            src={mapSrc}
            className="border-0"
          />
        </div>
      )}

      {/* Stats cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Safety</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {crimeCount.toLocaleString()}
            </p>
            <p className="mt-1 text-base text-muted-foreground">
              crime reports since April 2025
            </p>
            <div className="mt-3 space-y-1 text-base">
              <p>
                <span className="font-medium">
                  {crimeVsAvgPct}% {crimeVsAvg}
                </span>{" "}
                the city-wide average
              </p>
              {rank && (
                <p>
                  Safer than{" "}
                  <span className="font-medium">
                    {rank.safetyPercentile}%
                  </span>{" "}
                  of Chicago neighborhoods
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Affordable Housing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {housingUnits.toLocaleString()}
            </p>
            <p className="mt-1 text-base text-muted-foreground">
              subsidized rental units
            </p>
            <div className="mt-3 space-y-1 text-base">
              <p className="text-muted-foreground">
                Rent-capped units in income-restricted housing programs.
              </p>
              {rank && housingUnits > 0 && (
                <p>
                  More than{" "}
                  <span className="font-medium">
                    {rank.housingPercentile}%
                  </span>{" "}
                  of Chicago neighborhoods
                </p>
              )}
              {housingUnits === 0 && (
                <p className="text-muted-foreground">
                  No subsidized housing programs currently listed here.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Crime breakdown */}
      <h2 className="text-2xl font-semibold">Crime Breakdown</h2>
      <p className="mt-1 text-base text-muted-foreground">
        Live data from the{" "}
        <a
          href="https://data.cityofchicago.org/Public-Safety/Crimes-2001-to-Present/ijzp-q8t2"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          Chicago Data Portal
        </a>
        . Crime reports are updated daily by the Chicago Police Department.
      </p>

      {crimesLoading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      ) : crimes.length === 0 ? (
        <p className="mt-6 text-muted-foreground">No crime data available.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {crimes.map((c) => (
            <div key={c.primary_type} className="flex items-center gap-3">
              <span className="w-44 shrink-0 text-base">
                {c.primary_type
                  .split(" ")
                  .map(
                    (w: string) => w.charAt(0) + w.slice(1).toLowerCase()
                  )
                  .join(" ")}
              </span>
              <div className="flex-1">
                <div className="h-7 overflow-hidden rounded bg-muted">
                  <div
                    className="h-full rounded bg-primary transition-all"
                    style={{
                      width: `${(parseInt(c.count) / maxCrime) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <Badge variant="outline" className="shrink-0 text-sm">
                {parseInt(c.count).toLocaleString()}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Data source footer */}
      <Separator className="my-8" />
      <div className="text-sm text-muted-foreground">
        <p className="font-medium">About this data</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            Crime data: Chicago Police Department via the{" "}
            <a
              href="https://data.cityofchicago.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Chicago Data Portal
            </a>{" "}
            (updated daily)
          </li>
          <li>
            Affordable housing: City of Chicago Affordable Rental Housing
            Developments dataset
          </li>
          <li>
            Community area boundaries: City of Chicago GIS data
          </li>
        </ul>
      </div>
    </div>
  );
}
