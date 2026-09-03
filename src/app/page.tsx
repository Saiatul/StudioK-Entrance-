import { StudioKWordmark } from "@/components/branding/StudioKMark";
import { PrinterStatusChip } from "@/components/printer/PrinterStatusChip";
import { RegistrationForm } from "@/components/registration/RegistrationForm";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-6 py-10">
      <header className="mb-8 flex flex-col items-center gap-5">
        <StudioKWordmark subtitle="Check-in" />
        <PrinterStatusChip />
      </header>

      <section className="rounded-[28px] bg-panel p-6 sm:p-8">
        <RegistrationForm />
      </section>
    </main>
  );
}
