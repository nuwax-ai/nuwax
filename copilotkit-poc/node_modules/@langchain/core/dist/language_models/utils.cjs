//#region src/language_models/utils.ts
const iife = (fn) => fn();
function castStandardMessageContent(message) {
	const Cls = message.constructor;
	return new Cls({
		...message,
		content: message.contentBlocks,
		response_metadata: {
			...message.response_metadata,
			output_version: "v1"
		}
	});
}
//#endregion
exports.castStandardMessageContent = castStandardMessageContent;
exports.iife = iife;

//# sourceMappingURL=utils.cjs.map