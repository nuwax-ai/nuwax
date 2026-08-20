import { Theme } from "../../a2ui-types.mjs";
import { OnActionCallback } from "../types.mjs";
import { A2UIActions, A2UIContextValue } from "./store.mjs";
import { ReactNode } from "react";
import * as react_jsx_runtime0 from "react/jsx-runtime";

//#region src/react-renderer/core/A2UIProvider.d.ts
/**
 * Props for the A2UIProvider component.
 */
interface A2UIProviderProps {
  /** Callback invoked when a user action is dispatched (button click, etc.) */
  onAction?: OnActionCallback;
  /** Theme configuration */
  theme?: Theme;
  /** Optional component catalog to use instead of the default basicCatalog */
  catalog?: any;
  /** Child components */
  children: ReactNode;
}
/**
 * Provider component that sets up the A2UI v0.9 context for descendant components.
 * Uses a two-context architecture for performance:
 * - A2UIActionsContext: Stable actions that never change (no re-renders)
 * - A2UIStateContext: Reactive state that triggers re-renders when needed
 */
declare function A2UIProvider({
  onAction,
  theme,
  catalog,
  children
}: A2UIProviderProps): react_jsx_runtime0.JSX.Element;
/**
 * Hook to access stable A2UI actions (won't cause re-renders).
 */
declare function useA2UIActions(): A2UIActions;
/**
 * Hook to subscribe to A2UI state changes.
 */
declare function useA2UIState(): {
  version: number;
};
/**
 * Hook to access the full A2UI context (actions + state).
 */
declare function useA2UIContext(): A2UIContextValue;
/** @deprecated Use useA2UIContext instead. */
declare const useA2UIStore: typeof useA2UIContext;
/**
 * Hook to access the current A2UI error state.
 */
declare function useA2UIError(): string | null;
/** @deprecated Use useA2UIContext() or useA2UI() directly instead. */
declare function useA2UIStoreSelector<T>(selector: (state: A2UIContextValue) => T): T;
//#endregion
export { A2UIProvider, A2UIProviderProps, useA2UIActions, useA2UIContext, useA2UIError, useA2UIState, useA2UIStore, useA2UIStoreSelector };
//# sourceMappingURL=A2UIProvider.d.mts.map