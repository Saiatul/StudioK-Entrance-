import { StudioKWordmark } from "@/components/branding/StudioKMark";
import { PrinterStatusChip } from "@/components/printer/PrinterStatusChip";
import { RegistrationForm } from "@/components/registration/RegistrationForm";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 py-8 sm:px-8 sm:py-10">
      <header className="mb-8 flex flex-col items-center gap-5">
        <StudioKWordmark subtitle="Event Check-In" />
        <PrinterStatusChip />
      </header>

      <section className="rounded-[32px] border border-line bg-panel/80 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-8">
        <RegistrationForm />
      </section>
    </main>
  );
}
