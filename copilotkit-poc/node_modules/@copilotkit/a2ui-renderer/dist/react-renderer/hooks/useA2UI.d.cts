//#region src/react-renderer/hooks/useA2UI.d.ts
/**
 * Result returned by the useA2UI hook.
 */
interface UseA2UIResult {
  /** Process incoming v0.9 A2UI messages */
  processMessages: (messages: Array<Record<string, unknown>>) => void;
  /** Get a surface model by ID */
  getSurface: (surfaceId: string) => any | undefined;
  /** Clear all surfaces */
  clearSurfaces: () => void;
  /** The current version number (increments on state changes) */
  version: number;
}
/**
 * Main API hook for A2UI v0.9. Provides methods to process messages
 * and access surface state.
 */
declare function useA2UI(): UseA2UIResult;
//#endregion
export { UseA2UIResult, useA2UI };
//# sourceMappingURL=useA2UI.d.cts.map