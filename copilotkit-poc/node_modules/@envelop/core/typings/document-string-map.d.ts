export declare const documentStringMap: WeakMap<any, string>;
declare function getDocumentString<TDocumentNode>(document: TDocumentNode, print: (doc: TDocumentNode) => string): string;
declare function getDocumentString<TDocumentNode>(document: TDocumentNode): string | undefined;
export { getDocumentString };
