import type { Metadata } from "next";
import OnboardingClient from "./OnboardingClient";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Read My Chart",
  description: "Enter your birth details to receive your personalised Bazi (Four Pillars) reading.",
};

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const qs = await searchParams;
  const editId = qs.edit;
  
  let initialData = undefined;

  if (editId) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      redirect(`/auth/login?redirectTo=/onboarding?edit=${editId}`);
    }

    const { data: chart } = await supabase
      .from("bazi_charts")
      .select("*")
      .eq("id", editId)
      .eq("owner_id", user.id)
      .single();

    if (chart) {
      initialData = {
        name: chart.subject_name as string,
        birthDate: chart.birth_date as string,
        birthTimeKnown: chart.birth_time ? true : false,
        birthTime: chart.birth_time ? (chart.birth_time as string).substring(0, 5) : "",
        gender: chart.birth_gender as "M" | "F",
        locationName: chart.birth_location_name as string,
        longitude: chart.birth_longitude as number,
        latitude: chart.birth_latitude as number,
        timezone: chart.timezone as string,
      };
    }
  }

  return <OnboardingClient editId={editId} initialData={initialData} />;
}
