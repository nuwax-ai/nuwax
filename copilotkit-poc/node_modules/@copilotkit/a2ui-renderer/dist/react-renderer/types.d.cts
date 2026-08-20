import { A2UIClientEventMessage, Theme } from "../a2ui-types.cjs";

//#region src/react-renderer/types.d.ts
type Types = Record<string, any>;
type Primitives = Record<string, any>;
type AnyComponentNode = any;
type Surface = any;
type SurfaceID = string;
type ServerToClientMessage = Record<string, unknown>;
type Action = any;
type DataValue = any;
type MessageProcessor = any;
type StringValue = any;
type NumberValue = any;
type BooleanValue = any;
/**
 * @deprecated - v0.9 components are handled by the catalog system.
 */
interface A2UIComponentProps<T = any> {
  node: T;
  surfaceId: string;
}
/** @deprecated - v0.9 components are loaded by the catalog. */
type ComponentLoader<_T = any> = () => Promise<{
  default: any;
}>;
/** @deprecated - v0.9 uses Catalog instead of ComponentRegistration. */
interface ComponentRegistration<_T = any> {
  component: any;
  lazy?: boolean;
}
/**
 * Callback for when a user action is dispatched.
 */
type OnActionCallback = (message: A2UIClientEventMessage) => void | Promise<void>;
/**
 * Configuration options for the A2UI provider.
 */
interface A2UIProviderConfig {
  onAction?: OnActionCallback;
  theme?: Theme;
}
//#endregion
export { A2UIComponentProps, A2UIProviderConfig, Action, AnyComponentNode, BooleanValue, ComponentLoader, ComponentRegistration, DataValue, MessageProcessor, NumberValue, OnActionCallback, Primitives, ServerToClientMessage, StringValue, Surface, SurfaceID, Types };
//# sourceMappingURL=types.d.cts.map