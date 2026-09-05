import { NextRequest, NextResponse } from "next/server";
import { deleteHost } from "@/lib/db/hosts";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid host id." }, { status: 400 });
  }

  try {
    const deleted = await deleteHost(id);
    if (!deleted) {
      return NextResponse.json({ error: "Host not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin delete host failed:", error);
    return NextResponse.json(
      { error: "Unable to delete host." },
      { status: 503 },
    );
  }
}
