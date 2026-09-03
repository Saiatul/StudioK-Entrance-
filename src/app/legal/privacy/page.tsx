import { LegalLayout } from "@/components/legal/LegalLayout";

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>
        We collect your name, mobile number, email address, host, and the time of
        registration.
      </p>
      <p>
        This information is stored in StudioK’s event registration database and used
        only for this event’s operations, communication, and safety.
      </p>
      <p>
        We do not sell your information. Access is limited to StudioK staff and
        systems required to run registration and check-in.
      </p>
    </LegalLayout>
  );
}
