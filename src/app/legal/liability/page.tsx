import { LegalLayout } from "@/components/legal/LegalLayout";

export default function LiabilityPage() {
  return (
    <LegalLayout title="Liability Waiver">
      <p>
        You acknowledge that you are entering a live event space and agree to follow
        all venue, safety, and staff instructions.
      </p>
      <p>
        To the fullest extent permitted by law, you release StudioK, its hosts, and
        its staff from claims arising from ordinary event participation, except in
        cases of willful misconduct.
      </p>
      <p>If you do not agree, do not complete registration or enter the event.</p>
    </LegalLayout>
  );
}
