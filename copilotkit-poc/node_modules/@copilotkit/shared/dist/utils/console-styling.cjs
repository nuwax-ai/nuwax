
//#region src/utils/console-styling.ts
/**
* Console styling utilities for CopilotKit branded messages
* Provides consistent, readable colors across light and dark console themes
*/
/**
* Color palette optimized for console readability
*/
const ConsoleColors = {
	primary: "#007acc",
	success: "#22c55e",
	feature: "#a855f7",
	cta: "#ef4444",
	info: "#06b6d4",
	inherit: "inherit",
	warning: "#f59e0b"
};
/**
* Console style templates for common patterns
*/
const ConsoleStyles = {
	header: `color: ${ConsoleColors.warning}; font-weight: bold; font-size: 16px;`,
	section: `color: ${ConsoleColors.success}; font-weight: bold;`,
	highlight: `color: ${ConsoleColors.feature}; font-weight: bold;`,
	cta: `color: ${ConsoleColors.success}; font-weight: bold;`,
	info: `color: ${ConsoleColors.info}; font-weight: bold;`,
	link: `color: ${ConsoleColors.primary}; text-decoration: underline;`,
	body: `color: ${ConsoleColors.inherit};`,
	warning: `color: ${ConsoleColors.cta}; font-weight: bold;`
};
/**
* Styled console message for CopilotKit Platform promotion
* Displays a beautiful, branded advertisement in the console
*/
function logCopilotKitPlatformMessage() {
	console.log(`%cCopilotKit Warning%c

useCopilotChatHeadless_c provides full compatibility with CopilotKit's newly released Headless UI feature set. To enable this premium feature, add your public license key, available for free at:

%chttps://dashboard.operations.copilotkit.ai%c

Alternatively, useCopilotChat is available for basic programmatic control, and does not require a license key.

To learn more about premium features, read the documentation here:

%chttps://docs.copilotkit.ai/premium/overview%c`, ConsoleStyles.header, ConsoleStyles.body, ConsoleStyles.cta, ConsoleStyles.body, ConsoleStyles.link, ConsoleStyles.body);
}
function publicApiKeyRequired(feature) {
	console.log(`
%cCopilotKit Warning%c \n
In order to use ${feature}, you need to add your CopilotKit license key, available for free at https://dashboard.operations.copilotkit.ai.
    `.trim(), ConsoleStyles.header, ConsoleStyles.body);
}
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
function logStyled(template, styles) {
	console.log(template, ...styles);
}
/**
* Quick styled console methods for common use cases
*/
const styledConsole = {
	success: (message) => logStyled(`%c✅ ${message}`, [ConsoleStyles.section]),
	info: (message) => logStyled(`%cℹ️ ${message}`, [ConsoleStyles.info]),
	feature: (message) => logStyled(`%c✨ ${message}`, [ConsoleStyles.highlight]),
	cta: (message) => logStyled(`%c🚀 ${message}`, [ConsoleStyles.cta]),
	logCopilotKitPlatformMessage,
	publicApiKeyRequired
};

//#endregion
exports.ConsoleColors = ConsoleColors;
exports.ConsoleStyles = ConsoleStyles;
exports.logCopilotKitPlatformMessage = logCopilotKitPlatformMessage;
exports.logStyled = logStyled;
exports.publicApiKeyRequired = publicApiKeyRequired;
exports.styledConsole = styledConsole;
//# sourceMappingURL=console-styling.cjs.map