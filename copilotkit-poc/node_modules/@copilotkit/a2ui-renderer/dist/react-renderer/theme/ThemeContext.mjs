import { createContext, useContext } from "react";
import { jsx } from "react/jsx-runtime";

//#region src/react-renderer/theme/ThemeContext.tsx
/** React context for the A2UI theme. */
const ThemeContext = createContext(void 0);
function ThemeProvider({ theme, children }) {
	return /* @__PURE__ */ jsx(ThemeContext.Provider, {
		value: theme ?? {},
		children
	});
}
function useTheme() {
	const theme = useContext(ThemeContext);
	if (!theme) throw new Error("useTheme must be used within a ThemeProvider or A2UIProvider");
	return theme;
}
function useThemeOptional() {
	return useContext(ThemeContext);
}

//#endregion
export { ThemeProvider, useTheme, useThemeOptional };
//# sourceMappingURL=ThemeContext.mjs.map