// A no-op stand-in for the "server-only" package, used only under Vitest (see vitest.config.ts).
// Next.js's own bundler already aliases "server-only" to a no-op for server-side code; this
// mirrors that behaviour for unit tests, which run in plain Node/jsdom, not Next's bundler.
export {};
