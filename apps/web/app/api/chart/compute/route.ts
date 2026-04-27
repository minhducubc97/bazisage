import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { computeChart } from "@bazisage/bazi-core";
import type { BaziInput } from "@bazisage/bazi-core";
import { createClient } from "@/lib/supabase/server";

// POST /api/chart/compute
// Body: { birthDate, birthTime, birthLocationName, longitude, latitude, gender, timezone, utcOffsetMinutes }
// Returns: { chartId, chart }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      birthDate: string;
      birthTime: string | null;
      birthLocationName: string;
      longitude: number;
      latitude: number;
      gender: "M" | "F";
      timezone: string;
      utcOffsetMinutes: number;
      subjectName?: string;
    };

    // Validate required fields
    const required = ["birthDate", "birthLocationName", "longitude", "latitude", "gender", "timezone"] as const;
    for (const field of required) {
      if (body[field] === undefined || body[field] === null || body[field] === "") {
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
      const { data, error } = await supabase
        .from("bazi_charts")
        .insert({
          owner_id: user.id,
          subject_name: body.subjectName ?? "Me",
          birth_date: body.birthDate,
          birth_time: body.birthTime,
          birth_location_name: body.birthLocationName,
          birth_longitude: body.longitude,
          birth_latitude: body.latitude,
          birth_gender: body.gender,
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
        })
        .select("id")
        .single();

      if (!error && data) {
        chartId = data.id as string;
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
