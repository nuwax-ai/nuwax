//#region src/utils/console-styling.d.ts
/**
 * Console styling utilities for CopilotKit branded messages
 * Provides consistent, readable colors across light and dark console themes
 */
/**
 * Color palette optimized for console readability
 */
declare const ConsoleColors: {
  /** Primary brand blue - for titles and links */readonly primary: "#007acc"; /** Success green - for positive messaging */
  readonly success: "#22c55e"; /** Purple - for feature highlights */
  readonly feature: "#a855f7"; /** Red - for calls-to-action */
  readonly cta: "#ef4444"; /** Cyan - for closing statements */
  readonly info: "#06b6d4"; /** Inherit console default - for body text */
  readonly inherit: "inherit"; /** Warning style */
  readonly warning: "#f59e0b";
};
/**
 * Console style templates for common patterns
 */
declare const ConsoleStyles: {
  /** Large header style */readonly header: "color: #f59e0b; font-weight: bold; font-size: 16px;"; /** Section header style */
  readonly section: "color: #22c55e; font-weight: bold;"; /** Feature highlight style */
  readonly highlight: "color: #a855f7; font-weight: bold;"; /** Call-to-action style */
  readonly cta: "color: #22c55e; font-weight: bold;"; /** Info style */
  readonly info: "color: #06b6d4; font-weight: bold;"; /** Link style */
  readonly link: "color: #007acc; text-decoration: underline;"; /** Body text - inherits console theme */
  readonly body: "color: inherit;"; /** Warning style */
  readonly warning: "color: #ef4444; font-weight: bold;";
};
/**
 * Styled console message for CopilotKit Platform promotion
 * Displays a beautiful, branded advertisement in the console
 */
declare function logCopilotKitPlatformMessage(): void;
declare function publicApiKeyRequired(feature: string): void;
/**
 * Create a styled console message with custom content
 *
 * @param template - Template string with %c placeholders
 * @param styles - Array of style strings matching the %c placeholders
 *
 * @example
 * ```typescript
 * logStyled(
 *   '%cCopilotKit%c Welcome to the platform!',
 *   [ConsoleStyles.header, ConsoleStyles.body]
 * );
 * ```
 */
declare function logStyled(template: string, styles: string[]): void;
/**
 * Quick styled console methods for common use cases
 */
declare const styledConsole: {
  /** Log a success message */readonly success: (message: string) => void; /** Log an info message */
  readonly info: (message: string) => void; /** Log a feature highlight */
  readonly feature: (message: string) => void; /** Log a call-to-action */
  readonly cta: (message: string) => void; /** Log the CopilotKit platform promotion */
  readonly logCopilotKitPlatformMessage: typeof logCopilotKitPlatformMessage; /** Log a `publicApiKeyRequired` warning */
  readonly publicApiKeyRequired: typeof publicApiKeyRequired;
};
//#endregion
export { ConsoleColors, ConsoleStyles, logCopilotKitPlatformMessage, logStyled, publicApiKeyRequired, styledConsole };
//# sourceMappingURL=console-styling.d.cts.map