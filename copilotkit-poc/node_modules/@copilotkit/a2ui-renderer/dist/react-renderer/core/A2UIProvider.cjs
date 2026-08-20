const require_runtime = require('../../_virtual/_rolldown/runtime.cjs');
const require_index = require('../a2ui-react/catalog/basic/index.cjs');
require('../a2ui-react/index.cjs');
const require_ThemeContext = require('../theme/ThemeContext.cjs');
let react = require("react");
let _a2ui_web_core_v0_9 = require("@a2ui/web_core/v0_9");
let react_jsx_runtime = require("react/jsx-runtime");

//#region src/react-renderer/core/A2UIProvider.tsx
/**
* Context for stable actions (never changes reference, prevents re-renders).
*/
const A2UIActionsContext = (0, react.createContext)(null);
/**
* Context for reactive state (changes trigger re-renders).
*/
const A2UIStateContext = (0, react.createContext)(null);
/**
* Provider component that sets up the A2UI v0.9 context for descendant components.
* Uses a two-context architecture for performance:
* - A2UIActionsContext: Stable actions that never change (no re-renders)
* - A2UIStateContext: Reactive state that triggers re-renders when needed
*/
function A2UIProvider({ onAction, theme, catalog, children }) {
	const onActionRef = (0, react.useRef)(onAction ?? null);
	onActionRef.current = onAction ?? null;
	const processorRef = (0, react.useRef)(null);
	if (!processorRef.current) processorRef.current = new _a2ui_web_core_v0_9.MessageProcessor([catalog ?? require_index.basicCatalog], (action) => {
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
	const [version, setVersion] = (0, react.useState)(0);
	const [error, setError] = (0, react.useState)(null);
	const actionsRef = (0, react.useRef)(null);
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
	const stateValue = (0, react.useMemo)(() => ({
		version,
		error
	}), [version, error]);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(A2UIActionsContext.Provider, {
		value: actions,
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(A2UIStateContext.Provider, {
			value: stateValue,
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(require_ThemeContext.ThemeProvider, {
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
	const actions = (0, react.useContext)(A2UIActionsContext);
	if (!actions) throw new Error("useA2UIActions must be used within an A2UIProvider");
	return actions;
}
/**
* Hook to subscribe to A2UI state changes.
*/
function useA2UIState() {
	const state = (0, react.useContext)(A2UIStateContext);
	if (!state) throw new Error("useA2UIState must be used within an A2UIProvider");
	return state;
}
/**
* Hook to access the full A2UI context (actions + state).
*/
function useA2UIContext() {
	const actions = useA2UIActions();
	const state = useA2UIState();
	return (0, react.useMemo)(() => ({
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
	return (0, react.useContext)(A2UIStateContext)?.error ?? null;
}
/** @deprecated Use useA2UIContext() or useA2UI() directly instead. */
function useA2UIStoreSelector(selector) {
	return selector(useA2UIContext());
}

//#endregion
exports.A2UIProvider = A2UIProvider;
exports.useA2UIActions = useA2UIActions;
exports.useA2UIContext = useA2UIContext;
exports.useA2UIError = useA2UIError;
exports.useA2UIState = useA2UIState;
exports.useA2UIStore = useA2UIStore;
exports.useA2UIStoreSelector = useA2UIStoreSelector;
//# sourceMappingURL=A2UIProvider.cjs.map