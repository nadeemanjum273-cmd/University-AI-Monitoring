"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";

export interface RegisterClientResult {
  error?: string;
  success?: boolean;
}

/**
 * Server Action: Registers a new institution and its designated university_admin.
 * Strict compliance with PostgreSQL schema:
 * - public.institutions (id, name, created_at)
 * - public.profiles (id, institution_id, email, full_name, role, created_at)
 */
export async function registerClient(
  formData: FormData
): Promise<RegisterClientResult> {
  // 1. Verify agency_admin permissions
  const { user, profile } = await getCurrentProfile();
  if (!user || profile?.role !== "agency_admin") {
    return { error: "Unauthorized: Only agency administrators can register new institutions." };
  }

  const name = formData.get("name")?.toString().trim();
  const adminEmail = formData.get("adminEmail")?.toString().trim().toLowerCase();
  const adminPassword = formData.get("adminPassword")?.toString();

  if (!name || !adminEmail || !adminPassword) {
    return { error: "All fields are required (Institution Name, Admin Email, Admin Password)." };
  }

  if (adminPassword.length < 6) {
    return { error: "Admin password must be at least 6 characters long." };
  }

  const supabase = await createClient();

  // 2. Insert into 'institutions' table (name only, id and created_at are generated)
  const { data: newInstitution, error: instError } = await supabase
    .from("institutions")
    .insert([{ name }])
    .select()
    .single();

  if (instError) {
    return { error: `Failed to create institution: ${instError.message}` };
  }

  const institutionId = newInstitution.id;

  // 3. Provision the Auth User and link in 'profiles'
  const adminClient = createAdminClient();

  if (adminClient) {
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          role: "university_admin",
          institution_id: institutionId,
          full_name: `${name} Administrator`,
        },
      });

    if (authError) {
      return {
        error: `Institution created, but Auth User provisioning failed: ${authError.message}`,
      };
    }

    // Upsert into 'profiles' table
    await adminClient.from("profiles").upsert({
      id: authData.user.id,
      institution_id: institutionId,
      email: adminEmail,
      full_name: `${name} Administrator`,
      role: "university_admin",
    });
  } else {
    // Fallback using standard Supabase client
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          role: "university_admin",
          institution_id: institutionId,
          full_name: `${name} Administrator`,
        },
      },
    });

    if (signUpData.user) {
      await supabase.from("profiles").upsert({
        id: signUpData.user.id,
        institution_id: institutionId,
        email: adminEmail,
        full_name: `${name} Administrator`,
        role: "university_admin",
      });
    } else if (signUpError) {
      return {
        error: `Institution created, but failed to create admin profile: ${signUpError.message}`,
      };
    }
  }

  revalidatePath("/agency");
  return { success: true };
}
