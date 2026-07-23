/**
 * A dictionary-based i18n architecture: one flat key → { en, hi } record. `CitizenProfile.preferredLanguage`
 * (see prisma/schema.prisma) drives which string is shown. Extending to more Indian languages later
 * means adding a new key to each entry below, not rearchitecting — see docs/ACCESSIBILITY.md.
 *
 * Full-coverage scope (matches the "golden journey" commitment in docs/ASSUMPTIONS_AND_LIMITATIONS.md):
 * navigation, the home dashboard's headline and attention items, profile discrepancies, the
 * address-change life event screen, the request builder and request-status screen, consent
 * confirmation, and deficiency response. Everything outside that journey still renders in
 * English — this is deliberate, incremental coverage, not a claim that the whole app is localised.
 */
export type Locale = "en" | "hi";

export const dictionary = {
  // Navigation
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
  nav_assistant: { en: "Life Admin Assistant", hi: "जीवन प्रबंधन सहायक" },
  nav_help: { en: "Help & Grievances", hi: "सहायता व शिकायतें" },
  nav_consent: { en: "Privacy & Consent", hi: "गोपनीयता व सहमति" },
  nav_settings: { en: "Settings", hi: "सेटिंग्स" },

  // Home dashboard
  home_welcome_back: { en: "Welcome back", hi: "वापसी पर स्वागत है" },
  home_subtitle: { en: "Here's what needs your attention today.", hi: "आज आपको इन बातों पर ध्यान देना है।" },
  home_needs_attention: { en: "Needs attention", hi: "ध्यान देने योग्य" },
  home_unread_inbox: { en: "Unread inbox", hi: "अपठित इनबॉक्स" },
  home_active_trusted_contacts: { en: "Active Trusted Contacts", hi: "सक्रिय विश्वसनीय संपर्क" },
  home_life_events_in_progress: { en: "Life events in progress", hi: "प्रगति में जीवन की घटनाएँ" },
  home_recent_requests: { en: "Recent requests", hi: "हाल के अनुरोध" },

  // Profile discrepancies
  profile_title: { en: "My Profile", hi: "मेरी प्रोफ़ाइल" },
  profile_subtitle: {
    en: "Your master profile — not itself an official record, but the one place that shows how your identity looks across every connected source.",
    hi: "आपकी मुख्य प्रोफ़ाइल — यह स्वयं कोई आधिकारिक दस्तावेज़ नहीं है, लेकिन यह एक ही जगह दिखाती है कि हर जुड़े हुए स्रोत में आपकी पहचान कैसी दिखती है।",
  },
  profile_consistency_tab: { en: "Profile consistency", hi: "प्रोफ़ाइल स्थिरता" },
  profile_records_tab: { en: "Identity records", hi: "पहचान अभिलेख" },
  profile_differs_across_sources: { en: "differs across sources", hi: "स्रोतों में भिन्न है" },
  profile_no_discrepancies: { en: "No discrepancies detected across your connected sources.", hi: "आपके जुड़े हुए स्रोतों में कोई भिन्नता नहीं मिली।" },

  // Address-change life event
  life_event_address_title: { en: "Moving to a new address", hi: "नए पते पर स्थानांतरण" },
  life_event_progress_note: {
    en: "progress is derived from each institution's actual request status, not a checkbox",
    hi: "प्रगति प्रत्येक संस्था की वास्तविक अनुरोध स्थिति से तय होती है, किसी चेकबॉक्स से नहीं",
  },
  life_event_affected_institutions: { en: "Affected institutions & actions", hi: "प्रभावित संस्थाएँ व कार्य" },
  life_event_complete_now: { en: "Complete now", hi: "अभी पूर्ण करें" },
  life_event_start_integration: { en: "Start via integration", hi: "एकीकरण द्वारा शुरू करें" },
  life_event_submit_for_review: { en: "Submit for institution review", hi: "संस्था समीक्षा हेतु भेजें" },
  life_event_view_progress: { en: "View progress", hi: "प्रगति देखें" },
  life_event_i_completed_this: { en: "I've completed this", hi: "मैंने यह पूर्ण कर लिया है" },
  life_event_reference_number: { en: "Reference number", hi: "संदर्भ संख्या" },
  life_event_completed_on: { en: "Completed on", hi: "पूर्ण होने की तिथि" },

  // Request builder / status
  request_new_title: { en: "Start a new request", hi: "नया अनुरोध शुरू करें" },
  request_step_service: { en: "Service and institution", hi: "सेवा और संस्था" },
  request_step_evidence: { en: "Evidence", hi: "साक्ष्य" },
  request_step_consent: { en: "Consent", hi: "सहमति" },
  request_create_draft: { en: "Create draft request", hi: "मसौदा अनुरोध बनाएँ" },
  request_status_timeline: { en: "Status timeline", hi: "स्थिति समयरेखा" },
  request_submit: { en: "Submit this request", hi: "यह अनुरोध सबमिट करें" },
  request_action_needed: { en: "Action needed", hi: "कार्रवाई आवश्यक" },
  request_respond: { en: "Submit response", hi: "प्रतिक्रिया सबमिट करें" },

  // Generic
  cta_view_details: { en: "View details", hi: "विवरण देखें" },
  cta_start: { en: "Get started", hi: "शुरू करें" },
  demo_data: { en: "Demo data", hi: "डेमो डेटा" },
  sign_out: { en: "Sign out", hi: "साइन आउट करें" },
} as const;

export type DictionaryKey = keyof typeof dictionary;

export function t(key: DictionaryKey, locale: Locale = "en"): string {
  return dictionary[key][locale] ?? dictionary[key].en;
}
