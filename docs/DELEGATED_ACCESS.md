# Delegated Access & Representation

**Implementation status** (authoritative record: `src/config/capabilities.ts` → `delegated_access`):
a citizen can invite a new assistant from `/family-access`, always scoped to one of their own open
`ServiceRequest`s — never blanket account access — which is created already approved, since the
citizen initiated it themselves. No real invitation email is sent, and the invitee has no login of
their own in this demo's persona set.

**Domain H of the lifelong citizen administration platform.** Source models:
`ProfessionalRepresentative`, `DelegatedTask`, plus `ConsentPurpose`, `ConsentScope`,
and `DataShare` for the underlying consent/audit trail. See `docs/TERMINOLOGY.md` §4
for the vocabulary, and `docs/LEGACY_AND_SUCCESSION.md` for the contrasting
bereavement-only access model this domain is deliberately distinct from.

## 1. The core distinction: permission vs. legal entitlement

Everything in this domain grants a **platform permission** — a scoped, revocable
ability to do something *inside Suvidha* on someone else's behalf. Nothing in this
domain ever grants, implies, or should be read as **legal entitlement or ownership**
— not power of attorney, not signing authority in the institution's own legal sense,
not any claim on funds or property. That distinction is enforced by never letting a
`DelegatedTask` or `ProfessionalRepresentative` row stand in for an actual legal
instrument: where real legal authority exists, it is represented separately by a
`CourtOrder` or `AuthorityCredential` record (Legacy & Succession domain), and a
delegated permission is never treated as a substitute for one.

## 2. The six permission tiers

`DelegatedTask.permissionTier` is one of:

| Tier | What it allows |
|---|---|
| `permission_to_view` | See specified records/requests, read-only |
| `permission_to_assist` | Help interpret, explain, or discuss — no ability to change anything |
| `permission_to_prepare` | Fill in forms, assemble documents, draft a `ServiceRequest` up to `ready_to_submit` |
| `permission_to_submit` | Actually submit a prepared `ServiceRequest` |
| `permission_to_sign` | Execute a `Signature` (self-attestation/simulated e-sign) on the owner's behalf, where the target institution's own process accepts a delegate's signature |
| `permission_to_receive_communication` | Receive copies of `Message`/`Notice` traffic on the owner's behalf, without any action authority |

These are independent capability grants, not a strict ladder every task must climb —
a `DelegatedTask` carries exactly one `permissionTier`, defining the ceiling of what
that specific delegation covers. A Family Administrator might simultaneously hold one
`permission_to_view` task for one parent and, separately, a
`permission_to_prepare` task for another matter — each is its own row with its own
approval and status.

## 3. `ProfessionalRepresentative`

| Field | Purpose |
|---|---|
| `principalPersonId` | The citizen being represented |
| `representativePersonId` | The CA/lawyer/adviser acting for them |
| `professionType` | `chartered_accountant \| lawyer \| financial_adviser \| other_authorised_service_provider` |
| `status` | `active \| revoked` |
| `revokedAt` | When representation ended |

A `ProfessionalRepresentative` row establishes the *relationship* (this CA acts for
this citizen, in principle); it does not by itself authorise any specific action —
individual `DelegatedTask`s, each scoped to a permission tier and often to one
`serviceRequestId`, are what actually grant capability. This mirrors real practice: a
citizen might engage a CA generally for tax matters but still want to approve each
specific filing before it's submitted.

## 4. `DelegatedTask` and the two delegation paths

| Field | Purpose |
|---|---|
| `assistantPersonId` | Whoever is doing the delegated work — a Family Administrator or a Professional Representative's `representativePerson` |
| `professionalRepresentativeId` | Optional — set when this task is being performed under an existing `ProfessionalRepresentative` relationship |
| `serviceRequestId` | Optional — the specific request this task concerns |
| `permissionTier` | One of the six tiers above |
| `status` | `pending_owner_approval \| approved \| rejected \| completed` |

**Two distinct delegation paths, same model:**

- **Family Administrator path** — `assistantPersonId` set, `professionalRepresentativeId`
  left null. A family member helping a parent, spouse, or dependant directly, with no
  professional-services relationship involved.
