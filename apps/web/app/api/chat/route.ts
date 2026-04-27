import { streamText } from "ai";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getModel, buildGrandmasterSystemPrompt } from "@bazisage/ai-client";
import type { BaziChart } from "@bazisage/bazi-core";

// POST /api/chat
// Body: { sessionId, chartId, messages: [{role, content}] }
// Streams assistant response as SSE

export const maxDuration = 60; // Vercel: allow up to 60s for streaming

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as {
    sessionId: string;
    chartId: string;
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  };

  // Load the chart + validate ownership
  const { data: chartRow } = await supabase
    .from("bazi_charts")
    .select("chart_data, subject_name, birth_date")
    .eq("id", body.chartId)
    .eq("owner_id", user.id)
    .single();

  if (!chartRow) {
    return NextResponse.json({ error: "Chart not found" }, { status: 404 });
  }

  const chart = chartRow.chart_data as BaziChart;

  // Load user memories for context injection
  const { data: memories } = await supabase
    .from("user_memories")
    .select("kind, content")
    .eq("user_id", user.id)
    .order("importance", { ascending: false })
    .limit(10);

  // Load profile for display name
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const userName = profile?.display_name
    ?? (chartRow.subject_name as string)
    ?? "friend";

  const systemPrompt = buildGrandmasterSystemPrompt(
    chart,
    userName,
    chartRow.birth_date as string,
    memories ?? [],
    new Date().toISOString().split("T")[0]
  );

  // Stream the response
  const result = streamText({
    model: getModel("main"),
    system: systemPrompt,
    messages: body.messages,
    maxTokens: 1024,
    temperature: 0.7,
    onFinish: async ({ text, usage }) => {
      // Persist both the user message and assistant response
      const lastUserMsg = body.messages[body.messages.length - 1];
      if (lastUserMsg?.role === "user") {
        await supabase.from("chat_messages").insert([
          {
            session_id: body.sessionId,
            role: "user",
            content: lastUserMsg.content,
          },
          {
            session_id: body.sessionId,
            role: "assistant",
            content: text,
            input_tokens: usage?.promptTokens,
            output_tokens: usage?.completionTokens,
          },
        ]);

        // Update session message count + last_message_at
        const { data: session } = await supabase
          .from("chat_sessions")
          .select("message_count")
          .eq("id", body.sessionId)
          .single();

        await supabase
          .from("chat_sessions")
          .update({
            message_count: (session?.message_count ?? 0) + 2,
            last_message_at: new Date().toISOString(),
          })
          .eq("id", body.sessionId);
      }
    },
  });

  return result.toDataStreamResponse();
}
