"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface SavedByUser {
  id: string;
  firstName: string | null;
  imageUrl: string | null;
}

interface CommunityItem {
  id: number;
  area_number: number;
  name: string;
  save_count: number;
  saved_by: SavedByUser[];
  neighborhood_stats: {
    crime_count: number;
    affordable_housing_units: number;
  } | null;
}

function formatName(name: string) {
  return name
    .split(" ")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function UserAvatars({ users }: { users: SavedByUser[] }) {
  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      <div className="flex -space-x-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-white"
            title={user.firstName || "User"}
          >
            {user.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={user.firstName || "User"}
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-xs font-medium">
                {user.firstName?.[0]?.toUpperCase() || "?"}
              </div>
            )}
          </div>
        ))}
      </div>
      <span className="ml-2 text-sm text-muted-foreground">
        {users
          .slice(0, 3)
          .map((u) => u.firstName || "Someone")
          .join(", ")}
        {users.length > 3 && ` +${users.length - 3} more`}
      </span>
    </div>
  );
}

export default function CommunityPage() {
  const [items, setItems] = useState<CommunityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/community")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-4xl font-bold">Community Favorites</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        See which neighborhoods other users are saving. The more saves, the more
        popular the area.
      </p>

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-lg text-muted-foreground">
            No one has saved any neighborhoods yet. Be the first!
          </p>
          <Link href="/neighborhoods">
            <Button className="mt-4">Browse Neighborhoods</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const stats = item.neighborhood_stats;
            return (
              <Link
                key={item.id}
                href={`/neighborhoods/${item.area_number}`}
              >
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">
                        {formatName(item.name)}
                      </CardTitle>
                      {index < 3 && (
                        <Badge variant="default" className="text-sm">
                          #{index + 1}
                        </Badge>
                      )}
                    </div>
                    <p className="text-base text-muted-foreground">
                      Area {item.area_number}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-lg font-semibold">
                      {item.save_count}{" "}
                      {item.save_count === 1 ? "save" : "saves"}
                    </p>
                    <UserAvatars users={item.saved_by} />
                    {stats && (
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-sm">
                          {stats.crime_count.toLocaleString()} crimes
                        </Badge>
                        {stats.affordable_housing_units > 0 && (
                          <Badge variant="secondary" className="text-sm">
                            {stats.affordable_housing_units.toLocaleString()}{" "}
                            affordable units
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
