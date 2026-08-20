//#region src/utils/clipboard.d.ts
/**
 * Safely copies text to the clipboard.
 *
 * Checks that the Clipboard API is available before attempting the write,
 * and catches any errors (e.g. permission denied, insecure context).
 *
 * @param text - The text to copy to the clipboard.
 * @returns `true` if the text was successfully copied, `false` otherwise.
 */
declare function copyToClipboard(text: string): Promise<boolean>;
//#endregion
export { copyToClipboard };
//# sourceMappingURL=clipboard.d.cts.map