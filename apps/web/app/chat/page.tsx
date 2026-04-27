import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ChatClient from "./ChatClient";

export const metadata: Metadata = { title: "Chat with Your Grandmaster" };

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ chartId?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?redirectTo=/chat");

  const { chartId } = await searchParams;

  // Use specified chart or fall back to primary
  let resolvedChartId = chartId;
  if (!resolvedChartId) {
    const { data } = await supabase
      .from("bazi_charts")
      .select("id")
      .eq("owner_id", user.id)
      .eq("is_primary", true)
      .single();
    resolvedChartId = data?.id as string | undefined;
  }

  if (!resolvedChartId) redirect("/onboarding");

  // Load chart summary
  const { data: chart } = await supabase
    .from("bazi_charts")
    .select("id, subject_name, day_master, day_master_element, day_master_strength, chart_data")
    .eq("id", resolvedChartId)
    .eq("owner_id", user.id)
    .single();

  if (!chart) redirect("/dashboard");

  // Get or create a chat session (enforcing a 24-hour clean slate rule)
  let sessionId: string;
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: existing } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("chart_id", resolvedChartId)
    .gte("last_message_at", twentyFourHoursAgo)
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    sessionId = existing.id as string;
  } else {
    const { data: newSession } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: user.id,
        chart_id: resolvedChartId,
        title: `Chat with ${chart.subject_name as string}`,
      })
      .select("id")
      .single();
    sessionId = newSession!.id as string;
  }

  // Load recent messages
  const { data: recentMessages } = await supabase
    .from("chat_messages")
    .select("id, role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(40);

  return (
    <ChatClient
      chartId={resolvedChartId}
      sessionId={sessionId}
      chartSummary={{
        dayMaster: chart.day_master as string,
        dayMasterElement: chart.day_master_element as string,
        dayMasterStrength: chart.day_master_strength as string,
        subjectName: chart.subject_name as string,
      }}
      initialMessages={(recentMessages ?? []).map(m => ({
        id: m.id as string,
        role: m.role as "user" | "assistant",
        content: m.content as string,
      }))}
    />
  );
}
