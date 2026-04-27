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
  try {
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

    if (!body.sessionId || !body.chartId || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Load the chart + validate ownership
    const { data: chartRow, error: chartError } = await supabase
      .from("bazi_charts")
      .select("chart_data, subject_name, birth_date")
      .eq("id", body.chartId)
      .eq("owner_id", user.id)
      .single();

    if (chartError || !chartRow) {
      console.error("[/api/chat] Chart not found:", chartError);
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

    // Pass YYYY-MM-DD (not full ISO with hours) so the system prompt stays
    // identical for an entire calendar day. This maximises DeepSeek's
    // automatic context-cache hit rate — every request from the same user
    // within the same day reuses the cached prefix server-side.
    const today = new Date().toISOString().split("T")[0];
    const systemPrompt = buildGrandmasterSystemPrompt(
      chart,
      userName,
      chartRow.birth_date as string,
      memories ?? [],
      today
    );

    // Cap history at the last N turns. The chat page loader already trims
    // to 40 — defense in depth in case the endpoint is called directly.
    const HISTORY_CAP = 40;
    const trimmedMessages = body.messages.slice(-HISTORY_CAP);

    // Stream the response
    const result = streamText({
      model: getModel("main"),
      system: systemPrompt,
      messages: trimmedMessages,
      maxTokens: 4096,
      temperature: 0.7,
      onError: ({ error }) => {
        console.error("[/api/chat] streamText error:", error);
      },
      onFinish: async ({ text, usage }) => {
        // Persist in background — errors here must NOT crash the stream
        try {
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
                input_tokens: usage?.promptTokens ?? null,
                output_tokens: usage?.completionTokens ?? null,
              },
            ]);

            // Update session last_message_at (skip message_count to avoid race)
            await supabase
              .from("chat_sessions")
              .update({ last_message_at: new Date().toISOString() })
              .eq("id", body.sessionId);
          }
        } catch (persistErr) {
          // Log but don't surface — stream already completed successfully
          console.error("[/api/chat] Failed to persist messages:", persistErr);
        }
      },
    });

    return result.toDataStreamResponse({
      getErrorMessage: (err: any) => {
        // Map provider errors to stable, neutral codes the client can branch on.
        // Never leak provider names, account states, or internal infrastructure
        // details to end users.
        const raw = err?.message ?? String(err);

        if (raw.includes("Insufficient Balance") || raw.includes("insufficient_quota")) {
          return "AI_SERVICE_UNAVAILABLE";
        }
        if (err?.statusCode === 401 || err?.status === 401 || raw.includes("401")) {
          return "AI_AUTH_ERROR";
        }
        if (err?.statusCode === 429 || err?.status === 429 || raw.includes("rate_limit")) {
          return "AI_RATE_LIMITED";
        }

        // Log internally for debugging; surface a generic message to user.
        console.error("[/api/chat] unmapped provider error:", raw);
        return "AI_TEMPORARY_ERROR";
      }
    });

  } catch (err: any) {
    console.error("[/api/chat] Unhandled error:", err);
    if (err?.message?.includes("Insufficient Balance")) {
      return NextResponse.json(
        { error: "AI_SERVICE_UNAVAILABLE" },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
