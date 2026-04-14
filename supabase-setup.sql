-- ====================================================
-- Run this in the Supabase Dashboard SQL Editor
-- Project: CHI-neighborhoods (beusdypkfxbigsugieqn)
-- ====================================================

-- 1. Create tables
CREATE TABLE public.neighborhoods (
  id SERIAL PRIMARY KEY,
  area_number INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.neighborhood_stats (
  id SERIAL PRIMARY KEY,
  neighborhood_id INTEGER REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
  crime_count INTEGER DEFAULT 0,
  affordable_housing_units INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(neighborhood_id)
);

CREATE TABLE public.user_favorites (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  neighborhood_id INTEGER REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, neighborhood_id)
);

-- 2. Enable RLS
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhood_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- 3. Grants
GRANT SELECT ON public.neighborhoods TO anon, authenticated;
GRANT SELECT ON public.neighborhood_stats TO anon, authenticated;
GRANT ALL ON public.user_favorites TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 4. RLS policies
CREATE POLICY "Public read neighborhoods" ON public.neighborhoods FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read stats" ON public.neighborhood_stats FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Select favorites" ON public.user_favorites FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Insert favorites" ON public.user_favorites FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Delete favorites" ON public.user_favorites FOR DELETE TO anon, authenticated USING (true);

-- 5. Seed 77 neighborhoods
INSERT INTO neighborhoods (area_number, name) VALUES
(1,'ROGERS PARK'),(2,'WEST RIDGE'),(3,'UPTOWN'),(4,'LINCOLN SQUARE'),(5,'NORTH CENTER'),
(6,'LAKE VIEW'),(7,'LINCOLN PARK'),(8,'NEAR NORTH SIDE'),(9,'EDISON PARK'),(10,'NORWOOD PARK'),
(11,'JEFFERSON PARK'),(12,'FOREST GLEN'),(13,'NORTH PARK'),(14,'ALBANY PARK'),(15,'PORTAGE PARK'),
(16,'IRVING PARK'),(17,'DUNNING'),(18,'MONTCLARE'),(19,'BELMONT CRAGIN'),(20,'HERMOSA'),
(21,'AVONDALE'),(22,'LOGAN SQUARE'),(23,'HUMBOLDT PARK'),(24,'WEST TOWN'),(25,'AUSTIN'),
(26,'WEST GARFIELD PARK'),(27,'EAST GARFIELD PARK'),(28,'NEAR WEST SIDE'),(29,'NORTH LAWNDALE'),
(30,'SOUTH LAWNDALE'),(31,'LOWER WEST SIDE'),(32,'LOOP'),(33,'NEAR SOUTH SIDE'),
(34,'ARMOUR SQUARE'),(35,'DOUGLAS'),(36,'OAKLAND'),(37,'FULLER PARK'),(38,'GRAND BOULEVARD'),
(39,'KENWOOD'),(40,'WASHINGTON PARK'),(41,'HYDE PARK'),(42,'WOODLAWN'),(43,'SOUTH SHORE'),
(44,'CHATHAM'),(45,'AVALON PARK'),(46,'SOUTH CHICAGO'),(47,'BURNSIDE'),(48,'CALUMET HEIGHTS'),
(49,'ROSELAND'),(50,'PULLMAN'),(51,'SOUTH DEERING'),(52,'EAST SIDE'),(53,'WEST PULLMAN'),
(54,'RIVERDALE'),(55,'HEGEWISCH'),(56,'GARFIELD RIDGE'),(57,'ARCHER HEIGHTS'),
(58,'BRIGHTON PARK'),(59,'MCKINLEY PARK'),(60,'BRIDGEPORT'),(61,'NEW CITY'),
(62,'WEST ELSDON'),(63,'GAGE PARK'),(64,'CLEARING'),(65,'WEST LAWN'),
(66,'CHICAGO LAWN'),(67,'WEST ENGLEWOOD'),(68,'ENGLEWOOD'),(69,'GREATER GRAND CROSSING'),
(70,'ASHBURN'),(71,'AUBURN GRESHAM'),(72,'BEVERLY'),(73,'WASHINGTON HEIGHTS'),
(74,'MOUNT GREENWOOD'),(75,'MORGAN PARK'),(76,'OHARE'),(77,'EDGEWATER');

-- 6. Seed stats (crime + housing data from Chicago Socrata API)
INSERT INTO neighborhood_stats (neighborhood_id, crime_count, affordable_housing_units)
SELECT n.id, v.crime, v.housing
FROM (VALUES
(1,3655,1178),(2,3257,324),(3,4139,1432),(4,1950,36),(5,1324,162),(6,6116,523),(7,3927,186),
(8,11201,1312),(9,236,1),(10,1128,84),(11,899,73),(12,395,0),(13,925,380),(14,2242,233),
(15,3074,123),(16,2296,65),(17,1417,129),(18,703,97),(19,3963,525),(20,1214,0),(21,2297,76),
(22,4562,707),(23,5932,1139),(24,6994,620),(25,11447,703),(26,3335,509),(27,3656,1205),
(28,10591,1958),(29,6324,1315),(30,3727,39),(31,2750,352),(32,8555,53),(33,2413,1473),
(34,1170,147),(35,3026,896),(36,866,1063),(37,688,100),(38,3456,2406),(39,2066,333),
(40,2459,883),(41,2610,111),(42,3766,764),(43,8270,412),(44,5298,162),(45,1053,102),
(46,3749,164),(47,260,0),(48,1294,134),(49,5223,280),(50,1039,270),(51,1754,86),(52,1368,0),
(53,3181,262),(54,1053,333),(55,746,116),(56,1947,228),(57,1057,0),(58,2084,30),(59,930,0),
(60,1710,85),(61,3610,336),(62,906,78),(63,2250,59),(64,990,0),(65,1688,89),(66,4671,341),
(67,4276,224),(68,4775,822),(69,6205,56),(70,2023,85),(71,5995,406),(72,959,0),(73,2766,146),
(74,530,0),(75,1871,0),(76,1604,0),(77,2855,529)
) AS v(area, crime, housing)
JOIN neighborhoods n ON n.area_number = v.area;
