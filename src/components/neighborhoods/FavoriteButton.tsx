"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function FavoriteButton({
  neighborhoodId,
}: {
  neighborhoodId: number;
}) {
  const { isSignedIn } = useAuth();
  const [favoriteId, setFavoriteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;

    fetch("/api/favorites")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const match = data.find(
            (f: { neighborhood_id: number }) =>
              f.neighborhood_id === neighborhoodId
          );
          if (match) setFavoriteId(match.id);
        }
      })
      .catch(() => {});
  }, [isSignedIn, neighborhoodId]);

  if (!isSignedIn) {
    return (
      <Button variant="outline" size="sm" disabled>
        Sign in to save
      </Button>
    );
  }

  const isSaved = favoriteId !== null;

  async function toggle() {
    setLoading(true);
    try {
      if (isSaved) {
        await fetch(`/api/favorites/${favoriteId}`, { method: "DELETE" });
        setFavoriteId(null);
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ neighborhood_id: neighborhoodId }),
        });
        const data = await res.json();
        if (data.id) setFavoriteId(data.id);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }

  return (
    <Button
      variant={isSaved ? "default" : "outline"}
      size="sm"
      onClick={toggle}
      disabled={loading}
    >
      {isSaved ? "Saved" : "Save"}
    </Button>
  );
}
