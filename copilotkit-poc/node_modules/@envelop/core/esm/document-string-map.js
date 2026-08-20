export const documentStringMap = new WeakMap();
function getDocumentString(document, print) {
    let documentSource = documentStringMap.get(document);
    if (!documentSource && print) {
        documentSource = print(document);
        documentStringMap.set(document, documentSource);
    }
    return documentSource;
}
export { getDocumentString };
