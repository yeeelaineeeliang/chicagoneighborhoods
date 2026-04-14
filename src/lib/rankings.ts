import type { NeighborhoodWithStats } from "./types";

export interface NeighborhoodRank {
  /** 0-100, higher = safer (fewer crimes relative to others) */
  safetyPercentile: number;
  /** 0-100, higher = more affordable housing relative to others */
  housingPercentile: number;
}

/**
 * Compute percentile rankings for each neighborhood.
 * Returns a map from neighborhood id to its rank info.
 */
export function computeRankings(
  neighborhoods: NeighborhoodWithStats[]
): Map<number, NeighborhoodRank> {
  const rankings = new Map<number, NeighborhoodRank>();
  const n = neighborhoods.length;
  if (n === 0) return rankings;

  // Sort by crime ascending — lower crime = higher safety percentile
  const byCrime = [...neighborhoods].sort(
    (a, b) =>
      (a.neighborhood_stats?.crime_count ?? 0) -
      (b.neighborhood_stats?.crime_count ?? 0)
  );

  // Sort by housing descending — more units = higher housing percentile
  const byHousing = [...neighborhoods].sort(
    (a, b) =>
      (b.neighborhood_stats?.affordable_housing_units ?? 0) -
      (a.neighborhood_stats?.affordable_housing_units ?? 0)
  );

  const crimeRank = new Map<number, number>();
  const housingRank = new Map<number, number>();

  byCrime.forEach((nb, i) => {
    crimeRank.set(nb.id, Math.round(((n - 1 - i) / (n - 1)) * 100));
  });

  byHousing.forEach((nb, i) => {
    housingRank.set(nb.id, Math.round(((n - 1 - i) / (n - 1)) * 100));
  });

  for (const nb of neighborhoods) {
    rankings.set(nb.id, {
      safetyPercentile: crimeRank.get(nb.id) ?? 50,
      housingPercentile: housingRank.get(nb.id) ?? 50,
    });
  }

  return rankings;
}
