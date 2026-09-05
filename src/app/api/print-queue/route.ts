import { NextRequest, NextResponse } from "next/server";
import { claimPrintJobs, enqueuePrintJob } from "@/lib/db/print-jobs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const job = await enqueuePrintJob(
      String(body.name ?? "GUEST"),
      String(body.role ?? ""),
    );
    return NextResponse.json({ ok: true, job });
  } catch (error) {
    console.error("print-queue POST failed", error);
    return NextResponse.json(
      { error: "Failed to queue print job" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const jobs = await claimPrintJobs();
    return NextResponse.json({
      jobs: jobs.map((j) => ({ name: j.name, role: j.role, id: j.id })),
    });
  } catch (error) {
    console.error("print-queue GET failed", error);
    return NextResponse.json({ jobs: [] }, { status: 500 });
  }
}
