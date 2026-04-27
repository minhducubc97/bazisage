import { NextRequest } from "next/server";
import { streamText, tool } from "ai";
import { getModel, buildOverviewSystemPrompt } from "@bazisage/ai-client";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { chartId } = await req.json();

    if (!chartId) {
      return new Response("Missing chartId", { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Fetch the chart
    const { data: chartRow, error } = await supabase
      .from("bazi_charts")
      .select("*")
      .eq("id", chartId)
      .eq("owner_id", user.id)
      .single();

    if (error || !chartRow) {
      return new Response("Chart not found", { status: 404 });
    }

    const systemPrompt = buildOverviewSystemPrompt(
      chartRow.chart_data as any,
      chartRow.subject_name as string,
      chartRow.birth_date as string
    );

    const result = streamText({
      model: getModel("main"),
      system: systemPrompt,
      prompt: "Generate the initial life overview.",
      onFinish: async ({ text, usage }) => {
        const adminClient = createAdminClient();
        await adminClient.from("readings").insert({
          chart_id: chartId,
          reading_type: "full",
          content: text,
          model_used: "main",
          input_tokens: usage.promptTokens,
          output_tokens: usage.completionTokens,
        });
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error generating reading:", error);
    return new Response("Error generating reading", { status: 500 });
  }
}
