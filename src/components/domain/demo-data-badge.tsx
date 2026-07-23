import { Badge } from "@/components/ui/badge";

/**
 * Required everywhere synthetic data is shown — see docs/PRIVACY.md. Never remove this without
 * replacing it with a real data source.
 */
export function DemoDataBadge({ label = "Demo data" }: { label?: string }) {
  return <Badge variant="demo">{label}</Badge>;
}
