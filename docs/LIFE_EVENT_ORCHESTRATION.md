# Life Event Orchestration

**Domain F of the lifelong citizen administration platform.** Source models:
`LifeEventTemplate`, `LifeEvent`, `LifeEventAction`, `Deadline`. See
`docs/TERMINOLOGY.md` §4 and `docs/SERVICE_REQUEST_ENGINE.md` for how each action
turns into an actual request.

## 1. The idea

A life event — moving house, changing jobs, a death in the family — never touches just
one institution. Today the citizen has to independently remember every place that
needs telling, in what order, and how urgently. Life Event Orchestration turns a
`LifeEventTemplate` (a curated catalogue entry with a default action playbook) into a
`LifeEvent` instance the moment a citizen tells Suvidha "this happened to me," and
generates the ordered, dependency-aware plan of `LifeEventAction`s across the
citizen's actual `InstitutionRelationship`s — not a generic checklist, but one scoped
to the institutions this specific citizen actually has relationships with.

## 2. The model chain

```
LifeEventTemplate (catalog, 25 entries)
        │
        ▼
LifeEvent (one instance per citizen per occurrence)
   status: in_progress | completed | abandoned
   progressPercent
        │
        ▼
LifeEventAction (one per affected institution/action)
   priority: mandatory | recommended | optional
   sequenceOrder, dependsOnActionId
   executionMethod (same 9-value vocabulary as ServiceRequest)
   status: pending | in_progress | completed | skipped
   optionally → InstitutionRelationship
        │
        ▼
generates → ServiceRequest(s), and/or → Deadline(s)
```

`LifeEvent.serviceRequests` is a direct back-relation: the `ServiceRequest`s spawned
by an event's actions all carry `lifeEventId`, so the event view can show "6 of 9
actions complete" while the request view can independently show each request's own
detailed status (Domain D).

## 3. The 25 life-event templates

| `eventKey` | Title |
|---|---|
| `address_change` | Moving address |
| `mobile_number_change` | Mobile or email change |
| `name_correction` | Name correction |
| `marriage` | Marriage |
| `divorce` | Divorce |
| `birth_or_adoption` | Birth or adoption |
| `turning_18` | Turning 18 |
| `first_job` | First job |
| `job_change` | Job change |
| `job_loss` | Job loss |
| `business_start` | Starting a business |
| `business_close` | Closing a business |
| `property_purchase` | Property purchase |
| `property_sale` | Property sale |
| `vehicle_purchase` | Vehicle purchase |
| `interstate_move` | Interstate move |
| `move_abroad` | Moving abroad |
| `return_to_india` | Returning to India |
| `retirement` | Retirement |
| `incapacity` | Incapacity |
| `hospitalisation` | Hospitalisation |
| `lost_documents` | Lost documents |
| `identity_theft` | Identity theft |
| `family_bereavement` | Family bereavement |
| `account_owner_death` | Account-owner death |

The last two templates are the handoff point to the Legacy & Succession domain
(`docs/LEGACY_AND_SUCCESSION.md`): a `family_bereavement` or `account_owner_death`
`LifeEvent` for a *surviving* citizen coordinates their own everyday actions (notifying
their own employer of bereavement leave, for instance), while the deceased person's
own record moves through the separate `DeathEvent` lifecycle — the two are related in
time but are handled by different models, deliberately.

## 4. Worked example, in full: "I have moved to a new address"

`LifeEventTemplate(eventKey="address_change")` generates a `LifeEvent` whose plan
covers every affected system the citizen actually has a relationship with. The
sequence below reflects one realistic instance (a resident citizen with a bank
account, an investment folio, an insurance policy, a car, a salaried job, and a
telecom connection) and the dependency logic behind the ordering.

**Sequencing principle:** update the government identity record first (Aadhaar),
because several downstream institutions accept an updated Aadhaar as supporting
address evidence — this is why Aadhaar sits at `sequenceOrder=1` with no dependency,
and most other mandatory actions declare `dependsOnActionId` pointing back to it.

| Seq | System | Action | Priority | `executionMethod` | Depends on |
|---|---|---|---|---|---|
| 1 | Aadhaar (UIDAI) | Update address on Aadhaar | **mandatory** | `assisted_digital_workflow` | — |
| 2 | Bank(s) | Update registered address at each bank relationship | **mandatory** | `initiable_via_integration` | Aadhaar (1) |
| 3 | Investments (demat/mutual funds) | Update KYC address with depository/AMC | **mandatory** | `initiable_via_integration` | Aadhaar (1) |
| 4 | Insurance | Update address on active policies | **mandatory** | `deep_link_redirect` | Aadhaar (1) |
| 5 | Driving licence | Update address at RTO | **mandatory** | `generated_form_packet` | Aadhaar (1) |
| 6 | Employer | Update HR records / payroll address | **mandatory** | `assisted_digital_workflow` | — |
| 7 | Vehicle registration (RC) | Update RC address at RTO | **recommended** | `generated_form_packet` | Driving licence (5) |
| 8 | Voter record | Update electoral roll entry (Form 8) | **recommended** | `assisted_digital_workflow` | Aadhaar (1) |
| 9 | Tax profile | Update address in income-tax e-filing profile | **recommended** | `initiable_via_integration` | Aadhaar (1) |
| 10 | Passport (if held) | Update address on passport | **recommended** | `assisted_digital_workflow` | Aadhaar (1) |
| 11 | Telecom | Update billing address / re-verify SIM at new address | **mandatory** | `deep_link_redirect` | — |
| 12 | Utilities | Start new connection / transfer or close old connection | **mandatory** | `in_person_required` | — |
| 13 | Property records | Update correspondence address with sub-registrar/municipal records (only if the citizen owns property elsewhere and wants correspondence redirected) | **optional** | `in_person_required` | — |

**Honest note on execution methods:** no step in this example is realistically
`executable_via_api` today, and the plan doesn't pretend otherwise — most Indian
institutions do not expose a direct write API for KYC-sensitive fields like address to
a third party, even a consented one. This is a deliberate reflection of the "never
claim every service is instantly digitally executable" principle: the value Suvidha
adds here is in surfacing the *complete, correctly sequenced list* and pre-filling
what it can, not in falsely promising one-click completion for actions that, in
reality, require institution-side verification.

**How the five practical outcomes map onto `executionMethod` in this example:**

- *Completed inside the platform* — none, honestly, for this event (see above).
- *Initiated inside the platform, tracked to completion* — bank, investments, tax
  profile (`initiable_via_integration`): Suvidha submits the update request through the
  regulated integration and tracks the institution's own status through to
  `completed`.
- *Prefilled and continued externally* — insurance, telecom (`deep_link_redirect`):
  Suvidha opens the institution's own portal/app with the new address pre-filled where
  the institution's URL scheme allows it; the citizen finishes the last step there.
- *Completed via generated documents* — driving licence, RC (`generated_form_packet`):
  Suvidha fills the correct government form with the citizen's data; the citizen signs
  and submits it (in person or by post, per that institution's own process).
- *In-person only* — utilities, property records (`in_person_required`): no digital
  path exists; Suvidha still creates the action, the checklist, and a `Deadline`, but
  is explicit that a visit is required.

Each mandatory action also generates a `Deadline` (e.g. driving licence address
updates carry a statutory window in several states); `LifeEvent.progressPercent`
advances as actions move to `completed`, and the event itself only reaches
`status=completed` once every `mandatory` action is done (`recommended` and
`optional` actions can remain open without blocking the event's own completion,
though they stay visible until the citizen explicitly marks them `skipped` or
completes them).
