/**
 * A dictionary-based i18n architecture: one flat key → { en, hi } record. `CitizenProfile.preferredLanguage`
 * (see prisma/schema.prisma) drives which string is shown. Extending to more Indian languages later
 * means adding a new key to each entry below, not rearchitecting — see docs/ACCESSIBILITY.md.
 *
 * This prototype translates the primary navigation and key surfaces into Hindi (not literally every
 * string in the app — see docs/ASSUMPTIONS_AND_LIMITATIONS.md for the honest scope note).
 */
export type Locale = "en" | "hi";

export const dictionary = {
  nav_home: { en: "Home", hi: "होम" },
  nav_profile: { en: "My Profile", hi: "मेरी प्रोफ़ाइल" },
  nav_institutions: { en: "My Institutions", hi: "मेरी संस्थाएँ" },
  nav_documents: { en: "Documents", hi: "दस्तावेज़" },
  nav_requests: { en: "Requests", hi: "अनुरोध" },
  nav_inbox: { en: "Inbox", hi: "इनबॉक्स" },
  nav_life_events: { en: "Life Events", hi: "जीवन की घटनाएँ" },
  nav_financial: { en: "Financial Administration", hi: "वित्तीय प्रबंधन" },
  nav_family_access: { en: "Family & Delegated Access", hi: "परिवार व प्रत्यायोजित पहुँच" },
  nav_legacy: { en: "Legacy & Succession", hi: "विरासत व उत्तराधिकार" },
  nav_help: { en: "Help & Grievances", hi: "सहायता व शिकायतें" },
  nav_consent: { en: "Privacy & Consent", hi: "गोपनीयता व सहमति" },
  nav_settings: { en: "Settings", hi: "सेटिंग्स" },
  cta_view_details: { en: "View details", hi: "विवरण देखें" },
  cta_start: { en: "Get started", hi: "शुरू करें" },
  demo_data: { en: "Demo data", hi: "डेमो डेटा" },
} as const;

export type DictionaryKey = keyof typeof dictionary;

export function t(key: DictionaryKey, locale: Locale = "en"): string {
  return dictionary[key][locale] ?? dictionary[key].en;
}
