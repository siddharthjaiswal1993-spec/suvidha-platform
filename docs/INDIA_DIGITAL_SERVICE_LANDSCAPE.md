# India Digital Service Landscape

## Why this document exists

Suvidha is a prototype. Its value as a portfolio piece depends entirely on never overstating what
actually exists in India's institutional and digital-government ecosystem. This document is the
single, comprehensive ground-truth reference for every real-world system, regulator, identifier,
and process that Suvidha's product design, seed data, and mock connectors are modelled on. It
supersedes any earlier draft that may have circulated under the name `INDIA_ECOSYSTEM_MATRIX.md` —
that file does not exist in this repository; this is the one document to maintain.

Every row below carries the same twelve attributes, a confidence rating, and a source. Where the
public record is ambiguous, contradictory, or simply thin (which is common — India's digital-
government landscape is large, unevenly documented, and changes frequently), this document says so
rather than smoothing it over. See `docs/OFFICIAL_SOURCES.md` for the full bibliography and
`docs/INTEGRATIONS.md` for how each of these maps onto Suvidha's actual `Connector` model and mock
adapters.

### How to read "Suvidha's prototype treatment"

Every entry is tagged with one of the six `Connector.integrationLabel` values from
`prisma/schema.prisma`. Working definitions (the schema enum names it but does not define them in
prose — this is the explicit, honest interpretation used consistently across this documentation
set):

| Label | Meaning as used here |
|---|---|
| `real_public_integration_documented` | A genuinely public, documented API/integration surface exists that an organisation can register for and use largely as published. |
| `regulated_partner_integration_required` | A real integration mechanism exists, but only for entities holding a specific regulatory licence/registration (e.g. AUA/KUA, NBFC-AA, CERSAI reporting entity, GSP, Depository Participant). |
| `institution_specific_integration_required` | No unified government-mandated API; a real integration would need bespoke, one-by-one agreements with each bank/insurer/AMC/employer. |
| `manual_assisted_workflow` | The authority offers a citizen self-service portal/app/form but no machine API for third parties; a real product would generate/pre-fill paperwork and guide the citizen through the official channel by hand. |
| `prototype_simulation` | No real integration is claimed or planned even in a production future; exists purely to demonstrate the product concept. |
| `future_policy_dependency` | The capability has no current legal/technical basis to exist as an automated third-party service; it would require a policy or regulatory change first. |

Confidence is rated **high** (multiple current official/.gov.in sources agree), **medium** (an
official source exists but is dated, incomplete, or corroborated mainly by secondary sources), or
**low** (best-available secondary-source understanding; treat as directionally correct, not exact).
Sources were checked in July 2026.

---

## 1. Civil registration & identity

### 1.1 Civil Registration System (CRS) — births & deaths

