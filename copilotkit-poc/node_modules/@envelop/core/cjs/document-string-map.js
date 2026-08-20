"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentStringMap = void 0;
exports.getDocumentString = getDocumentString;
exports.documentStringMap = new WeakMap();
function getDocumentString(document, print) {
    let documentSource = exports.documentStringMap.get(document);
    if (!documentSource && print) {
        documentSource = print(document);
        exports.documentStringMap.set(document, documentSource);
    }
    return documentSource;
}
