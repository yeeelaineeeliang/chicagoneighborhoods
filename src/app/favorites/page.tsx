"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface FavoriteItem {
  id: number;
  neighborhood_id: number;
  saved_at: string;
  neighborhoods: {
    id: number;
    area_number: number;
    name: string;
    neighborhood_stats: {
      crime_count: number;
      affordable_housing_units: number;
    } | null;
  };
}

function formatName(name: string) {
  return name
    .split(" ")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");

  useEffect(() => {
    fetch("/api/favorites")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setFavorites(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const displayed = useMemo(() => {
    let list = favorites;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((f) =>
        f.neighborhoods.name.toLowerCase().includes(q)
      );
    }

    list = [...list].sort((a, b) => {
      const aStats = a.neighborhoods.neighborhood_stats;
      const bStats = b.neighborhoods.neighborhood_stats;
      if (sort === "name") {
        return a.neighborhoods.name.localeCompare(b.neighborhoods.name);
      }
      if (sort === "safest") {
        return (
          (aStats?.crime_count ?? 0) - (bStats?.crime_count ?? 0)
        );
      }
      if (sort === "housing") {
        return (
          (bStats?.affordable_housing_units ?? 0) -
          (aStats?.affordable_housing_units ?? 0)
        );
      }
      // recent (default)
      return (
        new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime()
      );
    });

    return list;
  }, [favorites, search, sort]);

  async function removeFavorite(favId: number) {
    await fetch(`/api/favorites/${favId}`, { method: "DELETE" });
    setFavorites((prev) => prev.filter((f) => f.id !== favId));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-4xl font-bold">My Favorites</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Neighborhoods you&apos;ve saved to your account.
      </p>

      {!loading && favorites.length > 0 && (
        <div className="mt-6 flex flex-col gap-4 sm:flex-row">
          <Input
            placeholder="Filter saved neighborhoods..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant={sort === "recent" ? "default" : "outline"}
              size="sm"
              onClick={() => setSort("recent")}
            >
              Recent
            </Button>
            <Button
              variant={sort === "name" ? "default" : "outline"}
              size="sm"
              onClick={() => setSort("name")}
            >
              A-Z
            </Button>
            <Button
              variant={sort === "safest" ? "default" : "outline"}
              size="sm"
              onClick={() => setSort("safest")}
            >
              Safest
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
      )}

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-lg text-muted-foreground">
            You haven&apos;t saved any neighborhoods yet.
          </p>
          <Link href="/neighborhoods">
            <Button className="mt-4">Browse Neighborhoods</Button>
          </Link>
        </div>
      ) : displayed.length === 0 ? (
        <p className="mt-8 text-center text-lg text-muted-foreground">
          No saved neighborhoods match &quot;{search}&quot;
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((fav) => {
            const nb = fav.neighborhoods;
            const stats = nb.neighborhood_stats;
            return (
              <Card key={fav.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">
                    <Link
                      href={`/neighborhoods/${nb.area_number}`}
                      className="hover:underline"
                    >
                      {formatName(nb.name)}
                    </Link>
                  </CardTitle>
                  <p className="text-base text-muted-foreground">
                    Area {nb.area_number}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-sm">
                      {(stats?.crime_count ?? 0).toLocaleString()} crimes
                    </Badge>
                    {(stats?.affordable_housing_units ?? 0) > 0 && (
                      <Badge variant="secondary" className="text-sm">
                        {stats!.affordable_housing_units.toLocaleString()}{" "}
                        affordable units
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Saved {new Date(fav.saved_at).toLocaleDateString()}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeFavorite(fav.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
