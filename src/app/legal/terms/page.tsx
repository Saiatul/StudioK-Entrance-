import { LegalLayout } from "@/components/legal/LegalLayout";

export default function TermsPage() {
  return (
    <LegalLayout title="Terms & Conditions">
      <p>
        By registering at this StudioK event, you confirm that the information you
        provide is accurate and that you are attending as a guest of the selected host.
      </p>
      <p>
        StudioK may use your registration details for check-in, security, badge
        printing, and event operations.
      </p>
      <p>
        StudioK may refuse or revoke entry if information is incomplete, inaccurate,
        or if venue rules are not followed.
      </p>
    </LegalLayout>
  );
}
