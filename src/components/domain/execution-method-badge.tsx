import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Every Service Request / Life Event Action must disclose its execution method honestly —
 * see docs/TERMINOLOGY.md and docs/SERVICE_REQUEST_ENGINE.md. Never imply something is
 * "instant" when it is actually assisted, in-person, or requires approval.
 */
export const EXECUTION_METHOD_LABELS: Record<string, string> = {
  executable_via_api: "Completed directly in Suvidha",
  initiable_via_integration: "Started directly, tracked to completion",
  deep_link_redirect: "Continues on the institution's site (prefilled)",
  generated_form_packet: "Suvidha prepares the documents for you to submit",
  assisted_digital_workflow: "Guided step-by-step, submitted on your confirmation",
  in_person_required: "Requires a branch or office visit",
  requires_institution_approval: "Awaiting institution decision",
  requires_legal_intervention: "Needs legal or court review",
  unsupported: "Not yet supported — shown for tracking only",
};

const TONE: Record<string, string> = {
  executable_via_api: "border-transparent bg-success text-success-foreground",
  initiable_via_integration: "border-transparent bg-success text-success-foreground",
  deep_link_redirect: "border-transparent bg-secondary text-secondary-foreground",
  generated_form_packet: "border-transparent bg-secondary text-secondary-foreground",
  assisted_digital_workflow: "border-transparent bg-secondary text-secondary-foreground",
  in_person_required: "border-transparent bg-warning text-warning-foreground",
  requires_institution_approval: "border-transparent bg-warning text-warning-foreground",
  requires_legal_intervention: "border-transparent bg-destructive text-destructive-foreground",
  unsupported: "border-border bg-transparent text-muted-foreground",
};

export function ExecutionMethodBadge({ method }: { method: string }) {
  const label = EXECUTION_METHOD_LABELS[method] ?? method;
  return <Badge className={cn(TONE[method])}>{label}</Badge>;
}
