const require_A2UIProvider = require('../core/A2UIProvider.cjs');

//#region src/react-renderer/hooks/useA2UI.ts
/**
* Main API hook for A2UI v0.9. Provides methods to process messages
* and access surface state.
*/
function useA2UI() {
	const actions = require_A2UIProvider.useA2UIActions();
	const state = require_A2UIProvider.useA2UIState();
	return {
		processMessages: actions.processMessages,
		getSurface: actions.getSurface,
		clearSurfaces: actions.clearSurfaces,
		version: state.version
	};
}

//#endregion
exports.useA2UI = useA2UI;
//# sourceMappingURL=useA2UI.cjs.map