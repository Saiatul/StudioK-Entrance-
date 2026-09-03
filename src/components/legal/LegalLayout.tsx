import type { ReactNode } from "react";
import Link from "next/link";
import { StudioKWordmark } from "@/components/branding/StudioKMark";

export function LegalLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-6 py-10">
      <StudioKWordmark subtitle={title} />
      <article className="mt-8 space-y-4 rounded-[28px] bg-panel p-6 text-[17px] leading-relaxed text-cream/75">
        {children}
      </article>
      <Link
        href="/"
        className="mt-8 text-center text-[15px] font-medium text-gold"
      >
        Back to check-in
      </Link>
    </main>
  );
}
