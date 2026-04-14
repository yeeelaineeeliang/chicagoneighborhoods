export interface Neighborhood {
  id: number;
  area_number: number;
  name: string;
  created_at: string;
}

export interface NeighborhoodStats {
  id: number;
  neighborhood_id: number;
  crime_count: number;
  affordable_housing_units: number;
  updated_at: string;
}

export interface NeighborhoodWithStats extends Neighborhood {
  neighborhood_stats: NeighborhoodStats | null;
}

export interface UserFavorite {
  id: number;
  user_id: string;
  neighborhood_id: number;
  saved_at: string;
  neighborhoods: Neighborhood & { neighborhood_stats: NeighborhoodStats | null };
}

export interface CrimeRecord {
  primary_type: string;
  count: string;
}
