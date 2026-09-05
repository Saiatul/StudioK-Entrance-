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
    const result = await deleteHost(id);
    if (!result.ok && result.reason === "protected") {
      return NextResponse.json(
        {
          error:
            "Amir and Prince cannot be deleted. Only they have admin access.",
        },
        { status: 403 },
      );
    }
    if (!result.ok) {
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
