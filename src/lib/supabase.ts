"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

let cachedClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return cachedClient;
}

export interface DecodedJwtClaims {
  sub?: string;
  aal?: string;
  amr?: { method?: string; timestamp?: number }[];
}

export function decodeJwtClaims(accessToken: string | undefined): DecodedJwtClaims {
  if (!accessToken) return {};
  try {
    const parts = accessToken.split(".");
    if (parts.length < 2) return {};
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(padded);
    return JSON.parse(json) as DecodedJwtClaims;
  } catch {
    return {};
  }
}

export function hasAuthMethod(claims: DecodedJwtClaims, method: string): boolean {
  return Array.isArray(claims.amr)
    ? claims.amr.some((entry) => entry?.method === method)
    : false;
}
