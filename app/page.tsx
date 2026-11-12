
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

export default async function HomePage() {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  if (profile.role === "agency_admin") {
    redirect("/agency");
  } else {
    redirect("/university");
  }
}