| Attribute | Detail |
|---|---|
| Authority / Regulator | Registrar General & Census Commissioner of India (RGI), Ministry of Home Affairs, operating through State Chief Registrars and local Registrars under the Registration of Births and Deaths Act, 1969. |
| Record / Service | Statutory registration of every birth and death in India; issuance of birth/death certificates. |
| Common identifiers | CRS registration number; informant's own ID for authentication when registering online. |
| Online self-service today | Report a death, upload supporting documents, and download a digitally signed (QR-coded) death certificate through the state-hosted CRS portal (`crsorgi.gov.in` and state-specific sub-domains); a subset of UTs/small states use a shared central portal at `dc.crsorgi.gov.in`, most large states run their own CRS front-end wired to the same national backend. |
| Public API? | No open third-party API. This is a citizen self-service and intra-government portal, not a published developer platform. |
| Nomination/succession facility | Not applicable — this is a record of the vital event, not an asset or account. |
| Typical required documents | Hospital/medical certification of cause of death (Form 4/4A) or informant declaration; identity proof of the informant; address proof. |
| Death-event propagation | Yes, in one direction and only recently: RGI shares death records from CRS with UIDAI to deactivate the deceased's Aadhaar (see 1.2). There is no general mechanism today by which a CRS death registration automatically reaches banks, insurers, EPFO, or other institutions — each still requires the certificate to be produced separately. |
| Data-sharing legal basis | Registration of Births and Deaths Act, 1969 (as amended 2023, enabling Aadhaar-seeding of registrations); DPDP Act, 2023 governs any further downstream sharing of the personal data collected. |
| Caveats / exceptions | Coverage, digitisation quality, and certificate turnaround vary significantly by state; some states still require in-person visits for anything beyond straightforward same-window registrations. |
| Suvidha's prototype treatment | `manual_assisted_workflow` for the citizen-facing "report a death" journey (Suvidha would generate a checklist and pre-filled informant form, not call an API); the death-registry *connector* that other modules key off is `prototype_simulation` — Suvidha simulates a registrar-verified death event and its downstream effects, because no real third-party access to live CRS/RGI data exists. |
| Confidence | Medium — the portal and process are well documented, but exact API/interoperability boundaries between state CRS instances and the RGI backend are not fully public. |
| Source | [Civil Registration System, RGI](https://dc.crsorgi.gov.in/crs/), [CRS – National Government Services Portal](https://services.india.gov.in/service/detail/civil-registration-system-crs-general-public-login-portal) — accessed July 2026. |

### 1.2 Aadhaar / UIDAI

| Attribute | Detail |
|---|---|
| Authority / Regulator | Unique Identification Authority of India (UIDAI), Ministry of Electronics & IT (MeitY), under the Aadhaar Act, 2016. |
| Record / Service | 12-digit biometric-linked identity number; demographic record; authentication/e-KYC services. |
| Common identifiers | Aadhaar number (masked to last 4 digits, "VID" virtual ID as a safer alternative). |
| Online self-service today | myAadhaar portal for address/demographic updates, download, and — new in 2025/26 — a "Reporting of Death of a Family Member" service that lets a relative report a death for Aadhaar records in the states/UTs whose CRS feeds are already linked to UIDAI. |
| Public API? | Partner-only. Aadhaar authentication/e-KYC APIs (OTP-based, biometric, offline XML) are only usable by organisations holding **AUA** (Authentication User Agency) or **KUA** (KYC User Agency) status, or operating as a registered sub-AUA/sub-KUA under one. UIDAI does not allow arbitrary commercial entities to connect directly. |
| Nomination/succession facility | Not applicable — Aadhaar is an identity credential, not an asset. |
| Typical required documents | Aadhaar number/VID plus OTP or biometric capture for authentication; death certificate for the death-reporting service. |
| Death-event propagation | Yes, and this is the most concrete real-world precedent for what Suvidha's product thesis is modelled on: RGI has shared roughly 1.55 crore CRS death records (from 24 states/UTs live on CRS) with UIDAI, resulting in deactivation of the corresponding Aadhaar numbers, and UIDAI has floated exploring sourcing death signals from banks and other Aadhaar ecosystem entities as well. This remains a UIDAI-RGI bilateral arrangement, not an open service any platform can subscribe to. |
| Data-sharing legal basis | Aadhaar (Targeted Delivery of Financial and Other Subsidies, Benefits and Services) Act, 2016; Aadhaar Authentication Regulations; DPDP Act, 2023 for downstream processing by AUAs/KUAs. |
| Caveats / exceptions | Aadhaar cannot legally be made mandatory for most private services (per the 2018 Supreme Court *Puttaswamy* judgment and subsequent amendments); Suvidha never asks for or stores an Aadhaar number, only a masked last-4-digit reference. |
| Suvidha's prototype treatment | `regulated_partner_integration_required` — a real production integration would require Suvidha (or a partner it contracts through) to hold AUA/KUA status; the prototype's `pan_verification`/identity-verification connector never calls anything real and is `prototype_simulation`. |
| Confidence | High for the authentication/AUA-KUA framework (well documented); medium for the exact current scope of the RGI-UIDAI death-linkage rollout, which is an evolving programme. |
| Source | [UIDAI Aadhaar e-KYC API specification](https://uidai.gov.in/en/ecosystem/authentication-devices-documents/archive-authentication-doc/16266-aadhaar-ekyc-api-2-5.html); [UIDAI/RGI death-record deactivation coverage, All India Radio/PIB](https://newsonair.gov.in/uidai-deactivates-1-17-cr-aadhaar-numbers-of-deceased-launches-online-death-reporting-service) — accessed July 2026. |

### 1.3 PAN / Income Tax Department

| Attribute | Detail |
|---|---|
| Authority / Regulator | Income Tax Department, Central Board of Direct Taxes (CBDT), Ministry of Finance. |
| Record / Service | Permanent Account Number (PAN); PAN validity/status verification. |
| Common identifiers | 10-character alphanumeric PAN. |
| Online self-service today | "Verify Your PAN" pre-login service on the e-Filing portal (`incometax.gov.in`) — enter PAN, name, date of birth, mobile number to check status; PAN surrender/deactivation for a deceased person is handled by the deceased's legal heir filing through the assessing officer/e-Filing portal, generally alongside closing out the final income-tax return. |
| Public API? | Partner-only/closed. The e-Filing portal documents API specifications, but these are for **ERIs** (Electronic Return Intermediaries) and other **specified/registered external agencies** logging in with credentials issued by the Department — not an open API for arbitrary consumer platforms. |
| Nomination/succession facility | Not applicable — PAN is a tax identifier, not an asset; on death, the legal representative registers as such on the e-Filing portal to file the deceased's final return. |
| Typical required documents | PAN card/number; for legal-representative registration: death certificate, legal heir/succession certificate, PAN of both deceased and legal heir. |
| Death-event propagation | No automatic propagation. PAN deactivation/legal-representative registration is a manual step the family must initiate; it is not triggered by a CRS death registration. |
| Data-sharing legal basis | Income Tax Act, 1961 (Section 139A and related PAN provisions); DPDP Act, 2023 for any downstream data handling by registered external agencies. |
| Caveats / exceptions | PAN itself is never deleted (unlike a bank account); a deceased person's PAN typically stays on record but is marked "deceased"/inactive for future filings. |
| Suvidha's prototype treatment | `regulated_partner_integration_required` for a hypothetical real bulk-verification integration (only available to specified/registered entities); the prototype's `pan_verification` connector is `prototype_simulation` — Suvidha never transmits, stores, or validates a real PAN. |
| Confidence | High for the self-service verification flow; medium for the exact API-access boundary for external agencies, which the public API-specifications page describes at a summary level only. |
| Source | [Income Tax e-Filing — Verify Your PAN](https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/verify-your-pan), [API Specifications, Income Tax e-Filing portal](https://www.incometax.gov.in/iec/foportal/api-specifications) — accessed July 2026. |

### 1.4 Electoral rolls / Election Commission of India (ECI)

| Attribute | Detail |
|---|---|
| Authority / Regulator | Election Commission of India (ECI), a constitutional body, under the Representation of the People Act, 1950/1951. |
| Record / Service | Electoral roll entry; Elector's Photo Identity Card (EPIC/Voter ID); deletion of deceased electors. |
| Common identifiers | 10-character EPIC number. |
| Online self-service today | National Voters' Service Portal (NVSP, now largely consolidated at `voters.eci.gov.in`) for new registration, correction, address transfer, and — relevantly — **Form 7** to report the death of a registered elector for roll deletion; application-status tracking by reference ID. |
| Public API? | No open third-party API. This is a citizen self-service portal; roll data is published for public search/download in bulk PDF form by constituency, not as a live API. |
| Nomination/succession facility | Not applicable. |
| Typical required documents | Death certificate (for Form 7 deletion by a family member/BLO-verified process); EPIC number or demographic search to locate the elector's roll entry. |
| Death-event propagation | No automatic propagation from CRS. Deletion of a deceased elector currently relies on a family member, Booth Level Officer (BLO), or periodic roll-revision exercise (e.g. the 2026 Special Intensive Revision) identifying the death — not a real-time feed from the death registry. |
| Data-sharing legal basis | Representation of the People Act, 1950/1951 and Registration of Electors Rules, 1960; DPDP Act, 2023 governs downstream handling. |
| Caveats / exceptions | Periodic Special Intensive Revisions (SIRs) purge large numbers of names for death, duplication, or shifted residence in bulk, sometimes controversially, separate from individual Form 7 filings. |
| Suvidha's prototype treatment | `manual_assisted_workflow` — Suvidha would generate a pre-filled Form 7 packet and deep-link to NVSP/state CEO portal, never call an API. |
| Confidence | High. |
| Source | [Electoral Roll, ECI](https://www.eci.gov.in/electoral-roll), [NVSP services overview](https://nvspportals.com/) — accessed July 2026. |

### 1.5 Passport / Passport Seva (Ministry of External Affairs)

| Attribute | Detail |
|---|---|
| Authority / Regulator | Ministry of External Affairs (MEA), delivered via the Passport Seva Programme (PSP), a public-private partnership with TCS. |
| Record / Service | Indian passport issuance, renewal, reissue; surrender/renunciation certificates on acquiring foreign citizenship; identity certificates. |
| Common identifiers | Passport file number/application reference number. |
| Online self-service today | Full application lifecycle — fresh issue, reissue, appointment booking, real-time status tracking, and "Surrender of Indian Passport"/Identity Certificate applications — through `passportindia.gov.in`, plus 400+ Passport Seva Kendras and Post Office PSKs. |
| Public API? | No public API for third-party platforms; this is a citizen-facing web/appointment portal. |
| Nomination/succession facility | Not applicable — a passport is a travel document, not an asset. |
| Typical required documents | Death certificate to close out/cancel a deceased holder's passport record (informally, via the passport office; there is no dedicated public self-service "report death" flow analogous to Aadhaar's or the electoral roll's, based on the sources reviewed). |
| Death-event propagation | No public evidence of automatic propagation from CRS to Passport Seva. |
| Data-sharing legal basis | Passports Act, 1967; Passport Rules, 1980; DPDP Act, 2023. |
| Caveats / exceptions | Passport surrender/renunciation is well documented for the *living* citizen acquiring foreign citizenship; the specific administrative process for a *deceased* holder's passport record was not found in public self-service documentation and should be treated as a manual, MEA/mission-level process. |
| Suvidha's prototype treatment | `manual_assisted_workflow`. |
| Confidence | Medium — the living-citizen application/surrender flows are well documented; the deceased-holder record-closure process is not clearly published, so this entry is partly inference. |
| Source | [Passport Seva — Identity Certificate/Surrender Certificate](https://www.passportindia.gov.in/psp/ApplyIdentitySurrender) — accessed July 2026. |

### 1.6 Driving Licence & Vehicle Registration / Parivahan (MoRTH)

| Attribute | Detail |
|---|---|
| Authority / Regulator | Ministry of Road Transport & Highways (MoRTH), delivered through the Parivahan Sewa platform (Sarathi for licences, Vahan for vehicles), operated by state/UT Transport Departments and RTOs. |
| Record / Service | Driving licence (DL) issuance/renewal; vehicle Registration Certificate (RC); ownership transfer, including transfer on the death of the registered owner. |
| Common identifiers | DL number; vehicle registration number (RC number); chassis/engine number. |
| Online self-service today | `parivahan.gov.in` supports DL and RC applications, renewals, and ownership-transfer initiation (document upload, fee payment, appointment booking) online; final verification typically still requires an RTO visit. |
| Public API? | No open third-party API for citizen-initiated transactions; Parivahan does expose data-sharing arrangements to specific government/insurance/law-enforcement stakeholders (e.g. e-Challan, insurance verification) but not a general developer platform. |
| Nomination/succession facility | Not applicable in the financial-nomination sense; on the registered owner's death, ownership passes through legal heirs, not a pre-registered nominee. |
| Typical required documents | Death certificate of the owner; legal heir certificate or succession certificate; Form 31 (application for transfer of ownership on death), filed within 3 months per Rule 81 of the Central Motor Vehicle Rules, 1989. |
| Death-event propagation | No automatic propagation from CRS; the legal heir must initiate the Form 31 transfer themselves. |
| Data-sharing legal basis | Motor Vehicles Act, 1988; Central Motor Vehicle Rules, 1989; DPDP Act, 2023. |
| Caveats / exceptions | Process, fees, and exact document checklists vary by state RTO despite the shared national Vahan/Sarathi backend. |
| Suvidha's prototype treatment | `manual_assisted_workflow` — Suvidha would generate the Form 31 packet and checklist and deep-link to Parivahan, not submit anything programmatically. |
| Confidence | High for the general transfer-of-ownership process; medium for state-level variation in exact online completion vs. in-person requirement. |
| Source | [Parivahan Sewa — Transfer of Ownership](https://parivahan.gov.in/en/content/ownership-transfer) — accessed July 2026. |

### 1.7 Ration card / Public Distribution System (PDS)

| Attribute | Detail |
|---|---|
| Authority / Regulator | Department of Food & Public Distribution (Ministry of Consumer Affairs, Food & Public Distribution) at the centre; state Civil Supplies/Food & Civil Supplies Departments administer issuance. |
| Record / Service | Ration card and household member list under the National Food Security Act (NFSA), 2013; One Nation One Ration Card (ONORC) portability. |
| Common identifiers | Ration card number; Aadhaar (now near-universally required to be seeded against each member for e-KYC). |
| Online self-service today | State e-District/civil-supplies portals (and the "Mera Ration"/ONORC mobile app) support adding/removing members, e-KYC, and — relevantly — **removal of a deceased member** on submission of a death certificate, typically within 30 days of the death. |
| Public API? | No open third-party API; state-run e-District portals with varying levels of digitisation. |
| Nomination/succession facility | Not applicable — a ration card is a household entitlement record, not an asset. |
| Typical required documents | Death certificate issued by the municipal corporation/nagarpalika/gram panchayat; the deceased's Aadhaar-seeded ration-card entry. |
| Death-event propagation | No automatic propagation; a family member must file the deletion request, and it commonly stalls if the deceased member's Aadhaar was never seeded on the card. |
| Data-sharing legal basis | National Food Security Act, 2013; state PDS control orders; DPDP Act, 2023. |
| Caveats / exceptions | Because ration cards are state-administered, the online-vs-in-person balance, portal names, and required forms differ meaningfully by state. |
| Suvidha's prototype treatment | `manual_assisted_workflow`. |
| Confidence | Medium — the general process is well corroborated across secondary sources, but there is no single authoritative national page describing it uniformly (each state documents its own procedure). |
| Source | State e-District process summaries, e.g. [Ration Card Name Removal — death, marriage & voluntary surrender](https://portal.digitalgujaratscholarships.com/ration-card-name-removal/); [ONORC / NFSA portability overview](https://sarkariyojana.com/one-nation-one-ration-card-apply/) — accessed July 2026. |

### 1.8 DigiLocker & API Setu (MeitY)

| Attribute | Detail |
|---|---|
| Authority / Regulator | Ministry of Electronics & IT (MeitY), operated by the Digital India Corporation / NeGD. |
| Record / Service | Cloud-based repository of government-issued documents (Aadhaar, PAN, driving licence, marksheets, ration card, and 70+ other document types) fetched with the citizen's consent directly from the issuing department. API Setu is the companion "Open API Platform" that lists and standardises these government APIs, including DigiLocker's own Issuer/Requester specification. |
| Common identifiers | DigiLocker account (linked via Aadhaar or mobile+OTP); per-document issuer reference numbers. |
| Online self-service today | Citizens link/fetch documents directly in the DigiLocker app/web portal; issuing departments push documents in as "Issuers"; consuming apps pull documents out (with consent) as "Requesters". |
| Public API? | **Yes — genuinely public and documented**, the strongest example of a real open API surface in this entire landscape. DigiLocker publishes an Issuer API Specification and a Requester API, and third-party platforms (fintechs, lenders, HR-tech) commonly integrate as Requesters through it, including via commercial API aggregators (e.g. Setu) that wrap the government spec. Becoming a Requester still requires organisational registration/approval on API Setu, so this is "open" in the sense of a published, standard onboarding path rather than anonymous/instant access. |
| Nomination/succession facility | Not applicable. |
| Typical required documents | User consent (OTP-based) per document-fetch request; no separate paperwork beyond the underlying document's own issuance requirements. |
| Death-event propagation | Not applicable — DigiLocker is a document-fetch layer, not itself a life-event registry. |
| Data-sharing legal basis | Information Technology Act, 2000 (Section 6A recognises DigiLocker documents as valid); DPDP Act, 2023 for consent and data-fiduciary obligations. |
| Caveats / exceptions | Document *authenticity* rests on the issuing department having onboarded as an Issuer; not every document type or every state department is on DigiLocker yet. |
| Suvidha's prototype treatment | `real_public_integration_documented` — this is the one connector in Suvidha's model where a genuine future integration is realistically buildable on a fully public, documented government API; the prototype's `digilocker` connector still only simulates fetches (no real DigiLocker account is ever contacted), but the label reflects that the real path is unusually clear. |
| Confidence | High. |
| Source | [DigiLocker — API Setu / Data Exchange](https://www.digilocker.gov.in/web/data-exchange), [API Setu — DigiLocker API directory entry](https://directory.apisetu.gov.in/api-collection/digilocker) — accessed July 2026. |

### 1.9 UMANG (Unified Mobile Application for New Age Governance)

| Attribute | Detail |
|---|---|
| Authority / Regulator | MeitY / NeGD, in partnership with individual central and state departments. |
| Record / Service | A single mobile/web front-end aggregating 2,000+ government services (EPFO, income tax, passport, utility bill payment, and more) rather than a record system of its own. |
| Common identifiers | UMANG account (mobile-OTP or Aadhaar-linked), plus whatever identifier the underlying department's service requires. |
| Online self-service today | Yes — this is entirely a self-service aggregator app/portal. |
| Public API? | UMANG itself is built on APIs — departments/states wire their own e-District or service backend to the UMANG platform — but this is a government-to-government integration path, not an open API a private consumer platform can call to re-expose UMANG's services. |
| Nomination/succession facility | Not applicable. |
| Typical required documents | Varies entirely by the underlying service being accessed through UMANG. |
| Death-event propagation | Not applicable. |
| Data-sharing legal basis | Varies by underlying service; DPDP Act, 2023 governs UMANG's own data handling as an aggregator. |
| Caveats / exceptions | State-level integration coverage is uneven — some states are fully wired in, others only partially. |
| Suvidha's prototype treatment | `manual_assisted_workflow` for any UMANG-mediated service Suvidha references — Suvidha would deep-link the citizen to the relevant UMANG service, not integrate behind it. |
| Confidence | Medium — the government-to-government integration model is described consistently, but UMANG does not publish a general third-party developer API. |
| Source | [UMANG — Digital India](https://www.digitalindia.gov.in/), summary coverage in secondary reporting — accessed July 2026. |

### 1.10 MeriPehchaan / National Single Sign-On (NSSO)

| Attribute | Detail |
|---|---|
| Authority / Regulator | MeitY / Digital India Corporation (NeGD), combining Jan Parichay, e-Pramaan, and DigiLocker login into one federated identity layer. |
| Record / Service | A single sign-on credential recognised across 1,900+ registered government digital services. |
| Common identifiers | Mobile number + OTP, or Aadhaar-based login, federated across participating services. |
| Online self-service today | Yes — register once at `meripehchaan.gov.in`, reuse the credential across income tax, DigiLocker, GST, Passport Seva, CSC, and other onboarded services. |
| Public API? | Government-to-government federation (SAML/OAuth-style integration for onboarding a *service*, not a data API for a third-party consumer platform to pull citizen data through). |
| Nomination/succession facility | Not applicable. |
| Typical required documents | None beyond standard OTP/Aadhaar authentication. |
| Death-event propagation | Not applicable. |
| Data-sharing legal basis | IT Act, 2000; DPDP Act, 2023. |
| Caveats / exceptions | MeriPehchaan is an authentication layer, not itself a data source — it does not by itself give a relying party access to any citizen's records beyond confirming who is logged in. |
| Suvidha's prototype treatment | `future_policy_dependency` if Suvidha itself ever wanted to become a *relying* service under MeriPehchaan (this requires government empanelment, not currently pursued); the prototype's own login is `prototype_simulation` (a demo email/role login, not real SSO). |
| Confidence | Medium. |
| Source | [MeriPehchaan, Digital India Corporation](https://dic.gov.in/meri-pehchan/), [JanParichay — Meri Pehchaan, Digital India](https://www.digitalindia.gov.in/initiative/janparichay-meri-pehchaan-the-national-single-sign-on/) — accessed July 2026. |

---

## 2. Banking & deposits

### 2.1 Savings / current accounts (general)

| Attribute | Detail |
|---|---|
| Authority / Regulator | Reserve Bank of India (RBI), under the Banking Regulation Act, 1949. |
| Record / Service | Deposit accounts held with scheduled commercial banks. |
| Common identifiers | Account number, IFSC, customer ID/CIF, CKYC number. |
| Online self-service today | Net banking/mobile banking for day-to-day operation is universal among scheduled banks; nominee registration/update is now free and can be done via internet banking at several major banks following an April 2025 rule change; death-claim settlement itself is initiated in-branch or via a bank's own online death-claim intimation form where offered. |
| Public API? | Closed/institution-specific — each bank exposes its own net-banking and, separately, its own partner "API banking" programme (for corporates/fintechs) under bilateral agreement; there is no RBI-mandated universal account-data API outside the Account Aggregator framework (2.7). |
| Nomination/succession facility | Yes — nomination under Section 45ZA of the Banking Regulation Act; up to four nominees can be named with specified percentage shares (rule change effective 2025, up from one nominee previously in most cases). |
| Typical required documents | Death certificate; nominee's KYC and ID proof; claim form (bank-specific); succession certificate/legal heir certificate only if there is no nominee and the balance exceeds the bank's small-claim threshold. |
| Death-event propagation | No — each bank must be notified individually by the family/nominee; there is no CRS-to-bank feed. |
| Data-sharing legal basis | Banking Regulation Act, 1949; RBI Master Directions on customer service; DPDP Act, 2023. |
| Caveats / exceptions | Cooperative banks, Small Finance Banks, and Payment Banks (2.5) follow the same RBI nomination framework but sit under differing degrees of RBI supervisory intensity. |
| Suvidha's prototype treatment | `institution_specific_integration_required` — a real balance/holdings connector would need either a bilateral deal with each bank or routing through the Account Aggregator framework as a licensed FIU; the prototype's `bank` connector is `prototype_simulation`. |
| Confidence | High. |
| Source | [Business Standard — nominee-update rule change, PPF/NSC/SCSS/banks](https://www.business-standard.com/amp/finance/personal-finance/no-fee-for-ppf-nsc-scss-updating-nominees-name-up-to-4-individuals-125040400394_1.html) — accessed July 2026. |

### 2.2 Fixed / recurring deposits (FD/RD)

| Attribute | Detail |
|---|---|
| Authority / Regulator | RBI, same framework as savings accounts; held with the same scheduled/cooperative/small-finance banks. |
| Record / Service | Term deposit contracts. |
| Common identifiers | FD/RD receipt/account number. |
| Online self-service today | Booking and renewal are online at nearly every bank; premature closure on death is typically in-branch. |
| Public API? | Same as 2.1 — institution-specific, no universal API. |
| Nomination/succession facility | Same Section 45ZA nomination framework as savings accounts. |
| Typical required documents | Same as 2.1, plus the original FD receipt where issued in physical form. |
| Death-event propagation | No. |
| Data-sharing legal basis | Same as 2.1. |
| Caveats / exceptions | Premature-withdrawal penalty waivers on death-claim closure are a matter of individual bank policy, not law. |
| Suvidha's prototype treatment | `institution_specific_integration_required`, modelled through the same `bank` connector as 2.1. |
| Confidence | High. |
| Source | Same as 2.1; general banking-sector coverage. |

### 2.3 Joint accounts & lockers

| Attribute | Detail |
|---|---|
| Authority / Regulator | RBI; locker agreements additionally follow the IBA (Indian Banks' Association) model locker agreement mandated by RBI's 2021 locker-directions revision. |
| Record / Service | Joint deposit accounts (Either-or-Survivor / Former-or-Survivor / Jointly mandates) and safe-deposit lockers. |
| Common identifiers | Same account/locker numbering as above; joint-holder KYC on file. |
| Online self-service today | Survivorship-based access on a joint account with an E-or-S/F-or-S mandate is typically usable immediately by the survivor upon producing the death certificate, without needing succession documents — this is the single fastest real-world "death event resolution" path in Indian banking. Locker access on death requires an in-branch inventory-and-nomination-check process; not self-service. |
| Public API? | Same as 2.1. |
| Nomination/succession facility | Joint-holding survivorship mandate for accounts; a single locker nominee (or, absent one, legal-heir process with bank-witnessed inventory) for lockers. |
| Typical required documents | Death certificate; surviving holder's KYC; for lockers, nominee/legal-heir proof plus bank-witnessed inventory list. |
| Death-event propagation | No. |
| Data-sharing legal basis | Same as 2.1; RBI locker directions, 2021 (as amended). |
| Caveats / exceptions | "Jointly" (all-signatures-required) mandate accounts do *not* get automatic survivor access and instead need the full legal-heir/succession process, unlike E-or-S/F-or-S. |
| Suvidha's prototype treatment | `institution_specific_integration_required`, modelled through the `bank` connector with `holdingType`/`mandate` fields distinguishing survivorship rules (see `prisma/schema.prisma` `JointHolder.mandate`). |
| Confidence | Medium-high — survivorship banking practice is well established, but exact locker-inventory procedures vary bank to bank. |
| Source | RBI locker-directions coverage in banking-sector secondary sources; general banking practice — accessed July 2026. |

### 2.4 Cooperative banks / Small Finance Banks / Payment Banks

| Attribute | Detail |
|---|---|
| Authority / Regulator | RBI (all three categories); cooperative banks additionally sit under a dual-regulation legacy with state Registrars of Cooperative Societies for non-banking aspects, following the Banking Regulation (Amendment) Act, 2020 that brought them more fully under RBI's banking supervision. |
| Record / Service | Same deposit-product set as scheduled commercial banks, at smaller/differently-licensed institutions. |
| Common identifiers | Same as 2.1. |
| Online self-service today | Varies widely — large SFBs (e.g. licensed post-2015) have full net-banking parity with commercial banks; many urban/rural cooperative banks remain largely branch-based. |
| Public API? | Same institution-specific pattern as 2.1, with even less standardisation given the long tail of small cooperative banks. |
| Nomination/succession facility | Same Section 45ZA framework applies. |
| Typical required documents | Same as 2.1. |
| Death-event propagation | No. |
| Data-sharing legal basis | Banking Regulation Act, 1949 (as amended 2020 for cooperative banks); DPDP Act, 2023. |
| Caveats / exceptions | This is the segment of Indian banking where digitisation is least uniform — Suvidha should never assume an SFB/cooperative bank has any self-service capability beyond what a specific institution has actually published. |
| Suvidha's prototype treatment | `institution_specific_integration_required`, same `bank` connector, flagged in seed data as lower digital maturity where relevant. |
| Confidence | Medium. |
| Source | General RBI regulatory-framework coverage — accessed July 2026. |

### 2.5 RBI UDGAM (unclaimed deposits search)

| Attribute | Detail |
|---|---|
| Authority / Regulator | Reserve Bank of India. |
| Record / Service | UDGAM ("Unclaimed Deposits – Gateway to Access inforMation") — a centralised citizen search portal across (currently) 30 participating banks for deposits classified unclaimed. |
| Common identifiers | Account holder name, bank name, plus one of PAN/voter ID/driving licence/passport/date of birth to search. |
| Online self-service today | Yes — search and initiate a claim at the participating bank; over 8.5 lakh users had registered as of mid-2025. |
| Public API? | No third-party API; this is a citizen self-service search portal only. |
| Nomination/succession facility | Not applicable — this is a discovery tool, not an account type; underlying accounts follow the nomination rules in 2.1. |
| Typical required documents | Identity proof matching the account holder's registered details; the underlying bank's own claim form once a match is found. |
| Death-event propagation | Not applicable — this addresses *dormancy*, not death, though the two often coincide (an heir searching UDGAM for a deceased relative's forgotten accounts is a common real use case). |
| Data-sharing legal basis | RBI directions on unclaimed deposits / DEA Fund Scheme (2.6); DPDP Act, 2023. |
| Caveats / exceptions | Coverage is 30 banks, not all banks; a "no result" on UDGAM does not prove no unclaimed deposit exists elsewhere. |
| Suvidha's prototype treatment | `manual_assisted_workflow` — Suvidha would deep-link to UDGAM and help interpret results, never query it programmatically (no API exists to do so). |
| Confidence | High. |
| Source | [RBI — UDGAM FAQs](https://www.rbi.org.in/commonman/english/Scripts/FAQs.aspx?Id=3579) — accessed July 2026. |

### 2.6 DEAF — Depositor Education and Awareness Fund

| Attribute | Detail |
|---|---|
| Authority / Regulator | Reserve Bank of India, under Section 26A of the Banking Regulation Act, 1949 (DEA Fund Scheme, 2014). |
| Record / Service | The fund itself, into which banks transfer savings/current balances and matured term deposits inoperative/unclaimed for 10+ years, monthly. |
| Common identifiers | Same account identifiers as the originating bank account. |
| Online self-service today | Banks are required to publish their list of unclaimed/inoperative accounts (10+ years) on their own websites monthly; the depositor/heir still claims from the *originating bank*, which then reimburses itself from DEAF — the depositor never interacts with DEAF directly. |
| Public API? | Not applicable — DEAF is an RBI-administered fund/accounting mechanism, not a citizen-facing system. |
| Nomination/succession facility | Inherits whatever nomination/survivorship applied to the original account. |
| Typical required documents | Same claim documents as reclaiming any inoperative account from the originating bank (identity proof, or death-claim documents if the account holder died and is only now being traced). |
| Death-event propagation | No. |
| Data-sharing legal basis | Banking Regulation Act, 1949 (Section 26A); DEA Fund Scheme, 2014; DPDP Act, 2023. |
| Caveats / exceptions | A claim under DEAF is typically processed in about 7 working days once the originating bank validates it — the money never really "left" the depositor's reach, it moved custodianship to RBI pending a claim. |
| Suvidha's prototype treatment | `manual_assisted_workflow`, referenced from the `bank` connector's dormancy/unclaimed-balance signalling in the prototype. |
| Confidence | High. |
| Source | RBI DEA Fund Scheme, 2014 secondary-source summaries (e.g. [ClearTax — DEA Fund Scheme note](https://news.cleartax.in/a-note-on-rbis-depositor-education-and-awareness-fund-scheme/9271/)) — accessed July 2026. |

### 2.7 Account Aggregator (AA) framework

| Attribute | Detail |
|---|---|
| Authority / Regulator | Reserve Bank of India, under the Master Direction – Non-Banking Financial Company – Account Aggregator (Reserve Bank) Directions, 2016 (as amended); the cross-regulator "Sahamati" ecosystem now recognised by RBI as the framework's Self-Regulatory Organisation (2026). |
| Record / Service | A consent-based, data-blind data-sharing rail connecting Financial Information Providers (FIPs — banks, NBFCs, insurers, pension bodies, tax data via a separate arrangement) to Financial Information Users (FIUs — lenders, wealth platforms) via licensed NBFC-AAs. |
| Common identifiers | Aggregator-specific consent-handle IDs; no raw account numbers pass through the AA itself, which is architecturally "data-blind". |
| Online self-service today | Citizens grant/revoke consent for a specific data-pull through their chosen AA app (e.g. via linked mobile number); this is the mechanism, not a portal to browse independently. |
| Public API? | **Regulated-partner only.** The AA specification (built on the India Stack "Data Empowerment and Protection Architecture") is real, documented, and technically open in the sense of being publicly specified — but *using* it as a data consumer requires the consuming entity to be a regulated FIU (a bank, NBFC, or similar regulated financial entity) or to partner with one; a generic consumer platform cannot become an FIU on its own. |
| Nomination/succession facility | Not applicable — AA moves data, not assets. |
| Typical required documents | None beyond the consent flow itself (OTP/app-based approval). |
| Death-event propagation | Not applicable in its current design — AA is built for *living* customers' consented data-sharing (lending, wealth, insurance underwriting), not bereavement/estate use cases. |
| Data-sharing legal basis | RBI Master Directions, 2016 (NBFC-AA); the AA framework is frequently cited as a real-world precursor/complement to the DPDP Act, 2023's later consent-manager concept. |
| Caveats / exceptions | As of late 2025, roughly 2.6 billion accounts are AA-enabled with ~253 million users, and 17 licensed NBFC-AAs operate — a genuinely large, real, live system, just not one a bereavement/estate platform can plug into today for the specific use case Suvidha targets. |
| Suvidha's prototype treatment | `regulated_partner_integration_required` — this is the closest real-world analog to Suvidha's own "consented, unified view across institutions" ambition, and the honest production path would be to become or partner with an FIU; the prototype's `account_aggregator` connector is `prototype_simulation`. |
| Confidence | High. |
| Source | [Sahamati — RBI recognition as SRO](https://sahamati.org.in/media-article/rbi-recognition-of-sahamati-as-self-regulatory-organisation-marks-new-phase-for-indias-account-aggregator-ecosystem/), [Account Aggregator Framework overview](https://hyperverge.co/blog/account-aggregator-framework-rbi/) — accessed July 2026. |

### 2.8 CKYC / CERSAI

| Attribute | Detail |
|---|---|
| Authority / Regulator | Central Registry of Securitisation Asset Reconstruction and Security Interest of India (CERSAI), operating the Central KYC Records Registry (CKYCR) under PMLA Rules. |
| Record / Service | A single, de-duplicated KYC record per customer (14-digit CKYC number) shared across all regulated financial entities so a customer need not repeat full KYC at every new institution. |
| Common identifiers | 14-digit CKYC Identifier (KIN). |
| Online self-service today | Individuals can check their own CKYC status/download their record via the CKYCR portal (`ckycindia.in`) or through any bank/RTA that already has their KYC on file; individuals do not directly "upload" to CKYCR themselves — reporting entities do that on their behalf. |
| Public API? | **Regulated-partner only.** CKYC Search/Upload APIs exist and are actively integrated by financial institutions, but only "reporting entities" registered with CERSAI (banks, NBFCs, AMCs, insurers, depository participants, etc. under PMLA) may call them — not open to arbitrary platforms. |
| Nomination/succession facility | Not applicable — CKYC is identity data, not an asset. |
| Typical required documents | Whatever KYC documents were originally submitted to the reporting entity that filed the CKYC record (PAN, Aadhaar/OVD, photo, address proof). |
| Death-event propagation | No — CKYC records are not automatically flagged "deceased"; each institution independently learns of and records a customer's death. |
| Data-sharing legal basis | Prevention of Money-Laundering (Maintenance of Records) Rules, 2005 (as amended); DPDP Act, 2023. |
| Caveats / exceptions | CKYC de-duplicates *identity verification*, not financial holdings — knowing someone's CKYC number reveals nothing about what accounts/policies they actually hold. |
| Suvidha's prototype treatment | `regulated_partner_integration_required` — a real Suvidha would need reporting-entity status (or a partnership with one) to query CKYCR; the prototype's `ckyc` connector is `prototype_simulation`. |
| Confidence | Medium-high. |
| Source | [CERSAI CKYC portal](https://www.ckycindia.in/ckyc/?r=home), [TeamLease RegTech — CERSAI CKYC API/Bulk Search notification](https://www.teamleaseregtech.com/updates/article/50435/cersai-notified-regarding-the-ckyc-api-and-bulk-search-for-account-ope/) — accessed July 2026. |

---

## 3. Investments & securities

### 3.1 Demat accounts — NSDL / CDSL

| Attribute | Detail |
|---|---|
| Authority / Regulator | Securities and Exchange Board of India (SEBI); the two depositories, National Securities Depository Limited (NSDL) and Central Depository Services Limited (CDSL), operate through registered Depository Participants (DPs — brokers/banks). |
| Record / Service | Dematerialised holding of securities (equities, bonds, ETFs, SGBs) in a demat account. |
| Common identifiers | Demat client ID / BO ID (Beneficiary Owner ID), DP ID. |
| Online self-service today | Holdings, statements, and (via the DP's own portal or the industry-wide "Easiest"/"e-DIS" style consent tools) transmission-request initiation are online; final transmission processing requires the DP to receive and verify physical/digitally-signed documents. |
| Public API? | Institution-specific — each DP (broker/bank) exposes its own trading/holdings API under its own commercial terms (e.g. Zerodha Kite Connect, Angel One SmartAPI); NSDL/CDSL themselves do not offer a public consumer-facing API. |
| Nomination/succession facility | Yes — SEBI mandates nomination (or explicit opt-out) for demat accounts; on death, if a nominee is registered, transmission requires only the death certificate (notarised/gazetted-attested), transmission form, nominee's PAN/address proof, and the Client Master Report — explicitly **no succession certificate, probate, or court order needed**. Absent a nominee, the without-nominee threshold for simplified transmission was raised to ₹5 lakh (from the earlier ₹1 lakh). |
| Typical required documents | Death certificate (notarised); transmission request form; nominee/claimant PAN and address proof; Client Master Report/List (CML/CMR). |
| Death-event propagation | No — the DP learns of the death only when the nominee/heir comes forward with documents. |
| Data-sharing legal basis | SEBI (Depositories and Participants) Regulations; Depositories Act, 1996; DPDP Act, 2023. |
| Caveats / exceptions | Processing timeline is regulator-targeted at ~7 days once the DP has valid documents in hand, though this is DP-dependent in practice. |
| Suvidha's prototype treatment | `institution_specific_integration_required` for holdings/balance data (per-DP integration or Account Aggregator); the transmission-on-death workflow itself is `manual_assisted_workflow` (Suvidha would generate the transmission-form packet); the prototype's `depository` connector is `prototype_simulation`. |
| Confidence | High. |
| Source | [Zerodha support — NSDL demat transmission on death, with nominee](https://support.zerodha.com/category/your-zerodha-account/transfer-of-shares-and-conversion-of-shares/death-claim/articles/procedure-upon-the-death-of-an-account-holder-account-holder-had-appointed-a-nominee-nsdl), [SEBI easing of share-transmission norms for deceased holders](https://www.indiainfoline.com/knowledge-center/share-market/sebi-relaxes-share-transfer-norms-for-deceased-holders-accounts) — accessed July 2026. |

### 3.2 Mutual funds — AMCs / RTAs (CAMS, KFintech)

| Attribute | Detail |
|---|---|
| Authority / Regulator | SEBI; Asset Management Companies (AMCs) delegate record-keeping to Registrars & Transfer Agents (RTAs) — principally CAMS and KFintech. |
| Record / Service | Mutual fund folios/units. |
| Common identifiers | Folio number; PAN linked to the folio. |
| Online self-service today | MF Central (the industry-wide investor portal jointly run by CAMS/KFintech) and individual AMC/RTA portals support nomination updates, transmission-request initiation and tracking, and (per SEBI rules) explicit nomination or opt-out is now mandatory for every folio. |
| Public API? | No open public API for third-party platforms; CAMS/KFintech offer institution-specific data feeds to AMCs and, separately, to platforms (e.g. wealth apps) under commercial agreement — not a general developer API. |
| Nomination/succession facility | Yes — SEBI-mandated nomination (or explicit opt-out); with a valid nominee, transmission is comparatively fast (roughly 15–30 days for straightforward, sub-₹5-lakh single-claimant folios per RTA-published guidance); without a nominee or for contested/larger claims, indemnity bonds, notarisation, or succession documents are required and it takes materially longer. |
| Typical required documents | Death certificate, transmission request form, claimant KYC/PAN, bank account proof for redemption credit; notarised indemnity bond and/or succession certificate for non-nominee or high-value claims. |
| Death-event propagation | No. |
| Data-sharing legal basis | SEBI (Mutual Funds) Regulations, 1996; DPDP Act, 2023. |
| Caveats / exceptions | SEBI data cited in industry commentary suggests roughly one-in-five folios still lack a registered nominee, which is exactly the friction point Suvidha's product concept targets. |
| Suvidha's prototype treatment | `institution_specific_integration_required` for holdings; `manual_assisted_workflow` for the transmission process itself; prototype's `mutual_fund` connector is `prototype_simulation`. |
| Confidence | Medium-high. |
| Source | [CAMS — About Mutual Fund Transmission](https://www.camsonline.com/Investors/Service-requests/Transmission/Transmission), [KFintech — Guidelines for Transmission](https://mfs.kfintech.com/investor/General/GuidelinesTransmission) — accessed July 2026. |

### 3.3 Brokers (stock brokers / trading accounts)

| Attribute | Detail |
|---|---|
| Authority / Regulator | SEBI; brokers are also DPs for demat purposes (see 3.1), so trading and demat records are usually co-located commercially even though regulated as related-but-distinct functions. |
| Record / Service | Trading account, linked bank and demat accounts. |
| Common identifiers | Trading client ID, UCC (Unique Client Code). |
| Online self-service today | Account opening, trading, and statements are fully online; death-claim/account-closure processes mirror the demat transmission process (3.1) since the broker is typically also the DP. |
| Public API? | Institution-specific — several major brokers publish their own trading/portfolio APIs (Kite Connect, SmartAPI, etc.) under individual commercial terms; no SEBI-mandated universal broker API. |
| Nomination/succession facility | Follows the linked demat account's nomination (3.1). |
| Typical required documents | Same as 3.1. |
| Death-event propagation | No. |
| Data-sharing legal basis | SEBI (Stock Brokers) Regulations, 1992; DPDP Act, 2023. |
| Caveats / exceptions | None beyond what's noted for demat. |
| Suvidha's prototype treatment | `institution_specific_integration_required`, folded into the `depository`/`bank` connectors rather than modelled as a separate connector key. |
| Confidence | Medium-high. |
| Source | General secondary-source coverage of broker API programmes — accessed July 2026. |

### 3.4 Sovereign Gold Bonds (SGB) & RBI Retail Direct

| Attribute | Detail |
|---|---|
| Authority / Regulator | Reserve Bank of India, issuing on behalf of the Government of India. |
| Record / Service | SGB holdings, either in demat form or via an RBI Retail Direct Gilt (RDG) account. |
| Common identifiers | Demat client ID (if held in demat) or RDG account number. |
| Online self-service today | Subscription and holdings are online via RBI Retail Direct (`rbiretaildirect.org.in`) or the issuing bank/broker; on the holder's death, nominee(s) approach the "Receiving Office" (the bank/SHCIL/post office/broker through which the bond was bought) with a claim — not a fully online end-to-end death-claim flow. |
| Public API? | No public API; RBI Retail Direct is a citizen self-service portal. |
| Nomination/succession facility | Yes — up to two nominees can be registered at subscription or later; on death, the nominee is substituted as the bond holder and a fresh certificate issued. |
| Typical required documents | Death certificate; nominee KYC; claim submission to the original Receiving Office. |
| Death-event propagation | No. |
| Data-sharing legal basis | Government Securities Act, 2006; RBI SGB scheme notifications; DPDP Act, 2023. |
| Caveats / exceptions | As of the most recent public information found, no new SGB tranche had been announced for FY2026-27 — existing bonds continue to run to maturity/premature-redemption windows, but this is not an actively issuing scheme at the moment of writing. |
| Suvidha's prototype treatment | `manual_assisted_workflow` for the death-claim process; holdings tracking is `institution_specific_integration_required` (via the Receiving Office/demat); prototype models this under the `depository`/`bank` connectors. |
| Confidence | Medium. |
| Source | [RBI Retail Direct portal](https://rbiretaildirect.org.in), secondary coverage of SGB nomination/transmission rules — accessed July 2026. |

### 3.5 IEPF — unclaimed shares & dividends

| Attribute | Detail |
|---|---|
| Authority / Regulator | Investor Education and Protection Fund Authority (IEPFA), under the Ministry of Corporate Affairs (MCA), Companies Act, 2013. |
| Record / Service | Shares and dividends unclaimed for 7+ consecutive years, transferred by listed companies from their Unpaid Dividend Account to IEPF. |
| Common identifiers | Company/folio or demat client ID under which the original shares were held; PAN of the claimant. |
| Online self-service today | Search "Unclaimed Amounts" and file **Form IEPF-5** online at `iepf.gov.in` to reclaim shares/dividends transferred to the fund. |
| Public API? | No public API — this is a citizen self-service claim-filing portal. |
| Nomination/succession facility | Not applicable directly (inherits whatever nomination applied to the original shareholding); the claimant must independently establish entitlement. |
| Typical required documents | Signed IEPF-5 acknowledgement/Service Request Number; notarised indemnity bond; self-attested Aadhaar/PAN/passport; proof of entitlement (RTA letter or share certificate); cancelled cheque; bank passbook copy; demat CMR. |
| Death-event propagation | Not applicable — this addresses long-dormant unclaimed instruments, not death specifically, though a deceased original holder's shares often end up here precisely because no one filed nomination/transmission in time. |
| Data-sharing legal basis | Companies Act, 2013 (Section 124-125 and IEPF Rules); DPDP Act, 2023. |
| Caveats / exceptions | Real-world processing commonly takes 4-6 months even for well-documented claims — one of the slowest processes in this entire landscape. |
| Suvidha's prototype treatment | `manual_assisted_workflow` — Suvidha would help identify likely IEPF exposure and pre-fill Form IEPF-5, never file it programmatically. |
| Confidence | High. |
| Source | [IEPF Authority](https://www.iepf.gov.in/content/iepf/global/master/Home/Home.html) — accessed July 2026. |

---

## 4. Insurance

### 4.1 Life insurance

| Attribute | Detail |
|---|---|
| Authority / Regulator | Insurance Regulatory and Development Authority of India (IRDAI), under the Insurance Act, 1938 and IRDAI regulations. |
| Record / Service | Life insurance policies (term, endowment, ULIP, etc.). |
| Common identifiers | Policy number; insurer-specific customer ID. |
| Online self-service today | Policy purchase, premium payment, and — at most large insurers — online death-claim intimation are available; final claim adjudication and payout require document submission and insurer review, generally not a fully online end-to-end flow. |
| Public API? | Institution-specific — each insurer runs its own systems; IRDAI mandates process/timeline rules but does not expose a citizen-facing or third-party API. |
| Nomination/succession facility | Yes — nomination under Section 39 of the Insurance Act, 1938. A **"beneficial nominee"** (spouse, parent, or child) receives the claim amount absolutely in their own right; a nominee who is *not* an immediate family member holds the proceeds only as a trustee for the actual legal heirs unless the policyholder used **assignment** (Section 38) instead, which is a full transfer of the policy's rights/ownership, not just a payout instruction. This nomination-vs-assignment distinction is one of the most consequential and most misunderstood facts in Indian succession practice, and is core to Suvidha's authority-determination logic. |
| Typical required documents | Death certificate, original policy document, claim form, nominee/claimant KYC, medical/treatment records for early-duration or non-natural-death claims (which trigger enhanced investigation). |
| Death-event propagation | No — insurers only learn of a death when a claim is intimated. |
| Data-sharing legal basis | Insurance Act, 1938; IRDAI (Policyholders' Interests) Regulations; DPDP Act, 2023. |
| Caveats / exceptions | IRDAI requires claims to be resolved within a defined window (commonly cited as 30 days) once all required documents are furnished, but early-duration and non-natural-death claims routinely take longer due to investigation. |
| Suvidha's prototype treatment | `institution_specific_integration_required` for policy/claim data; the nomination-vs-assignment distinction itself is represented structurally in the schema (`Nomination` vs `BeneficiaryDesignation`) and used by the authority engine, but the prototype's `insurance` connector is `prototype_simulation`. |
| Confidence | High for the nomination/assignment legal distinction; medium for exact current claim-settlement timelines, which vary by insurer and claim type. |
| Source | [IRDAI — How to Make a Claim (Life)](https://policyholder.gov.in/how-to-make-a-claim-life), secondary coverage of Section 39/38 nomination-vs-assignment distinction — accessed July 2026. |

### 4.2 Health insurance

| Attribute | Detail |
|---|---|
| Authority / Regulator | IRDAI. |
| Record / Service | Health/mediclaim policies (individual, family floater, group). |
| Common identifiers | Policy number; TPA (Third Party Administrator) claim ID where applicable. |
| Online self-service today | Cashless-claim pre-authorisation and reimbursement claim filing are commonly online via the insurer's or TPA's portal/app; a death during hospitalisation triggers the same claims process with additional documentation. |
| Public API? | Institution-specific, same pattern as 4.1. |
| Nomination/succession facility | Health policies are typically indemnity-based (reimbursing the policyholder/estate for expenses incurred), so nomination in the life-insurance sense applies mainly to any linked death-benefit rider, not the base indemnity cover. |
| Typical required documents | Hospital bills/discharge summary, death summary if death occurred during treatment, claim form, KYC of the person filing. |
| Death-event propagation | No. |
| Data-sharing legal basis | Insurance Act, 1938; IRDAI Health Insurance Regulations; DPDP Act, 2023. |
| Caveats / exceptions | Where a policyholder dies mid-treatment, the estate/legal heir typically files the claim, not a "nominee" in the life-insurance sense. |
| Suvidha's prototype treatment | `institution_specific_integration_required`, prototype `insurance` connector is `prototype_simulation`. |
| Confidence | Medium-high. |
| Source | [IRDAI policyholder portal](https://policyholder.gov.in/) general coverage — accessed July 2026. |

### 4.3 Motor / general insurance

| Attribute | Detail |
|---|---|
| Authority / Regulator | IRDAI. |
| Record / Service | Motor own-damage and third-party liability cover; other general insurance (home, travel, etc.). |
| Common identifiers | Policy number; vehicle registration number for motor policies. |
| Online self-service today | Purchase/renewal fully online at most insurers; on the death of the vehicle owner, the policy itself needs to be endorsed/transferred alongside the RC transfer process (1.6) — an often-overlooked step since the two processes (RTO transfer, insurer endorsement) are not linked. |
| Public API? | Institution-specific, same pattern as 4.1; motor insurance data does interoperate with Parivahan for verification purposes at a government level, but not as an open third-party API. |
| Nomination/succession facility | Not typically applicable in the life-insurance sense; on death of the owner, the policy needs a name-transfer endorsement to the new legal owner. |
| Typical required documents | Death certificate, new RC in the transferee's name (or transfer application), insurer's transfer/endorsement form. |
| Death-event propagation | No. |
| Data-sharing legal basis | Insurance Act, 1938; Motor Vehicles Act, 1988 (mandatory third-party cover); DPDP Act, 2023. |
| Caveats / exceptions | A lapsed/un-endorsed motor policy after an ownership change is a common real-world compliance gap. |
| Suvidha's prototype treatment | `institution_specific_integration_required`, prototype `insurance` connector is `prototype_simulation`. |
| Confidence | Medium. |
| Source | General secondary-source coverage — accessed July 2026. |

### 4.4 Bima Sugam (emerging unified insurance platform)

| Attribute | Detail |
|---|---|
| Authority / Regulator | IRDAI. |
| Record / Service | A planned national digital insurance marketplace/exchange intended to eventually unify policy purchase, servicing, and claims across insurers. |
| Common identifiers | Not yet applicable at scale. |
| Online self-service today | A Bima Sugam website went live in September 2025; as of mid-2026, IRDAI's own chairman has described the platform as behind schedule, with initial motor-insurance products targeted for a phased rollout (renewal motor, then standard health, then term life), and claims/renewals functionality explicitly described as following "gradually" after product rollout — **not yet a functioning unified claims system**. |
| Public API? | Not yet publicly documented at the time of writing; this is a regulator-built exchange, not (so far) an open third-party integration surface. |
| Nomination/succession facility | Not yet applicable — no claims functionality live yet per the sources reviewed. |
| Typical required documents | Not yet applicable. |
| Death-event propagation | Not yet applicable. |
| Data-sharing legal basis | IRDAI regulatory mandate (evolving). |
| Caveats / exceptions | This is the single most important item in this entire document to **not** overstate. Suvidha's design should treat Bima Sugam as a directionally relevant future development, never as a current capability. |
| Suvidha's prototype treatment | `future_policy_dependency` — if Bima Sugam eventually exposes a real claims/data API, that would materially change the honest answer for the `insurance` connector; it does not today. |
| Confidence | Medium — status is actively changing and reported mainly through business press rather than a stable IRDAI reference page. |
| Source | [Business Standard — Bima Sugam initial products, IRDAI chairman](https://www.business-standard.com/finance/insurance/bima-sugam-to-launch-initial-products-by-sept-end-irdai-chairman-seth-126063000744_1.html) — accessed July 2026. |

---

## 5. Pensions & employment

### 5.1 EPFO — EPF / EPS / EDLI

| Attribute | Detail |
|---|---|
| Authority / Regulator | Employees' Provident Fund Organisation (EPFO), Ministry of Labour & Employment, under the Employees' Provident Funds & Miscellaneous Provisions Act, 1952. |
| Record / Service | Employees' Provident Fund (EPF, the retirement corpus), Employees' Pension Scheme (EPS-95, a monthly pension), and Employees' Deposit Linked Insurance (EDLI, a group life-insurance-style death benefit) — three linked schemes under one UAN. |
| Common identifiers | Universal Account Number (UAN); PF member ID. |
| Online self-service today | The EPFO Unified Member Portal (`unifiedportal-mem.epfindia.gov.in`) supports e-Nomination, passbook/balance view, and — the directly relevant capability — an online **Composite Death Claim** covering Form 20 (PF), Form 10D (EPS pension), and Form 5IF (EDLI) in one submission, contingent on the member having filed e-Nomination while alive. |
| Public API? | No public third-party API; this is a citizen/employer self-service portal. |
| Nomination/succession facility | Yes, and central to the whole claim: e-Nomination (digitally signed via Aadhaar-based authentication) determines who can claim online with minimal friction; without a filed nomination, the claim reverts to a slower legal-heir-certificate-based process. |
| Typical required documents | Death certificate, UAN, e-Nomination on file (or legal heir certificate if absent), claimant's bank details and KYC. |
| Death-event propagation | No automatic feed from CRS; the family/employer must file the claim. |
| Data-sharing legal basis | EPF & MP Act, 1952; EPF Scheme, 1952 (and its EPS/EDLI counterparts); DPDP Act, 2023. |
| Caveats / exceptions | Cited settlement timelines are approximately 7–15 working days for the PF component and 30–45 days for EDLI, with pension commencing monthly from the date of death once sanctioned — but these are administrative targets, not guaranteed. |
| Suvidha's prototype treatment | `manual_assisted_workflow` for the claim-filing journey (Suvidha pre-fills the composite claim's data and directs the claimant to the UAN portal); `epfo` connector for balance/status signalling is `prototype_simulation`. |
| Confidence | High. |
| Source | [EPFO Unified Member Portal](https://unifiedportal-mem.epfindia.gov.in/), secondary coverage of Composite Death Claim/Form 20/10D/5IF process — accessed July 2026. |

### 5.2 NPS — National Pension System / PFRDA

| Attribute | Detail |
|---|---|
| Authority / Regulator | Pension Fund Regulatory and Development Authority (PFRDA), with record-keeping by Central Recordkeeping Agencies (CRAs, e.g. Protean/NSDL-CRA, KFintech). |
| Record / Service | Individual retirement accounts (Tier I/II) under the National Pension System, for government and "All Citizen Model" subscribers. |
| Common identifiers | Permanent Retirement Account Number (PRAN). |
| Online self-service today | Balance/statement view and standard exit/withdrawal requests can be initiated online through the CRA portal; **death-claim withdrawal specifically requires the subscriber's Nodal Office (for government subscribers) or the CRA's specified death-claim process to capture the request** — it is not a fully self-serve online flow the way a living subscriber's exit is. |
| Public API? | No public third-party API. |
| Nomination/succession facility | Yes — subscriber-registered nominee(s). On death, at least 80% of the accumulated corpus must generally be used to buy an annuity for the spouse, with the balance paid as a lump sum to the nominee/legal heir; if total corpus is below a specified threshold (commonly cited as ₹5 lakh for government-sector subscribers), full lump-sum withdrawal is permitted instead. |
| Typical required documents | Original death certificate, legal heir certificate where applicable, nominee's bank/address/KYC details, claim form. |
| Death-event propagation | No. |
| Data-sharing legal basis | PFRDA Act, 2013; PFRDA (Exits and Withdrawals under NPS) Regulations; DPDP Act, 2023. |
| Caveats / exceptions | Rules differ meaningfully between the Government Sector model and the All Citizen Model — Suvidha's product copy must not conflate the two. |
| Suvidha's prototype treatment | `manual_assisted_workflow` for the claim journey; `nps` connector for balance signalling is `prototype_simulation`. |
| Confidence | Medium-high. |
| Source | [PFRDA — Exits & Withdrawals FAQs](https://pfrda.org.in/exit-nps), [NPS CRA — Withdrawal by Claimant due to Death of Subscriber form](https://www.npscra.proteantech.in/download/Form%20for%20Withdrawal%20by%20Claimant%20due%20to%20Death%20of%20Subscriber.pdf) — accessed July 2026. |

### 5.3 Government pensions (Central/state) & gratuity

| Attribute | Detail |
|---|---|
| Authority / Regulator | Department of Pension & Pensioners' Welfare (Central), Central Pension Accounting Office (CPAO), and equivalent state departments; gratuity separately under the Payment of Gratuity Act, 1972 for the private/organised sector and service-rule-based "death gratuity" for government employees. |
| Record / Service | Family pension (paid to an eligible survivor on a government servant's/pensioner's death) and death gratuity (a lump sum). |
| Common identifiers | PPO (Pension Payment Order) number. |
| Online self-service today | The Pensioners' Portal (`pensionersportal.gov.in`) and CPAO publish downloadable application forms and process guidance for family pension/death gratuity; processing and sanction is departmental, generally not a fully citizen-self-service digital workflow end-to-end, though status tracking via SMS/email is offered during the original retirement-pension sanction process. |
| Public API? | No public API. |
| Nomination/succession facility | Family pension eligibility follows statutory succession order (spouse first, then eligible children, subject to service-rule conditions) rather than a freely chosen nominee; death gratuity is payable per a nomination filed during service, defaulting to a statutory family-member order if none was filed. |
| Typical required documents | Death certificate, PPO, service book/pension papers, family pension claim form, joint-holder bank account details. |
| Death-event propagation | No. |
| Data-sharing legal basis | Central Civil Services (Pension) Rules; Payment of Gratuity Act, 1972; equivalent state rules; DPDP Act, 2023. |
| Caveats / exceptions | State government pension rules diverge from Central rules in specifics (e.g. duration/quantum of enhanced family pension), so this cannot be treated as one uniform national process. |
| Suvidha's prototype treatment | `manual_assisted_workflow`, folded into the `employer_benefits` connector for private-sector gratuity and a government-pension-specific institution record for Central/state pensions. |
| Confidence | Medium — the general framework is well documented; state-level rule variation is not exhaustively catalogued here. |
| Source | [Pensioners' Portal — Terminal Benefits available to Family of a Deceased Government Servant](https://pensionersportal.gov.in/Document/Terminal_Benefits_FP.pdf), [CPAO](https://cpao.nic.in/) — accessed July 2026. |

---

## 6. Government & postal savings schemes

### 6.1 PPF, NSC, KVP, SCSS — general framework

| Attribute | Detail |
|---|---|
| Authority / Regulator | Department of Economic Affairs / National Savings Institute (Ministry of Finance); operated through India Post Payments Bank/Post Offices and authorised banks. |
| Record / Service | Public Provident Fund (PPF), National Savings Certificate (NSC), Kisan Vikas Patra (KVP), Senior Citizens' Savings Scheme (SCSS). |
| Common identifiers | Account/certificate number specific to each scheme and issuing post office/bank branch. |
| Online self-service today | Where held through a bank (PPF is commonly bank-held), internet banking supports nominee updates and (per an April 2025 rule change) **removed the fee for updating nominees and allows up to four nominees** on these government savings-scheme accounts under the Government Savings Promotion General Rules, 2018 (as amended). Death-claim settlement itself is largely branch-based. |
| Public API? | No public API — these are citizen/branch self-service instruments. |
| Nomination/succession facility | Yes, per the above 2018 rules (as amended 2025) — up to four nominees with defined shares. |
| Typical required documents | Death certificate, nomination claim form (scheme-specific, e.g. "Form G" for PPF), nominee KYC, original certificate/passbook. |
| Death-event propagation | No. |
| Data-sharing legal basis | Government Savings Promotion Act, 1873/General Rules, 2018 (as amended); DPDP Act, 2023. |
| Caveats / exceptions | Post Office Savings Bank (POSB) internal guidance has recommended ECS credit for faster death-claim settlement for NSC/KVP/SCSS specifically; **PPF has historically been excluded from that particular ECS-based fast-track**, per Department of Posts internal guidance reported in trade press — a specific, easy-to-get-wrong distinction. A legal heir can claim up to ₹1 lakh from a PPF account without a succession certificate even absent a nominee. |
| Suvidha's prototype treatment | `manual_assisted_workflow`, modelled under the `postal_savings` connector. |
| Confidence | Medium-high — the nomination-fee-removal rule change is well corroborated; the PPF/ECS exclusion detail rests on a single trade-press (Postal Study) source and should be treated as directionally reliable, not verified against an original circular. |
| Source | [Business Standard — no fee for PPF/NSC/SCSS nominee updates](https://www.business-standard.com/amp/finance/personal-finance/no-fee-for-ppf-nsc-scss-updating-nominees-name-up-to-4-individuals-125040400394_1.html), [Postal Study — POSB death claims ECS guidance](https://www.postalstudy.in/2026/07/posb-death-claims-department-advises.html) — accessed July 2026. |

### 6.2 Post Office Savings Bank (POSB) & general Post Office deposit schemes

| Attribute | Detail |
|---|---|
| Authority / Regulator | Department of Posts, Ministry of Communications. |
| Record / Service | Post Office savings account, recurring deposit, time deposit, Monthly Income Scheme. |
| Common identifiers | POSB account number, Customer ID. |
| Online self-service today | India Post Payments Bank (IPPB) app/net-banking for day-to-day operations; death-claim settlement is branch-based, targeted at settlement "within one working day where nomination exists and seven working days otherwise" per departmental guidance. |
| Public API? | No public API. |
| Nomination/succession facility | Same general nomination framework as 6.1. |
| Typical required documents | Same as 6.1. |
| Death-event propagation | No. |
| Data-sharing legal basis | Same as 6.1; India Post Payments Bank is itself RBI-licensed as a Payments Bank for its banking arm. |
| Caveats / exceptions | None beyond 6.1. |
| Suvidha's prototype treatment | `manual_assisted_workflow`, `postal_savings` connector. |
| Confidence | Medium-high. |
| Source | Same as 6.1. |

### 6.3 Sukanya Samriddhi Yojana (SSY)

| Attribute | Detail |
|---|---|
| Authority / Regulator | Department of Economic Affairs / National Savings Institute; operated via banks and post offices. |
| Record / Service | A dedicated savings account for a girl child, opened by a parent/guardian. |
| Common identifiers | SSY account number. |
| Online self-service today | Where bank-held, deposits/statements are online; premature closure on the account holder's (the girl child's) death is branch-based. |
| Public API? | No public API. |
| Nomination/succession facility | On the girl child's death, balance is paid to the guardian on submission of the death certificate — this is a guardian-payout rule rather than a freely-chosen-nominee mechanism in the usual sense; a claim without documentary nomination evidence, capped around ₹5 lakh, can be filed by a legal heir after a 6-month waiting period from the date of death. |
| Typical required documents | Death certificate, KYC of the guardian/claimant, nomination claim form. |
| Death-event propagation | No. |
| Data-sharing legal basis | Same statutory framework as 6.1 (SSY is a notified scheme under the same general savings rules). |
| Caveats / exceptions | Premature closure is otherwise permitted only for marriage (after age 18) or extreme compassionate grounds — death is the clearest-cut of the three triggers. |
| Suvidha's prototype treatment | `manual_assisted_workflow`, `postal_savings` connector. |
| Confidence | Medium. |
| Source | Secondary-source SSY guides corroborating official scheme rules, e.g. [ClearTax — Sukanya Samriddhi Yojana](https://cleartax.in/s/sukanya-samriddhi-yojana) — accessed July 2026. |

---

## 7. Property & physical assets

### 7.1 State land records, sub-registrar systems & mutation

| Attribute | Detail |
|---|---|
| Authority / Regulator | State Revenue Departments and Sub-Registrar offices (registration of deeds under the Registration Act, 1908) — this is a **state subject**, not a national one; the Centre's role is limited to funding/standard-setting via the Digital India Land Records Modernization Programme (DILRMP). |
| Record / Service | Record of Rights (RoR)/Khatauni/Khasra/Jamabandi (ownership and tenancy record), registered sale/gift deeds, and **mutation** (updating the RoR to reflect a change of ownership, including on death/inheritance). |
| Common identifiers | Survey/khasra/khata number; property/deed registration number; state-specific land-parcel IDs. |
| Online self-service today | Every state runs its own portal — e.g. Bhulekh (UP, MP, Uttarakhand and others), Bhoomi (Karnataka), Dharani (Telangana), Bihar Bhumi — for searching records and, increasingly, filing/tracking mutation online; Karnataka's "Auto-Mutation" (since 2024) is a notable exception where a registered sale updates Bhoomi automatically within roughly 15 days without a separate mutation filing — but this does not extend to inheritance-triggered mutation, which still requires the heir to file. |
| Public API? | No open national API — 28+ states/UTs each run independent systems with no common public interface; some states publish limited open-data extracts, not a query/write API for third parties. |
| Nomination/succession facility | Not applicable in the financial-nomination sense — property passes by will, intestate succession law (Hindu Succession Act, 1956; Indian Succession Act, 1925; or the applicable personal law), or a registered gift/settlement, and mutation follows only after that legal determination, typically evidenced by a legal heir certificate, succession certificate, or probated will. |
| Typical required documents | Death certificate, legal heir/succession certificate or probated will, prior registered deed, property tax receipts, mutation application form (state-specific). |
| Death-event propagation | No — mutation-on-death is always heir-initiated. |
| Data-sharing legal basis | Registration Act, 1908; state Land Revenue Codes; DPDP Act, 2023. |
| Caveats / exceptions | This is the single most fragmented category in the entire landscape — Suvidha's product copy should never imply a "national property registry" exists; it does not. |
| Suvidha's prototype treatment | `manual_assisted_workflow`, `land_records`/`property_registration` connectors, explicitly modelled per-institution (state) in seed data rather than as one unified system. |
| Confidence | Medium-high for the general fragmented-by-state picture; medium for any specific state's exact current online capability, which changes often. |
| Source | [DILRMP/state land-record portal overview](https://homefirstindia.com/blog/article/check-land-records-online-india-guide/); state-specific portals, e.g. [Bhoomi (Karnataka)](https://bhoomiirtc.com/) — accessed July 2026. |

### 7.2 Property tax

| Attribute | Detail |
|---|---|
| Authority / Regulator | Urban Local Bodies (municipal corporations/councils) and Panchayati Raj institutions — again a state/local subject with no national system. |
| Record / Service | Annual property tax assessment and payment. |
| Common identifiers | Property/PID number, assessment number — each ULB's own scheme. |
| Online self-service today | Most large ULBs offer online payment and, on ownership change, a name-transfer request tied to the mutation record (7.1). |
| Public API? | No open API; ULB-by-ULB web portals only. |
| Nomination/succession facility | Not applicable — follows ownership per mutation. |
| Typical required documents | Updated mutation record/ownership proof, prior tax receipts. |
| Death-event propagation | No. |
| Data-sharing legal basis | State/municipal property tax acts; DPDP Act, 2023. |
| Caveats / exceptions | Practically always follows, and lags behind, the mutation process in 7.1. |
| Suvidha's prototype treatment | `manual_assisted_workflow`, `property_registration` connector. |
| Confidence | Medium. |
| Source | General ULB-portal secondary coverage — accessed July 2026. |

### 7.3 Vehicles (registration/ownership transfer)

See section 1.6 (Driving Licence & Vehicle Registration / Parivahan) for the full entry — vehicles are documented there because that is where the identity/licensing authority (MoRTH/Parivahan) sits. This entry exists only as a cross-reference so the "Property & physical assets" category is not silently missing vehicles.

---

## 8. Business registration

### 8.1 MCA21 (company incorporation & filings)

| Attribute | Detail |
|---|---|
| Authority / Regulator | Ministry of Corporate Affairs (MCA), under the Companies Act, 2013/LLP Act, 2008. |
| Record / Service | Company/LLP incorporation, statutory filings (annual returns, financials), director records, public corporate-data search. |
| Common identifiers | Corporate Identity Number (CIN)/LLPIN; Director Identification Number (DIN). |
| Online self-service today | The MCA21 V3 portal handles the full filing lifecycle online, including director-change filings (relevant when a director/promoter dies) and, where the entity itself was a sole proprietorship (not company/LLP), closure processes that intersect with GST (8.2). |
| Public API? | MCA21 V3 is described as API-enabled for data dissemination, but this is oriented at government interoperability and registered filing agents/professionals (CS/CA) rather than an open public developer API for arbitrary consumer platforms. |
| Nomination/succession facility | Not applicable to a company/LLP structure itself — succession is handled through shareholding transmission (which for private companies routes through the company's own share-transfer/transmission process, informed by the same death-certificate/legal-heir logic as demat transmission) and director-appointment filings. |
| Typical required documents | Death certificate (for a deceased director/proprietor), board resolution or shareholder documentation for share transmission, updated DIN/KYC filings. |
| Death-event propagation | No. |
| Data-sharing legal basis | Companies Act, 2013; LLP Act, 2008; DPDP Act, 2023. |
| Caveats / exceptions | For unlisted/private companies, share transmission on death is a company-internal process governed by its Articles of Association, not a MCA21 self-service transaction. |
| Suvidha's prototype treatment | `manual_assisted_workflow`, folded into a generic business-registration handling within the `court_legal_document`/institution-relationship model rather than a dedicated connector (business registration is not one of the 19 named `Connector.key` values in the current schema). |
| Confidence | Medium. |
| Source | [MCA21 Portal overview, secondary](https://www.corplawupdates.in/glossary/mca21) — accessed July 2026. |

### 8.2 GST registration

| Attribute | Detail |
|---|---|
| Authority / Regulator | Goods and Services Tax Network (GSTN)/GST Council, under the CGST Act, 2017. |
| Record / Service | GST registration (GSTIN) for a business, including sole proprietorships. |
| Common identifiers | 15-character GSTIN. |
| Online self-service today | The GST portal (`gst.gov.in`) handles registration, return filing, and — directly relevant here — **cancellation of registration on the death of a sole proprietor**: the legal heir files a documented application (Form GST REG-16, reason "death of sole proprietor") after clearing pending returns and dues, and can transfer unutilised Input Tax Credit to a new registration via Form GST ITC-02 before cancellation. |
| Public API? | GSTN publishes GST Suvidha Provider (GSP) APIs, but these require empanelment as a registered GSP — not an open API for arbitrary platforms. |
| Nomination/succession facility | Not applicable in the financial-nomination sense — the legal heir is added as authorised signatory by the jurisdictional officer on submission of a death certificate and succession certificate, a manual officer-mediated step even though the surrounding filings are online. |
| Typical required documents | Death certificate, succession certificate, pending-return filings, Form GST REG-16, Form GST ITC-02 (if transferring credit). |
| Death-event propagation | No. |
| Data-sharing legal basis | CGST Act, 2017; DPDP Act, 2023. |
| Caveats / exceptions | The temporary login/signatory-addition step is officer-mediated and not instantaneous, despite the surrounding forms being filed online. |
| Suvidha's prototype treatment | `manual_assisted_workflow`. |
| Confidence | High. |
| Source | [ClearTax — Cancellation of GST Registration on Death of Sole Proprietor](https://cleartax.in/s/cancel-gst-registration-death-sole-proprietor) — accessed July 2026. |

### 8.3 Udyam registration (MSME)

| Attribute | Detail |
|---|---|
| Authority / Regulator | Ministry of Micro, Small & Medium Enterprises (MSME). |
| Record / Service | Udyam Registration Number (URN) classifying a business as micro/small/medium. |
| Common identifiers | Udyam Registration Number; linked PAN and GSTIN. |
| Online self-service today | Fully online self-registration/update at `udyamregistration.gov.in`, auto-validating turnover against GST returns (GSTR-1/3B) and classification against PAN. |
| Public API? | Back-end integration with PAN/GST databases exists at the government level for validation; no open public API for third-party platforms to register or query on a business owner's behalf. |
| Nomination/succession facility | Not applicable — Udyam registration follows the underlying business entity/proprietor's own continuity, tied to whatever happens at the GST/MCA21 layer on death (8.1/8.2). |
| Typical required documents | Aadhaar of the proprietor/authorised signatory, PAN, GSTIN (where applicable). |
| Death-event propagation | No. |
| Data-sharing legal basis | MSME Development Act, 2006; DPDP Act, 2023. |
| Caveats / exceptions | If the underlying GSTIN is cancelled following a proprietor's death (8.2) without a successor registration, the linked Udyam record becomes stale and needs a fresh application under the new proprietor/entity. |
| Suvidha's prototype treatment | `manual_assisted_workflow`. |
| Confidence | Medium-high. |
| Source | [Udyam Registration Portal guide](https://www.cashfree.com/blog/udyam-registration-online/) — accessed July 2026. |

### 8.4 Professional / trade licences

| Attribute | Detail |
|---|---|
| Authority / Regulator | State/municipal licensing authorities (Shops & Establishments Act registrations, trade licences, professional council registrations such as ICAI/Bar Council/Medical Council depending on profession) — no single national authority. |
| Record / Service | Trade licence, shop registration, or professional practising licence/certificate. |
| Common identifiers | Licence number, entirely authority-specific. |
| Online self-service today | Varies enormously by state/municipality/professional body; some offer full online renewal, many remain paper/in-person. |
| Public API? | No public API found for any general layer here; fully fragmented. |
| Nomination/succession facility | Not applicable — professional licences are typically personal and non-transferable; a trade licence tied to a business may need re-registration under a successor. |
| Typical required documents | Death certificate, succession/heirship proof, original licence, business continuity documentation. |
| Death-event propagation | No. |
| Data-sharing legal basis | State Shops & Establishments Acts; professional council statutes (e.g. Advocates Act, 1961; Chartered Accountants Act, 1949); DPDP Act, 2023. |
| Caveats / exceptions | This is treated here at a summary level only — a full state-by-state and profession-by-profession catalogue is out of scope for this document and would need dedicated research if a specific case is needed. |
| Suvidha's prototype treatment | `manual_assisted_workflow`. |
| Confidence | Low — genuinely fragmented and not centrally documented; treat directionally only. |
| Source | General knowledge of India's licensing landscape; no single authoritative current source found — flagged deliberately as low-confidence rather than citing a weak secondary source as if authoritative. |

---

## 9. Utilities & telecom

### 9.1 Electricity connections

| Attribute | Detail |
|---|---|
| Authority / Regulator | State Electricity Regulatory Commissions and the relevant state/private Distribution Company (DISCOM) — no national consumer-facing system; the Ministry of Power/Central Electricity Authority set policy, not individual connections. |
| Record / Service | Electricity connection/consumer account. |
| Common identifiers | Consumer/account number, meter number — DISCOM-specific. |
| Online self-service today | Bill payment and, at many DISCOMs, a name-change/transfer request are online; final verification (meter reading, site check) is typically in-person. |
| Public API? | No public API; DISCOM-by-DISCOM web portals. |
| Nomination/succession facility | Not applicable — name-transfer on death follows property ownership/legal-heir documentation, not a pre-registered nominee. |
| Typical required documents | Death certificate, identity/address proof of the new occupant/heir, proof of property ownership or legal heir certificate, latest paid bill, and — where multiple heirs exist — a notarised NOC from co-heirs relinquishing claim. |
| Death-event propagation | No. |
| Data-sharing legal basis | Electricity Act, 2003; state DISCOM regulations; DPDP Act, 2023. |
| Caveats / exceptions | Process and required-document specifics differ by DISCOM; some states have far more digitised name-transfer flows than others. |
| Suvidha's prototype treatment | `manual_assisted_workflow`, `utility`-labelled `institution_relationship` (utilities are not a distinct connector key in the current schema — modelled as a generic `InstitutionRelationship` of `relationshipType: "utility"`). |
| Confidence | Medium. |
| Source | Secondary consumer-guide coverage, e.g. [99acres — utility bill payment after owner death](https://www.99acres.com/articles/utility-bill-payment-after-owner-death.html) — accessed July 2026. |

### 9.2 Water connections

| Attribute | Detail |
|---|---|
| Authority / Regulator | State/municipal Water Boards (e.g. Jal Boards) — again no national system. |
| Record / Service | Water supply connection/consumer account. |
| Common identifiers | Connection/consumer number, board-specific. |
| Online self-service today | Bill payment commonly online; ownership/name transfer varies, generally less digitised than electricity. |
| Public API? | No public API. |
| Nomination/succession facility | Not applicable — same property/heir-based transfer logic as electricity. |
| Typical required documents | Same general set as 9.1. |
| Death-event propagation | No. |
| Data-sharing legal basis | State water-board statutes/regulations; DPDP Act, 2023. |
| Caveats / exceptions | Least standardised of the utility categories in terms of public documentation. |
| Suvidha's prototype treatment | `manual_assisted_workflow`, modelled as `InstitutionRelationship` of `relationshipType: "utility"`. |
| Confidence | Low-medium — general process inferred by analogy to electricity/gas rather than independently well-sourced. |
| Source | General secondary consumer-guide coverage (utility name-transfer articles) — accessed July 2026. |

### 9.3 LPG / piped gas connections

| Attribute | Detail |
|---|---|
| Authority / Regulator | Ministry of Petroleum & Natural Gas; distribution through the public-sector Oil Marketing Companies (Indane/IOCL, Bharat Gas/BPCL, HP Gas/HPCL) and, for piped natural gas, City Gas Distribution companies under PNGRB regulation. |
| Record / Service | LPG cylinder connection/consumer number, or PNG connection. |
| Common identifiers | Consumer number tied to the specific distributor. |
| Online self-service today | Booking/refill is fully online via each OMC's app; **ownership transfer on death** requires the transferee to submit a KYC form plus a declaration form in person (or via the distributor's portal where offered) along with the deceased's death certificate. |
| Public API? | No public API; distributor-specific web/app portals. |
| Nomination/succession facility | Not applicable in the financial sense — transfer is to "any relative" producing a death certificate and completing fresh KYC, not a pre-registered nominee. |
| Typical required documents | Death certificate, transferee KYC form, declaration form, proof of relationship. |
| Death-event propagation | No. |
| Data-sharing legal basis | Petroleum & Natural Gas Regulatory Board Act, 2006 (for PNG); OMC distributor agreements for LPG; DPDP Act, 2023. |
| Caveats / exceptions | Process is distributor-level (the local gas agency), not company-wide-digital, in most cases. |
| Suvidha's prototype treatment | `manual_assisted_workflow`, `InstitutionRelationship` of `relationshipType: "utility"`. |
| Confidence | Medium. |
| Source | [BankBazaar — Indane/Bharat Gas connection transfer procedure](https://www.bankbazaar.com/gas-connection/indane-gas-connection-transfer.html) — accessed July 2026. |

### 9.4 Telecom (mobile/SIM)

| Attribute | Detail |
|---|---|
| Authority / Regulator | Department of Telecommunications (DoT) and Telecom Regulatory Authority of India (TRAI), under the Telecommunications Act, 2023 and TRAI's KYC/SIM regulations. |
| Record / Service | Mobile subscriber connection/SIM registration. |
| Common identifiers | Mobile number, subscriber Aadhaar/ID used at KYC, IMEI (device). |
| Online self-service today | **Sanchar Saathi** (`sancharsaathi.gov.in`, DoT) is a genuinely useful, currently-live citizen self-service portal/app: subscribers can see all mobile connections issued in their name nationally (via the CEIR/TAFCOP back-end), report ones not theirs, block lost/stolen handsets by IMEI, and report suspected fraud communications. It does not, however, offer a specific "transfer/close a deceased relative's SIM" self-service flow — that remains an operator-specific, in-person/customer-care process requiring the death certificate and the requester's own KYC. |
| Public API? | No public API; Sanchar Saathi is a citizen self-service portal, and individual telecom operators handle account-level changes (including on death) through their own customer-service channels only. |
| Nomination/succession facility | Not applicable — a mobile connection is not an asset with nomination; closing/transferring a deceased subscriber's number is an operator courtesy process, not a statutory right, and reassigned numbers are held inactive for a mandated period (commonly cited as 90 days) before recycling to a new subscriber. |
| Typical required documents | Death certificate, requester's own KYC/ID proof, account details of the deceased's connection. |
| Death-event propagation | No. |
| Data-sharing legal basis | Telecommunications Act, 2023; TRAI KYC/SIM regulations; DPDP Act, 2023. |
| Caveats / exceptions | SIM KYC rules are tightening generally (mandatory Aadhaar-based e-KYC for new/replacement SIMs, a 9-SIM cap per individual — 6 in J&K/Northeast — as recently reported) — relevant context for identity-verification design even though it doesn't directly change the death-handling process. |
| Suvidha's prototype treatment | `manual_assisted_workflow` for the operator-level closure process; Sanchar Saathi itself is referenced only as a citizen self-service tool Suvidha could deep-link to, not integrate with. |
| Confidence | Medium-high for Sanchar Saathi's live capabilities (directly sourced from the DoT-run portal's own description); medium for the specific deceased-subscriber transfer process, which rests on operator practice rather than a single published DoT rule. |
| Source | [Sanchar Saathi](https://sancharsaathi.gov.in/), [PIB — Sanchar Saathi mobile app](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2093732) — accessed July 2026. |

---

## Cross-cutting observations that shaped Suvidha's design

1. **There is no single "report a death once" API in India today.** The closest real precedent is the bilateral RGI→UIDAI CRS data share for Aadhaar deactivation (section 1.2) — a meaningful and recent development, but narrow (one registry to one authority) and not a general-purpose service any platform, public or private, can subscribe to for arbitrary institutions. Suvidha's central "report once, propagate everywhere" promise is therefore explicitly modelled as `future_policy_dependency` for the propagation half, and the platform's real, honest value in the near term is as a **checklist, document, and tracking layer across manual/self-service channels**, not a real propagation engine.
2. **Nomination quality is the single biggest predictor of claim friction** across banking, demat, mutual funds, EPFO, NPS, and postal savings alike — a documented, current nominee routinely turns a multi-month, court-adjacent process into a days-long, document-light one. This is why Suvidha's estate-planning module is weighted so heavily toward nomination completeness/freshness rather than just document storage.
3. **"Public API" almost always means partner/regulated access, not open access**, with DigiLocker/API Setu being the one clear exception (section 1.8). Suvidha's own documentation must resist the temptation to describe RBI/SEBI/IRDAI-adjacent "frameworks" (Account Aggregator, CKYC) as if they were open developer platforms — they are real, but gated.
4. **Property and utilities are irreducibly fragmented by state/local jurisdiction.** No national land-record, property-tax, or utility API exists or is likely to soon; any Suvidha claim in this area must stay at the "generate the paperwork, guide the citizen" level.
5. **DPDP Act, 2023 is real but not yet fully in force.** The Act was notified together with the DPDP Rules, 2025 on 13 November 2025; most substantive obligations (consent mechanics, breach reporting, Significant Data Fiduciary duties) phase in through 13 May 2027. Suvidha's own consent-record and data-minimisation design anticipates this framework rather than claiming to operate under a fully-live enforcement regime today.
