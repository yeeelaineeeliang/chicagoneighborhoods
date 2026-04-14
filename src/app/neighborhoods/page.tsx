"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import NeighborhoodCard from "@/components/neighborhoods/NeighborhoodCard";
import { computeRankings } from "@/lib/rankings";
import type { NeighborhoodWithStats } from "@/lib/types";

export default function NeighborhoodsPage() {
  const [allNeighborhoods, setAllNeighborhoods] = useState<
    NeighborhoodWithStats[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");

  // Fetch all neighborhoods once for ranking context
  useEffect(() => {
    fetch("/api/neighborhoods")
      .then((res) => res.json())
      .then((data) => {
        setAllNeighborhoods(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Compute rankings from the full set
  const rankings = useMemo(
    () => computeRankings(allNeighborhoods),
    [allNeighborhoods]
  );

  // Filter and sort on the client
  const displayed = useMemo(() => {
    let list = allNeighborhoods;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((n) => n.name.toLowerCase().includes(q));
    }

    list = [...list].sort((a, b) => {
      if (sort === "crime") {
        return (
          (a.neighborhood_stats?.crime_count ?? 0) -
          (b.neighborhood_stats?.crime_count ?? 0)
        );
      }
      if (sort === "housing") {
        return (
          (b.neighborhood_stats?.affordable_housing_units ?? 0) -
          (a.neighborhood_stats?.affordable_housing_units ?? 0)
        );
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [allNeighborhoods, search, sort]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-4xl font-bold">Chicago Neighborhoods</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Explore all 77 community areas. Safety and housing stats are ranked
        across all neighborhoods so you can see how each one compares.
        Data sourced daily from the{" "}
        <a
          href="https://data.cityofchicago.org"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          Chicago Data Portal
        </a>
        .
      </p>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row">
        <Input
          placeholder="Search neighborhoods..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2">
          <Button
            variant={sort === "name" ? "default" : "outline"}
            size="sm"
            onClick={() => setSort("name")}
          >
            A-Z
          </Button>
          <Button
            variant={sort === "crime" ? "default" : "outline"}
            size="sm"
            onClick={() => setSort("crime")}
          >
            Safest First
          </Button>
          <Button
            variant={sort === "housing" ? "default" : "outline"}
            size="sm"
            onClick={() => setSort("housing")}
          >
            Most Housing
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <p className="mt-8 text-center text-muted-foreground">
          No neighborhoods found matching &quot;{search}&quot;
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((n) => (
            <NeighborhoodCard
              key={n.id}
              neighborhood={n}
              rank={rankings.get(n.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
