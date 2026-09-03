import { NextRequest, NextResponse } from "next/server";

/**
 * Simple in-memory print queue.
 * POST: PWA adds a job.  GET: Android app polls & picks up jobs.
 */
type PrintJob = { name: string; role: string; ts: number };

const queue: PrintJob[] = [];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const job: PrintJob = {
    name: body.name ?? "GUEST",
    role: body.role ?? "",
    ts: Date.now(),
  };
  queue.push(job);
  return NextResponse.json({ ok: true, queued: queue.length });
}

export async function GET() {
  // Return and drain all pending jobs
  const jobs = queue.splice(0, queue.length);
  return NextResponse.json({ jobs });
}
