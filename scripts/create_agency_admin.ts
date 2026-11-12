import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// 1. Load environment variables across possible configuration files
const envPaths = [
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "backend", ".env"),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "\n❌ [Error] Missing Supabase credentials:\n" +
      "   Ensure SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY\n" +
      "   are defined in .env.local or your environment variables.\n"
  );
  process.exit(1);
}

// 2. Initialize Supabase Admin Client (Service Role bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 3. Parse CLI options or fallback to defaults
function getArgValue(flag: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(`--${flag}=`));
  if (arg) {
    return arg.split("=")[1];
  }
  return undefined;
}

const email =
  getArgValue("email") ||
  process.env.AGENCY_ADMIN_EMAIL ||
  "admin@agency.com";

const password =
  getArgValue("password") ||
  process.env.AGENCY_ADMIN_PASSWORD ||
  "AgencyAdmin2026!";

const fullName =
  getArgValue("name") ||
  process.env.AGENCY_ADMIN_NAME ||
  "Master Agency Administrator";

async function seedAgencyAdmin() {
  console.log("\n=======================================================");
  console.log("🛡️  AI Campus Surveillance SaaS - Agency Admin Provisioning");
  console.log("=======================================================\n");
  console.log(`📡 Connecting to Supabase: ${supabaseUrl}`);
  console.log(`👤 Target Admin Email:   ${email}`);
  console.log(`🏷️  Target Admin Name:    ${fullName}`);
  console.log(`🔑 Role Assigned:         agency_admin\n`);

  try {
    let userId: string | null = null;

    // Check if the user already exists in auth.users
    const { data: listData, error: listError } =
      await supabase.auth.admin.listUsers();

    if (listError) {
      throw new Error(`Failed to list existing users: ${listError.message}`);
    }

    const existingUser = listData.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      console.log(`ℹ️  User '${email}' already exists in Auth (ID: ${existingUser.id}).`);
      console.log("   Updating credentials and user metadata...");

      const { data: updateData, error: updateError } =
        await supabase.auth.admin.updateUserById(existingUser.id, {
          password: password,
          email_confirm: true,
          user_metadata: {
            role: "agency_admin",
            full_name: fullName,
            status: "active",
          },
        });

      if (updateError) {
        throw new Error(`Failed to update Auth user: ${updateError.message}`);
      }

      userId = updateData.user.id;
      console.log("✅ Successfully updated Auth user credentials & metadata.");
    } else {
      console.log("✨ Creating new user in Supabase Auth...");

      const { data: createData, error: createError } =
        await supabase.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: {
            role: "agency_admin",
            full_name: fullName,
            status: "active",
          },
        });

      if (createError) {
        throw new Error(`Failed to create Auth user: ${createError.message}`);
      }

      userId = createData.user.id;
      console.log(`✅ Successfully created Auth user (ID: ${userId}).`);
    }

    if (!userId) {
      throw new Error("User ID could not be determined.");
    }

    // Provision or upsert record in public.profiles table
    console.log("📝 Upserting record in 'public.profiles' table...");

    // First attempt upsert with both 'role' and 'status'
    const profilePayloadWithStatus = {
      id: userId,
      email: email.toLowerCase(),
      full_name: fullName,
      role: "agency_admin",
      status: "active",
      institution_id: null,
    };

    let { error: profileError } = await supabase
      .from("profiles")
      .upsert(profilePayloadWithStatus, { onConflict: "id" });

    // If 'status' column doesn't exist in the database table schema, fallback cleanly without it
    if (profileError && profileError.message.toLowerCase().includes("status")) {
      console.log("ℹ️  Note: 'status' column is not in profiles schema. Falling back to core schema...");
      const profilePayloadCore = {
        id: userId,
        email: email.toLowerCase(),
        full_name: fullName,
        role: "agency_admin",
        institution_id: null,
      };

      const { error: retryError } = await supabase
        .from("profiles")
        .upsert(profilePayloadCore, { onConflict: "id" });

      profileError = retryError;
    }

    if (profileError) {
      throw new Error(`Failed to upsert into public.profiles: ${profileError.message}`);
    }

    console.log("✅ Successfully linked 'profiles' record as 'agency_admin'.");
    console.log("\n=======================================================");
    console.log("🎉 Initial Agency Admin Provisioned Successfully!");
    console.log("=======================================================");
    console.log(`\n👉 You can now sign in at:`);
    console.log(`   URL:      http://localhost:3000/login (or your production domain)`);
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role:     agency_admin (Can register University clients)`);
    console.log("\n=======================================================\n");
  } catch (err: any) {
    console.error(`\n❌ [Provisioning Failed]: ${err.message || err}\n`);
    process.exit(1);
  }
}

seedAgencyAdmin();
