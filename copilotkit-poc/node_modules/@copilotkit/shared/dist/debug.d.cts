//#region src/debug.d.ts
/**
 * Granular debug configuration for CopilotKit runtime and client.
 * Pass `true` to enable events + lifecycle logging (but NOT verbose payloads),
 * or an object for granular control including `verbose: true` for full payloads.
 */
type DebugConfig = boolean | {
  /** Log every event emitted/received. Default: true */events?: boolean; /** Log request/run lifecycle. Default: true */
  lifecycle?: boolean; /** Log full event payloads instead of summaries. Default: false — must be explicitly opted in */
  verbose?: boolean;
};
/** Normalized debug configuration — all fields resolved to booleans. */
interface ResolvedDebugConfig {
  enabled: boolean;
  events: boolean;
  lifecycle: boolean;
  verbose: boolean;
}
/**
 * Normalizes a DebugConfig value into a ResolvedDebugConfig.
 *
 * - `false` / `undefined` → all off
 * - `true` → events + lifecycle on, verbose off (no PII in logs)
 * - object → merges with defaults (events: true, lifecycle: true, verbose: false)
 */
declare function resolveDebugConfig(debug: DebugConfig | undefined): ResolvedDebugConfig;
//#endregion
export { DebugConfig, ResolvedDebugConfig, resolveDebugConfig };
//# sourceMappingURL=debug.d.cts.map