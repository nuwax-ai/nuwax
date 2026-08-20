//#region src/a2ui-types.d.ts
/**
 * v0.9 A2UI type definitions for CopilotKit integration.
 */
/** Theme type - v0.9 themes are passed via createSurface message */
type Theme = Record<string, unknown>;
/**
 * Client event message dispatched when a user interacts with an A2UI surface.
 * This is the format expected by A2UIMessageRenderer's handleAction.
 */
interface A2UIClientEventMessage {
  userAction?: {
    name: string;
    surfaceId: string;
    sourceComponentId?: string;
    context?: Record<string, unknown>;
    timestamp?: string;
    dataContextPath?: string;
  };
}
/** Default surface ID when none is specified */
declare const DEFAULT_SURFACE_ID = "default";
//#endregion
export { A2UIClientEventMessage, DEFAULT_SURFACE_ID, Theme };
//# sourceMappingURL=a2ui-types.d.mts.map