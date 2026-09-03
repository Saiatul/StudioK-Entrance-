export const HOSTS = ["Amir Khan", "Prince Sah"] as const;
export type Host = (typeof HOSTS)[number];

export const ROLES = ["Investor", "Founder"] as const;
export type Role = (typeof ROLES)[number];

export type RegistrationInput = {
  name: string;
  country_code: string;
  mobile: string;
  email: string;
  host: string;
  role: string;
  legal_accepted: boolean;
};

export type Registration = RegistrationInput & {
  id: number;
  registered_at: string;
};

export type FieldErrors = Partial<
  Record<"name" | "mobile" | "email" | "host" | "role" | "legal" | "form", string>
>;
