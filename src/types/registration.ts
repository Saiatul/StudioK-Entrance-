export const HOSTS = ["Amir Khan", "Prince Sah"] as const;
export type Host = (typeof HOSTS)[number];

export type RegistrationInput = {
  name: string;
  country_code: string;
  mobile: string;
  email: string;
  host: string;
  legal_accepted: boolean;
};

export type Registration = RegistrationInput & {
  id: number;
  registered_at: string;
};

export type FieldErrors = Partial<
  Record<"name" | "mobile" | "email" | "host" | "legal" | "form", string>
>;
