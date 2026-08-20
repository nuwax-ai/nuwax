//#region src/stream/types.ts
/**
* Type guard that tests whether a transformer is a {@link NativeStreamTransformer}.
*/
function isNativeTransformer(t) {
	return "__native" in t && t.__native === true;
}
//#endregion
export { isNativeTransformer };

//# sourceMappingURL=types.js.map