- **Professional Representative path** — `professionalRepresentativeId` set (and
  `assistantPersonId` typically equal to that representative's own `Person`), so the
  task is explicitly tied back to the CA/lawyer/adviser relationship for audit and
  scoping purposes.

## 5. The account-owner approval loop

Every `DelegatedTask` defaults to `status=pending_owner_approval` — even a low-stakes
`permission_to_view` task requires the account owner (the principal) to explicitly
approve it before the assistant can use it. This is a deliberate consent-first
choice: *no* delegated capability, however minor, becomes active without the owner's
affirmative action.

*Assumption, clearly labelled:* the schema's `status` field models the lifecycle of
the delegation grant itself (is this assistant allowed to do this task at all), not a
separate per-action checkpoint layered on top. The **application-layer** enforcement
of "prepare is not submit" therefore works like this:

```
DelegatedTask created (status = pending_owner_approval)
        │
        ▼
Owner reviews and approves the grant (status = approved)
        │
        ▼
Assistant now operates strictly within permissionTier:
   - permission_to_view / assist → read-only or advisory UI only
   - permission_to_prepare       → can fill/assemble a ServiceRequest up to
                                    ready_to_submit, but the submit action itself
                                    is not exposed to them — the UI instead offers
                                    "Send to [Owner] for final submission"
   - permission_to_submit        → submit action IS exposed, because the owner's
                                    prior approval of this specific tier already
                                    covers it
   - permission_to_sign          → Signature action exposed, same logic
        │
        ▼
DelegatedTask marked completed once its scoped work is done
```

In practice this means: **a Family Administrator or Professional Representative can
always prepare, but cannot submit anything above `permission_to_assist` unless the
owner has separately approved a task at `permission_to_submit` (or `permission_to_sign`)
tier for that same request.** The owner remains the one who submits, unless they have
explicitly and separately delegated that specific higher-tier permission.

## 6. Consent and audit under the hood

Every delegated capability rides on top of the same consent architecture the rest of
the platform uses: a `ConsentPurpose` (e.g. `profile_sync`, `document_fetch`) scoped
by a `ConsentScope` (which institution/account/document/time window), with actual
disclosures logged as `DataShare` rows (fields shared, never raw values, timestamped).
A `DelegatedTask` does not bypass this — an assistant viewing a document or profile
field still generates the same `DataShare` audit trail a direct institutional
disclosure would, so "who saw what, under what permission, when" is always
reconstructable.

## 7. Explicitly distinct from `TrustedContact` / `AccessGrant` / `AccessPolicy`

The Legacy & Succession domain has its own, older access model —
`TrustedContact` → `AccessGrant` → `AccessPolicy` — and it is easy to conflate with
`DelegatedTask` because both involve "someone else gets access." They are not the
same mechanism, and the two must never be merged in product or engineering thinking:

| | `DelegatedTask` (Domain H) | `TrustedContact` / `AccessGrant` (Legacy & Succession) |
|---|---|---|
| **When it's active** | Any time, for a living citizen going about everyday administration | Only around death — `AccessPolicy.timingRule` is `immediate \| after_verified_death \| after_waiting_period \| requires_co_approval`, and most policies gate on `after_verified_death` |
| **What it grants** | Graduated action capability — view, assist, prepare, submit, sign, receive communication | Read-only visibility, at a chosen `visibilityLevel` (`none \| plan_exists_confirmation \| emergency_contacts_only \| selected_documents \| selected_asset_categories \| full_inventory_no_balances`) — no ability to act, ever |
| **Can it act on a `ServiceRequest`?** | Yes, up to its `permissionTier` | No — it is a viewing role only |
| **Governing life moment** | Everyday living-person assistance | Bereavement / incapacity-adjacent emergency access |
| **Approval model** | Owner approves each `DelegatedTask` explicitly, tier by tier | Grantor sets up the `AccessPolicy` and `AccessGrant` in advance, for a moment they will not be present to approve in real time |

A Family Administrator helping a parent renew a driving licence this month is a
`DelegatedTask`. A daughter who can see "a plan exists" and emergency contacts only
after her father's death has been verified is a `TrustedContact` with an
`AccessGrant`. They are two different data models, activated by two different kinds
of event, and a person can validly hold both roles for the same principal at once
without either one substituting for the other.
