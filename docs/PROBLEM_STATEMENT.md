# Problem Statement

## 1. The shape of the problem

An Indian adult typically holds active relationships with fifteen to thirty separate institutions
simultaneously, each of which independently stores a version of the citizen's name, address,
mobile number, and (where relevant) nominee or beneficiary details. None of these institutions is
obligated to tell any of the others when the citizen updates a value, and the citizen has no
system-level way to check, in one place, whether all of them currently agree with each other. This
is not a failure of any single institution — each one manages its own record correctly by its own
lights — it is a structural gap between institutions that no single institution is positioned to
close.

## 2. Institution categories affected

| Category | Representative institutions/relationships |
|---|---|
| Government & identity | Aadhaar, PAN, Income Tax Department, Voter ID (EPIC), Passport, Driving Licence, vehicle registration (Parivahan-style), DigiLocker-issued documents, municipal/civil registration (birth, death, marriage) |
| Financial | Savings and current bank accounts, fixed deposits, demat and mutual fund holdings, life and general insurance policies, EPF/EPS, NPS, PPF/SCSS/NSC/KVP and other small-savings instruments, post office deposits, credit cards and loans |
| Employment & education | Current and past employers (payroll, gratuity, benefits), professional licensing bodies, university and board records, certifications |
| Property & utilities | Property registration and land records, electricity/water/gas/telecom connections, housing society records, vehicle ownership |
| Business & professional | Business/firm registrations, GST registration, professional body memberships, Chartered Accountant/lawyer engagements |

## 3. Citizen-side pain points

- **Missed notices.** Tax notices, insurance renewal reminders, and regulatory communications
  arrive through channels (SMS, email, post) that a citizen may not check regularly, are written in
  institution-specific jargon, and are not correlated with each other — so a citizen has no way to
  see "I have three unread items requiring action this month" without checking every channel and
  every institution separately.
- **Forgotten renewals.** Licences, registrations, and policy renewals each carry their own deadline
  on their own institution's calendar; a citizen tracking a driving licence renewal has no
  structural link to a passport renewal or an insurance premium due the same quarter.
- **Lost-track applications.** Once a form is submitted — an address change, a grievance, a
  correction request — the citizen's only way to check status is to return to that institution's
  own portal or call its helpline; there is no consolidated view of "everything I currently have
  pending, anywhere."
- **Inconsistent names and addresses across records.** A name spelled one way on a PAN card and
  another way on a bank KYC record, or an address updated with one bank but not another, creates
  silent inconsistency that surfaces only when it causes a rejection, a mismatch, or a delay —
  often at the worst possible time (e.g., a KYC mismatch discovered while filing a claim).
- **Outdated nominees.** A nominee named on a life insurance policy fifteen years ago may no longer
  reflect the policyholder's family situation, and no institution proactively checks in on this;
  the gap is invisible until a claim is filed and the outdated nomination becomes a legal
  complication for the family.
- **Duplicate records.** The same underlying relationship (e.g., two decades of employment at
  different employers, each contributing to a different EPF sub-account) can fragment into records
  the citizen may not even remember exist, each earning interest or lying dormant unclaimed.
- **Not knowing which institutions hold data at all.** Many citizens cannot produce a complete list
  of every account, policy, and registration in their own name, particularly across a working
  lifetime with job changes, house moves, and evolving financial products.
- **Repeated documentation.** The same proof of address or proof of identity, once verified by one
  institution, must typically be resupplied from scratch to the next institution, with no
  portable, verifiable record of "this was already checked and found valid."
- **Coordination failure during life events.** A single real-world event — marriage, a house move,
  a new job, a death in the family — requires near-simultaneous action across many institutions,
  each with different forms and proof requirements, and no single checklist tells the citizen
  (or their family) everything that needs to happen and in what order.
- **No organised record for family.** In the event of incapacity or death, most families have no
  consolidated, permission-appropriate record of what their relative held, where, and how to claim
  it — the family reconstructs this from paper statements, old emails, and guesswork, often for
  months, sometimes never fully.

## 4. Institution-side and government-side pain points

- **Duplicate and incomplete applications.** Without a shared, verified baseline of citizen data,
  institutions receive applications with inconsistent or incomplete information more often than
  necessary, requiring rework cycles that cost both the citizen and the institution time.
- **High status-enquiry volume.** A large share of contact-centre and branch-visit traffic is
  citizens asking "what is the status of my request," a question a consolidated, self-service
  status view could answer without institutional staff time.
- **Fraud exposure.** Manual, paper-heavy verification processes (especially around death
  notification and claims) create exploitable gaps — false-death reports used to freeze a
  competitor's or relative's account, forged documents, or claims filed at multiple institutions
  faster than any one of them can cross-check against the others.
- **Manual reconciliation.** Institutions maintaining death-notification, KYC-refresh, or
  nominee-update processes today typically do so through manual document review and phone-based
  verification, which does not scale smoothly and is inconsistent in turnaround time.
- **SLA misses.** Published service-level commitments (e.g., claim settlement within a stated
  number of days) are frequently missed once a case requires a document resubmission cycle,
  in-person verification, or escalation — and the citizen has no visibility into which stage of
  the institution's own process is currently the bottleneck.

## 5. Why this is a platform problem, not an institution-by-institution problem

No single institution can solve this from inside its own walls: even a well-run bank cannot know
whether the address a customer gave it matches the one on their PAN record, and no government
registry is mandated to notify every financial institution when a citizen updates an address with
it. The fix has to sit above all of them, under the citizen's own control, respecting each
institution's authority over its own record while giving the citizen — and only the citizen, or
those they explicitly permit — the composite view and the tracked action plan that no individual
institution is positioned to provide. This is the gap Suvidha is designed to close; see
`PRODUCT_VISION.md` for how the nine product domains map onto it.
