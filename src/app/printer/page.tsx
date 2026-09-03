import Link from "next/link";
import { StudioKWordmark } from "@/components/branding/StudioKMark";
import { PrinterTestPanel } from "@/components/printer/PrinterTestPanel";

export default function PrinterPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 py-8 sm:px-8">
      <header className="mb-8 flex flex-col items-center gap-5">
        <StudioKWordmark subtitle="Printer Test" />
        <Link
          href="/"
          className="min-h-12 text-sm tracking-[0.22em] text-gold uppercase"
        >
          Back to check-in
        </Link>
      </header>
      <section className="rounded-[32px] border border-line bg-panel/80 p-5 sm:p-8">
        <PrinterTestPanel />
      </section>
    </main>
  );
}
