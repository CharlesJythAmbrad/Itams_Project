import { supabase } from "@/lib/supabaseClient"

export const MIGRATION_SQL = `-- Run this in your Supabase Dashboard -> SQL Editor:
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS is_deactivated BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_is_deactivated ON public.users(is_deactivated);

DROP POLICY IF EXISTS "ITSD can update users" ON public.users;

CREATE POLICY "ITSD can update users"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users admin_u 
      WHERE admin_u.id = auth.uid() 
        AND admin_u.role = 'itsd'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users admin_u 
      WHERE admin_u.id = auth.uid() 
        AND admin_u.role = 'itsd'
    )
  );

NOTIFY pgrst, 'reload schema';`

const STORAGE_KEY = "itams_user_schema_capabilities_v1"

let inMemoryCapabilities = {
  hasIsDeactivated: null, // null = unknown, true = exists, false = missing
  hasLastLoginAt: null
}

// Load cached capabilities from sessionStorage if present
try {
  const cached = typeof window !== "undefined" ? window.sessionStorage?.getItem(STORAGE_KEY) : null
  if (cached) {
    const parsed = JSON.parse(cached)
    if (parsed && typeof parsed.hasIsDeactivated === "boolean") {
      inMemoryCapabilities = parsed
    }
  }
} catch {
  // Ignore session storage errors
}

export function getUserSchemaCapabilities() {
  return inMemoryCapabilities
}

export function setUserSchemaCapabilities(capabilities) {
  inMemoryCapabilities = { ...inMemoryCapabilities, ...capabilities }
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryCapabilities))
    }
  } catch {
    // Ignore storage write issues
  }
}

/**
 * Checks whether public.users table supports is_deactivated and last_login_at.
 * Uses cached result unless forceRefresh is true.
 */
export async function detectUserSchemaCapabilities(forceRefresh = false) {
  if (
    !forceRefresh &&
    inMemoryCapabilities.hasIsDeactivated !== null &&
    inMemoryCapabilities.hasLastLoginAt !== null
  ) {
    return inMemoryCapabilities
  }

  try {
    // Probe users table for the columns
    const { error: probeError } = await supabase
      .from("users")
      .select("id, is_deactivated, last_login_at")
      .limit(1)

    if (probeError) {
      const isMissingDeactivated = probeError.message?.includes("is_deactivated")
      const isMissingLastLogin = probeError.message?.includes("last_login_at")

      const newCaps = {
        hasIsDeactivated: !isMissingDeactivated,
        hasLastLoginAt: !isMissingLastLogin
      }

      setUserSchemaCapabilities(newCaps)
      return newCaps
    }

    const newCaps = {
      hasIsDeactivated: true,
      hasLastLoginAt: true
    }
    setUserSchemaCapabilities(newCaps)
    return newCaps
  } catch (err) {
    console.warn("Could not probe user schema capabilities:", err)
    return inMemoryCapabilities
  }
}
