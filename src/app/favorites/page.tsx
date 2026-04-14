"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface FavoriteItem {
  id: number;
  neighborhood_id: number;
  saved_at: string;
  neighborhoods: {
    id: number;
    area_number: number;
    name: string;
    neighborhood_stats: { crime_count: number; affordable_housing_units: number } | null;
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

  useEffect(() => {
    fetch("/api/favorites")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setFavorites(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function removeFavorite(favId: number) {
    await fetch(`/api/favorites/${favId}`, { method: "DELETE" });
    setFavorites((prev) => prev.filter((f) => f.id !== favId));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold">My Favorites</h1>
      <p className="mt-2 text-muted-foreground">
        Neighborhoods you&apos;ve saved to your account.
      </p>

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            You haven&apos;t saved any neighborhoods yet.
          </p>
          <Link href="/neighborhoods">
            <Button className="mt-4">Browse Neighborhoods</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav) => {
            const nb = fav.neighborhoods;
            const stats = nb.neighborhood_stats;
            return (
              <Card key={fav.id} className="relative">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    <Link
                      href={`/neighborhoods/${nb.area_number}`}
                      className="hover:underline"
                    >
                      {formatName(nb.name)}
                    </Link>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Area {nb.area_number}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {(stats?.crime_count ?? 0).toLocaleString()} crimes
                    </Badge>
                    {(stats?.affordable_housing_units ?? 0) > 0 && (
                      <Badge variant="secondary">
                        {stats!.affordable_housing_units.toLocaleString()}{" "}
                        affordable units
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 text-destructive hover:text-destructive"
                    onClick={() => removeFavorite(fav.id)}
                  >
                    Remove
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
