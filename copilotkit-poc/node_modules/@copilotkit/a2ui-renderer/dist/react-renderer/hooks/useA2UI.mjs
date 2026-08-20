import { useA2UIActions, useA2UIState } from "../core/A2UIProvider.mjs";

//#region src/react-renderer/hooks/useA2UI.ts
/**
* Main API hook for A2UI v0.9. Provides methods to process messages
* and access surface state.
*/
function useA2UI() {
	const actions = useA2UIActions();
	const state = useA2UIState();
	return {
		processMessages: actions.processMessages,
		getSurface: actions.getSurface,
		clearSurfaces: actions.clearSurfaces,
		version: state.version
	};
}

//#endregion
export { useA2UI };
//# sourceMappingURL=useA2UI.mjs.map