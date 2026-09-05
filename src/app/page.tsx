import { StudioKWordmark } from "@/components/branding/StudioKMark";
import { PrinterStatusChip } from "@/components/printer/PrinterStatusChip";
import { RegistrationForm } from "@/components/registration/RegistrationForm";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-6 py-10">
      <header className="mb-8 flex flex-col items-center">
        <div className="relative w-full">
          <div className="absolute right-0 top-0">
            <PrinterStatusChip />
          </div>
          <StudioKWordmark />
        </div>

        <h1 className="mt-6 text-center text-[28px] font-semibold tracking-tight text-cream sm:text-[32px]">
          Welcome to StudioK Residency
        </h1>
        <p className="mt-3 max-w-md text-center text-[16px] leading-relaxed text-cream/55">
          Please check in below to register and print your badge.
        </p>
      </header>

      <section className="rounded-[28px] bg-panel p-6 sm:p-8">
        <RegistrationForm />
      </section>
    </main>
  );
}
