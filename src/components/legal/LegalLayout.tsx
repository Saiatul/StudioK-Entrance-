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
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 py-8">
      <StudioKWordmark subtitle={title} />
      <article className="mt-8 space-y-4 rounded-[32px] border border-line bg-panel/80 p-6 text-lg leading-relaxed text-cream/80">
        {children}
      </article>
      <Link
        href="/"
        className="mt-8 text-center text-sm tracking-[0.22em] text-gold uppercase"
      >
        Back to check-in
      </Link>
    </main>
  );
}
