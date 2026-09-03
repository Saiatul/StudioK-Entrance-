import {
  HOSTS,
  ROLES,
  type FieldErrors,
  type RegistrationInput,
} from "@/types/registration";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DIAL_PATTERN = /^\+\d{1,4}$/;

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function validateRegistration(
  input: Partial<RegistrationInput>,
): { ok: true; data: RegistrationInput } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};

  const name = typeof input.name === "string" ? input.name.trim() : "";
  const countryCode =
    typeof input.country_code === "string" ? input.country_code.trim() : "";
  const mobile = typeof input.mobile === "string" ? input.mobile.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const host = typeof input.host === "string" ? input.host.trim() : "";
  const role = typeof input.role === "string" ? input.role.trim() : "";
  const legalAccepted = input.legal_accepted === true;

  if (!name) {
    errors.name = "Please enter your name.";
  } else if (name.length > 120) {
    errors.name = "Please enter a shorter name.";
  }

  if (!DIAL_PATTERN.test(countryCode)) {
    errors.mobile = "Please enter a valid mobile number.";
  }

  const mobileDigits = digitsOnly(mobile);
  if (!mobile || mobileDigits.length < 6 || mobileDigits.length > 15) {
    errors.mobile = "Please enter a valid mobile number.";
  }

  if (!email || !EMAIL_PATTERN.test(email) || email.length > 254) {
    errors.email = "Please enter a valid email address.";
  }

  if (!host || !HOSTS.includes(host as (typeof HOSTS)[number])) {
    errors.host = "Please select a host.";
  }

  if (!role || !ROLES.includes(role as (typeof ROLES)[number])) {
    errors.role = "Please select a role.";
  }

  if (!legalAccepted) {
    errors.legal =
      "You must agree to the Terms & Conditions, Privacy Policy and Liability Waiver.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      name,
      country_code: countryCode,
      mobile,
      email,
      host,
      role,
      legal_accepted: true,
    },
  };
}
