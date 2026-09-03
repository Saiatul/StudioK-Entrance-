export type Country = {
  name: string;
  iso: string;
  dial: string;
};

export const COUNTRIES: Country[] = [
  { name: "India", iso: "IN", dial: "+91" },
  { name: "United Arab Emirates", iso: "AE", dial: "+971" },
  { name: "United States", iso: "US", dial: "+1" },
  { name: "United Kingdom", iso: "GB", dial: "+44" },
  { name: "Singapore", iso: "SG", dial: "+65" },
  { name: "Australia", iso: "AU", dial: "+61" },
  { name: "Canada", iso: "CA", dial: "+1" },
  { name: "Germany", iso: "DE", dial: "+49" },
  { name: "France", iso: "FR", dial: "+33" },
  { name: "Japan", iso: "JP", dial: "+81" },
  { name: "Nepal", iso: "NP", dial: "+977" },
  { name: "Bangladesh", iso: "BD", dial: "+880" },
  { name: "Sri Lanka", iso: "LK", dial: "+94" },
  { name: "Pakistan", iso: "PK", dial: "+92" },
  { name: "Saudi Arabia", iso: "SA", dial: "+966" },
  { name: "Qatar", iso: "QA", dial: "+974" },
  { name: "Kuwait", iso: "KW", dial: "+965" },
  { name: "Oman", iso: "OM", dial: "+968" },
  { name: "Bahrain", iso: "BH", dial: "+973" },
  { name: "Malaysia", iso: "MY", dial: "+60" },
  { name: "Indonesia", iso: "ID", dial: "+62" },
  { name: "Thailand", iso: "TH", dial: "+66" },
  { name: "China", iso: "CN", dial: "+86" },
  { name: "Hong Kong", iso: "HK", dial: "+852" },
  { name: "South Korea", iso: "KR", dial: "+82" },
  { name: "Philippines", iso: "PH", dial: "+63" },
  { name: "Vietnam", iso: "VN", dial: "+84" },
  { name: "New Zealand", iso: "NZ", dial: "+64" },
  { name: "Ireland", iso: "IE", dial: "+353" },
  { name: "Netherlands", iso: "NL", dial: "+31" },
  { name: "Spain", iso: "ES", dial: "+34" },
  { name: "Italy", iso: "IT", dial: "+39" },
  { name: "Portugal", iso: "PT", dial: "+351" },
  { name: "Switzerland", iso: "CH", dial: "+41" },
  { name: "Sweden", iso: "SE", dial: "+46" },
  { name: "Brazil", iso: "BR", dial: "+55" },
  { name: "South Africa", iso: "ZA", dial: "+27" },
  { name: "Nigeria", iso: "NG", dial: "+234" },
  { name: "Kenya", iso: "KE", dial: "+254" },
  { name: "Egypt", iso: "EG", dial: "+20" },
  { name: "Turkey", iso: "TR", dial: "+90" },
  { name: "Russia", iso: "RU", dial: "+7" },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

export function findCountryByDial(dial: string): Country | undefined {
  return COUNTRIES.find((country) => country.dial === dial);
}
