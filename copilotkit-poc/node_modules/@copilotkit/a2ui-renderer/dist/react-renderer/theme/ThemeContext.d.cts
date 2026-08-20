import * as react_jsx_runtime0 from "react/jsx-runtime";
import { ReactNode } from "react";

//#region src/react-renderer/theme/ThemeContext.d.ts
type ThemeType = Record<string, unknown>;
interface ThemeProviderProps {
  theme?: ThemeType;
  children: ReactNode;
}
declare function ThemeProvider({
  theme,
  children
}: ThemeProviderProps): react_jsx_runtime0.JSX.Element;
declare function useTheme(): ThemeType;
declare function useThemeOptional(): ThemeType | undefined;
//#endregion
export { ThemeProvider, useTheme, useThemeOptional };
//# sourceMappingURL=ThemeContext.d.cts.map