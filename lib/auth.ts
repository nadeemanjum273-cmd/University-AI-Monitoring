import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/types/database";

export async function getCurrentProfile(): Promise<{
  user: any | null;
  profile: Profile | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  // Attempt to fetch profile from PostgreSQL profiles table
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*, institution:institutions(*)")
    .eq("id", user.id)
    .maybeSingle();

  if (profile && !error) {
    return { user, profile: profile as Profile };
  }

  // Fallback for initial admin bootstrap or metadata-driven setups
  const roleFromMeta = (user.user_metadata?.role ||
    user.app_metadata?.role ||
    "agency_admin") as Profile["role"];

  const institutionIdFromMeta =
    user.user_metadata?.institution_id ||
    user.app_metadata?.institution_id ||
    null;

  const fallbackProfile: Profile = {
    id: user.id,
    email: user.email || "",
    full_name:
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Campus Admin",
    role: roleFromMeta,
    institution_id: institutionIdFromMeta,
    created_at: user.created_at || new Date().toISOString(),
  };

  return { user, profile: fallbackProfile };
}

