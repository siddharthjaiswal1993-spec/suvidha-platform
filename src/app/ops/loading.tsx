export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-48 animate-pulse rounded bg-muted" />
      <div className="h-32 w-full animate-pulse rounded-lg bg-muted" />
      <div className="h-32 w-full animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
