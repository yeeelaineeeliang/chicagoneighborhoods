"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import NeighborhoodCard from "@/components/neighborhoods/NeighborhoodCard";
import { computeRankings } from "@/lib/rankings";
import type { NeighborhoodWithStats } from "@/lib/types";

interface SearchEntry {
  id: number;
  query: string;
  result_count: number;
  searched_at: string;
}

export default function NeighborhoodsPage() {
  const { isSignedIn } = useAuth();
  const [allNeighborhoods, setAllNeighborhoods] = useState<
    NeighborhoodWithStats[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sorts, setSorts] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<SearchEntry[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/neighborhoods")
      .then((res) => res.json())
      .then((data) => {
        setAllNeighborhoods(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Load search history
  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/search-history")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setHistory(data);
      })
      .catch(() => {});
  }, [isSignedIn]);

  const rankings = useMemo(
    () => computeRankings(allNeighborhoods),
    [allNeighborhoods]
  );

  function toggleSort(key: string) {
    setSorts((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const displayed = useMemo(() => {
    let list = allNeighborhoods;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((n) => n.name.toLowerCase().includes(q));
    }

    list = [...list].sort((a, b) => {
      if (sorts.size === 0) {
        return a.name.localeCompare(b.name);
      }

      // Combined score: lower = better. Each active sort adds a rank component.
      let scoreA = 0;
      let scoreB = 0;

      if (sorts.has("crime")) {
        scoreA += a.neighborhood_stats?.crime_count ?? 0;
        scoreB += b.neighborhood_stats?.crime_count ?? 0;
      }
      if (sorts.has("housing")) {
        // Invert so more housing = lower score (better)
        scoreA -= a.neighborhood_stats?.affordable_housing_units ?? 0;
        scoreB -= b.neighborhood_stats?.affordable_housing_units ?? 0;
      }

      return scoreA - scoreB;
    });

    return list;
  }, [allNeighborhoods, search, sorts]);

  // Save search to history (debounced)
  const saveSearch = useCallback(
    (query: string, resultCount: number) => {
      if (!isSignedIn || !query.trim()) return;
      fetch("/api/search-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), result_count: resultCount }),
      })
        .then((res) => res.json())
        .then((entry) => {
          if (entry.id) {
            setHistory((prev) => [entry, ...prev].slice(0, 20));
          }
        })
        .catch(() => {});
    },
    [isSignedIn]
  );

  // Debounce search saving — save after 1s of no typing
  useEffect(() => {
    if (!search.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveSearch(search, displayed.length);
    }, 1000);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, displayed.length, saveSearch]);

  function clearHistory() {
    fetch("/api/search-history", { method: "DELETE" }).then(() =>
      setHistory([])
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-4xl font-bold">Chicago Neighborhoods</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Explore all 77 community areas. Safety and housing stats are ranked
        across all neighborhoods so you can see how each one compares. Data
        sourced daily from the{" "}
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
        <div className="flex flex-wrap gap-2">
          <Button
            variant={sorts.has("crime") ? "default" : "outline"}
            size="sm"
            onClick={() => toggleSort("crime")}
          >
            Safest{sorts.has("crime") ? " ✓" : ""}
          </Button>
          <Button
            variant={sorts.has("housing") ? "default" : "outline"}
            size="sm"
            onClick={() => toggleSort("housing")}
          >
            Most Housing{sorts.has("housing") ? " ✓" : ""}
          </Button>
          {sorts.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSorts(new Set())}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Recent searches */}
      {isSignedIn && history.length > 0 && !search && (
        <div className="mt-4">
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">Recent searches:</p>
            <div className="flex flex-wrap gap-2">
              {history.slice(0, 5).map((h) => (
                <Button
                  key={h.id}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSearch(h.query)}
                >
                  {h.query}{" "}
                  <span className="ml-1 text-muted-foreground">
                    ({h.result_count})
                  </span>
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={clearHistory}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <p className="mt-8 text-center text-lg text-muted-foreground">
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
