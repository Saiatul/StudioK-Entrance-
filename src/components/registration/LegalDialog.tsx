"use client";

export type LegalDoc = "terms" | "privacy" | "liability";

const DOCUMENTS: Record<LegalDoc, { title: string; body: string[] }> = {
  terms: {
    title: "Terms & Conditions",
    body: [
      "By registering at this StudioK event, you confirm that the information you provide is accurate and that you are attending as a guest of the selected host.",
      "StudioK may use your registration details for check-in, security, badge printing, and event operations.",
      "StudioK may refuse or revoke entry if information is incomplete, inaccurate, or if venue rules are not followed.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      "We collect your name, mobile number, email address, host, and the time of registration.",
      "This information is stored in StudioK’s event registration database and used only for this event’s operations, communication, and safety.",
      "We do not sell your information. Access is limited to StudioK staff and systems required to run registration and check-in.",
    ],
  },
  liability: {
    title: "Liability Waiver",
    body: [
      "You acknowledge that you are entering a live event space and agree to follow all venue, safety, and staff instructions.",
      "To the fullest extent permitted by law, you release StudioK, its hosts, and its staff from claims arising from ordinary event participation, except in cases of willful misconduct.",
      "If you do not agree, do not complete registration or enter the event.",
    ],
  },
};

export function LegalDialog({
  doc,
  onClose,
}: {
  doc: LegalDoc | null;
  onClose: () => void;
}) {
  if (!doc) return null;
  const content = DOCUMENTS[doc];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="max-h-[82dvh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-line bg-panel p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl text-cream">{content.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 px-3 text-sm tracking-[0.2em] text-gold uppercase"
          >
            Close
          </button>
        </div>
        <div className="space-y-4 text-lg leading-relaxed text-cream/80">
          {content.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
