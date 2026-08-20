//#region src/utils/clipboard.ts
/**
* Safely copies text to the clipboard.
*
* Checks that the Clipboard API is available before attempting the write,
* and catches any errors (e.g. permission denied, insecure context).
*
* @param text - The text to copy to the clipboard.
* @returns `true` if the text was successfully copied, `false` otherwise.
*/
async function copyToClipboard(text) {
	if (!navigator.clipboard?.writeText) {
		console.error("Clipboard API is not available");
		return false;
	}
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch (err) {
		console.error("Failed to copy to clipboard:", err);
		return false;
	}
}

//#endregion
export { copyToClipboard };
//# sourceMappingURL=clipboard.mjs.map