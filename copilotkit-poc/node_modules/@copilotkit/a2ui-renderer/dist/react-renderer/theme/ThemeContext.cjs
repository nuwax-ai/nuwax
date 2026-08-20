const require_runtime = require('../../_virtual/_rolldown/runtime.cjs');
let react = require("react");
let react_jsx_runtime = require("react/jsx-runtime");

//#region src/react-renderer/theme/ThemeContext.tsx
/** React context for the A2UI theme. */
const ThemeContext = (0, react.createContext)(void 0);
function ThemeProvider({ theme, children }) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ThemeContext.Provider, {
		value: theme ?? {},
		children
	});
}
function useTheme() {
	const theme = (0, react.useContext)(ThemeContext);
	if (!theme) throw new Error("useTheme must be used within a ThemeProvider or A2UIProvider");
	return theme;
}
function useThemeOptional() {
	return (0, react.useContext)(ThemeContext);
}

//#endregion
exports.ThemeProvider = ThemeProvider;
exports.useTheme = useTheme;
exports.useThemeOptional = useThemeOptional;
//# sourceMappingURL=ThemeContext.cjs.map