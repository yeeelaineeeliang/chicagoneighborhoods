"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";
import { useMemo } from "react";

export function useSupabaseClient(): SupabaseClient {
  const { session } = useSession();

  return useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          async accessToken() {
            return (await session?.getToken()) ?? null;
          },
        }
      ),
    [session]
  );
}
