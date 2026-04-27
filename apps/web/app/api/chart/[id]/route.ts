import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Verify ownership
    const { data: chart } = await supabase
      .from("bazi_charts")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (!chart || chart.owner_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Soft delete
    const { error } = await supabase
      .from("bazi_charts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/chart/[id]] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
