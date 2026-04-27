import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { computeChart } from "@bazisage/bazi-core";
import type { BaziInput } from "@bazisage/bazi-core";
import { createClient } from "@/lib/supabase/server";

// POST /api/chart/compute
// Body: { birthDate, birthTime, birthLocationName, longitude, latitude, gender,
//         timezone, utcOffsetMinutes, subjectName?, id? }
// Returns: { chartId, chart, warnings, persisted }

interface ComputeRequestBody {
  birthDate: string;
  birthTime: string | null;
  birthLocationName: string;
  longitude: number;
  latitude: number;
  gender: "M" | "F";
  timezone: string;
  utcOffsetMinutes: number;
  subjectName?: string;
  id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ComputeRequestBody;

    // Validate required fields
    const required = [
      "birthDate", "birthLocationName", "longitude",
      "latitude", "gender", "timezone",
    ] as const;
    for (const field of required) {
      const v = body[field];
      if (v === undefined || v === null || v === "") {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const input: BaziInput = {
      birthDate: body.birthDate,
      birthTime: body.birthTime ?? null,
      birthLocationName: body.birthLocationName,
      longitude: body.longitude,
      latitude: body.latitude,
      gender: body.gender,
    };

    // Compute chart — deterministic, no side effects
    const { chart, warnings } = computeChart(
      input,
      body.timezone,
      body.utcOffsetMinutes ?? 0
    );

    // If user is authenticated, persist the chart to Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let chartId: string | null = null;

    if (user) {
      const payload = {
        subject_name: body.subjectName ?? "Me",
        birth_date: body.birthDate,
        birth_time: body.birthTime,
        birth_location_name: body.birthLocationName,
        birth_longitude: body.longitude,
        birth_latitude: body.latitude,
        birth_gender: body.gender,
        birth_hour_branch: chart.hourPillar?.branch ?? null,
        timezone: body.timezone,
        utc_offset_minutes: body.utcOffsetMinutes ?? 0,
        true_solar_offset_minutes: chart.trueSolarOffsetMinutes,
        day_master: chart.dayMaster,
        day_master_element: chart.dayMasterElement,
        day_master_strength: chart.dayMasterStrength,
        useful_god: chart.usefulGod,
        chart_data: chart,
        mode: chart.mode,
        relationship: "self",
        is_primary: true,
      };

      const isUpdate = Boolean(body.id);

      const query = isUpdate
        ? supabase
            .from("bazi_charts")
            .update(payload)
            .eq("id", body.id!)
            .eq("owner_id", user.id)
            .select("id")
            .single()
        : supabase
            .from("bazi_charts")
            .insert({ ...payload, owner_id: user.id })
            .select("id")
            .single();

      const { data, error } = await query;

      if (error) {
        console.error("[/api/chart/compute] persist error:", error);
      } else if (data) {
        chartId = data.id as string;

        // On update: invalidate caches that depend on the chart shape.
        // Owner-DELETE policies are granted in migration 002, so no admin
        // client needed. chat_sessions has ON DELETE CASCADE on chart_id
        // (also migration 002), so deleting the chart elsewhere will tear
        // down conversation history; here we only need to wipe AI caches.
        if (isUpdate) {
          await Promise.all([
            supabase.from("readings").delete().eq("chart_id", chartId),
            supabase.from("monthly_briefings").delete().eq("chart_id", chartId),
            supabase.from("personal_day_alerts").delete().eq("chart_id", chartId),
          ]);

          // Also wipe chat sessions so the Grandmaster doesn't reference
          // a now-stale chart in its memory.
          await supabase.from("chat_sessions").delete().eq("chart_id", chartId);
        }
      }
    }

    return NextResponse.json({
      chartId,
      chart,
      warnings,
      persisted: chartId !== null,
    });
  } catch (err) {
    console.error("[/api/chart/compute]", err);
    return NextResponse.json(
      { error: "Chart computation failed" },
      { status: 500 }
    );
  }
}
