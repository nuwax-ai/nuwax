import { basicCatalog } from "../a2ui-react/catalog/basic/index.mjs";
import "../a2ui-react/index.mjs";
import { ThemeProvider } from "../theme/ThemeContext.mjs";
import { createContext, useContext, useMemo, useRef, useState } from "react";
import { MessageProcessor } from "@a2ui/web_core/v0_9";
import { jsx } from "react/jsx-runtime";

//#region src/react-renderer/core/A2UIProvider.tsx
/**
* Context for stable actions (never changes reference, prevents re-renders).
*/
const A2UIActionsContext = createContext(null);
/**
* Context for reactive state (changes trigger re-renders).
*/
const A2UIStateContext = createContext(null);
/**
* Provider component that sets up the A2UI v0.9 context for descendant components.
* Uses a two-context architecture for performance:
* - A2UIActionsContext: Stable actions that never change (no re-renders)
* - A2UIStateContext: Reactive state that triggers re-renders when needed
*/
function A2UIProvider({ onAction, theme, catalog, children }) {
	const onActionRef = useRef(onAction ?? null);
	onActionRef.current = onAction ?? null;
	const processorRef = useRef(null);
	if (!processorRef.current) processorRef.current = new MessageProcessor([catalog ?? basicCatalog], (action) => {
		if (onActionRef.current) {
			const message = { userAction: {
				name: action?.name ?? "unknown",
				surfaceId: action?.surfaceId ?? "default",
				sourceComponentId: action?.sourceComponentId,
				context: action?.context,
				timestamp: action?.timestamp ?? (/* @__PURE__ */ new Date()).toISOString()
			} };
			onActionRef.current(message);
		}
	});
	const processor = processorRef.current;
	const [version, setVersion] = useState(0);
	const [error, setError] = useState(null);
	const actionsRef = useRef(null);
	if (!actionsRef.current) actionsRef.current = {
		processMessages: (messages) => {
			try {
				processor.processMessages(messages);
			} catch (err) {
				console.warn("[A2UI] processMessages error:", err);
				setError(err instanceof Error ? err.message : String(err));
				return;
			}
			setError(null);
			setVersion((v) => v + 1);
		},
		dispatch: (message) => {
			if (onActionRef.current) onActionRef.current(message);
		},
		getSurface: (surfaceId) => {
			return processor.model.getSurface(surfaceId);
		},
		clearSurfaces: () => {
			const surfaces = processor.model.surfacesMap;
			for (const [id] of surfaces) processor.processMessages([{
				version: "v0.9",
				deleteSurface: { surfaceId: id }
			}]);
			setVersion((v) => v + 1);
		}
	};
	const actions = actionsRef.current;
	const stateValue = useMemo(() => ({
		version,
		error
	}), [version, error]);
	return /* @__PURE__ */ jsx(A2UIActionsContext.Provider, {
		value: actions,
		children: /* @__PURE__ */ jsx(A2UIStateContext.Provider, {
			value: stateValue,
			children: /* @__PURE__ */ jsx(ThemeProvider, {
				theme,
				children
			})
		})
	});
}
/**
* Hook to access stable A2UI actions (won't cause re-renders).
*/
function useA2UIActions() {
	const actions = useContext(A2UIActionsContext);
	if (!actions) throw new Error("useA2UIActions must be used within an A2UIProvider");
	return actions;
}
/**
* Hook to subscribe to A2UI state changes.
*/
function useA2UIState() {
	const state = useContext(A2UIStateContext);
	if (!state) throw new Error("useA2UIState must be used within an A2UIProvider");
	return state;
}
/**
* Hook to access the full A2UI context (actions + state).
*/
function useA2UIContext() {
	const actions = useA2UIActions();
	const state = useA2UIState();
	return useMemo(() => ({
		...actions,
		version: state.version,
		onAction: null
	}), [actions, state.version]);
}
/** @deprecated Use useA2UIContext instead. */
const useA2UIStore = useA2UIContext;
/**
* Hook to access the current A2UI error state.
*/
function useA2UIError() {
	return useContext(A2UIStateContext)?.error ?? null;
}
/** @deprecated Use useA2UIContext() or useA2UI() directly instead. */
function useA2UIStoreSelector(selector) {
	return selector(useA2UIContext());
}

//#endregion
export { A2UIProvider, useA2UIActions, useA2UIContext, useA2UIError, useA2UIState, useA2UIStore, useA2UIStoreSelector };
//# sourceMappingURL=A2UIProvider.mjs.map