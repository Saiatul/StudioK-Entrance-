"use client";

import { useEffect, useRef, useState } from "react";
import { CountrySelect } from "@/components/registration/CountrySelect";
import { HostSelect } from "@/components/registration/HostSelect";
import { RoleSelect } from "@/components/registration/RoleSelect";
import { LegalCheckbox } from "@/components/registration/LegalCheckbox";
import { LegalDialog, type LegalDoc } from "@/components/registration/LegalDialog";
import { SuccessScreen } from "@/components/registration/SuccessScreen";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { DEFAULT_COUNTRY, type Country } from "@/lib/countries";
import { getPrintService } from "@/lib/printer/print-service";
import { userMessageForPrinterError } from "@/lib/printer/types";
import { validateRegistration } from "@/lib/validation/registration";
import type { FieldErrors, Registration } from "@/types/registration";

type Screen = "form" | "success";
type PrintPhase = "printing" | "printed" | "print-failed";

const RESET_DELAY_MS = 4500;

export function RegistrationForm() {
  const [name, setName] = useState("");
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [host, setHost] = useState("");
  const [role, setRole] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [screen, setScreen] = useState<Screen>("form");
  const [saved, setSaved] = useState<Registration | null>(null);
  const [printPhase, setPrintPhase] = useState<PrintPhase>("printing");
  const [printError, setPrintError] = useState("");
  const [retrying, setRetrying] = useState(false);
  const inFlight = useRef(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
    };
  }, []);

  function resetForm() {
    setName("");
    setCountry(DEFAULT_COUNTRY);
    setMobile("");
    setEmail("");
    setHost("");
    setRole("");
    setLegalAccepted(false);
    setErrors({});
    setSaved(null);
    setPrintPhase("printing");
    setPrintError("");
    setScreen("form");
  }

  function scheduleReset() {
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(resetForm, RESET_DELAY_MS);
  }

  async function printBadge(registration: Registration) {
    try {
      await getPrintService().printGuestBadge({
        id: registration.id,
        name: registration.name,
        role: registration.role,
      });
      setPrintPhase("printed");
      setPrintError("");
      scheduleReset();
    } catch (error) {
      setPrintPhase("print-failed");
      setPrintError(
        `Registration saved successfully, but the badge could not be printed. ${userMessageForPrinterError(error)}`,
      );
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;

    const parsed = validateRegistration({
      name,
      country_code: country.dial,
      mobile,
      email,
      host,
      role,
      legal_accepted: legalAccepted,
    });

    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setErrors({
        form: "An internet connection is required to save this registration.",
      });
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    setErrors({});

    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const payload = (await response.json()) as Registration & {
        error?: string;
        fieldErrors?: FieldErrors;
      };

      if (!response.ok) {
        setErrors(
          payload.fieldErrors ?? {
            form: payload.error || "Unable to complete registration. Please try again.",
          },
        );
        return;
      }

      setSaved(payload);
      setScreen("success");
      setPrintPhase("printing");
      await printBadge(payload);
    } catch {
      setErrors({
        form: "Unable to complete registration. Please try again.",
      });
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  async function onRetryPrint() {
    if (!saved || retrying) return;
    setRetrying(true);
    await printBadge(saved);
    setRetrying(false);
  }

  if (screen === "success" && saved) {
    return (
      <SuccessScreen
        name={saved.name}
        phase={printPhase}
        printError={printError}
        retrying={retrying}
        onDone={resetForm}
        onRetry={onRetryPrint}
      />
    );
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field
          id="name"
          label="Name"
          value={name}
          autoComplete="name"
          placeholder="Guest name"
          error={errors.name}
          onChange={(event) => setName(event.target.value)}
        />

        <RoleSelect value={role} onChange={setRole} error={errors.role} />

        <div>
          <span className="field-label">Mobile number</span>
          <div className="relative z-10 flex gap-3">
            <CountrySelect
              value={country}
              onChange={setCountry}
              error={errors.mobile}
            />
            <input
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="Mobile number"
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
              className={`field-control min-w-0 flex-1 ${
                errors.mobile ? "border-rose-400/70" : ""
              }`}
            />
          </div>
          {errors.mobile ? (
            <p className="mt-2 text-[15px] text-rose-300">{errors.mobile}</p>
          ) : null}
        </div>

        <Field
          id="email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="name@email.com"
          value={email}
          error={errors.email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <HostSelect value={host} onChange={setHost} error={errors.host} />

        <LegalCheckbox
          checked={legalAccepted}
          onChange={setLegalAccepted}
          onOpenDoc={setLegalDoc}
          error={errors.legal}
        />

        {errors.form ? (
          <p className="text-center text-[15px] text-rose-300">{errors.form}</p>
        ) : null}

        <Button type="submit" loading={submitting} className="mt-2">
          Register
        </Button>
      </form>

      <LegalDialog doc={legalDoc} onClose={() => setLegalDoc(null)} />
    </>
  );
}
