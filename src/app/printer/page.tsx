import Link from "next/link";
import { StudioKWordmark } from "@/components/branding/StudioKMark";
import { PrinterTestPanel } from "@/components/printer/PrinterTestPanel";

export default function PrinterPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-6 py-10">
      <header className="mb-8 flex flex-col items-center gap-4">
        <StudioKWordmark subtitle="Printer" />
        <Link href="/" className="min-h-11 text-[15px] font-medium text-gold">
          Back to check-in
        </Link>
      </header>
      <section className="rounded-[28px] bg-panel p-6 sm:p-8">
        <PrinterTestPanel />
      </section>
    </main>
  );
}
