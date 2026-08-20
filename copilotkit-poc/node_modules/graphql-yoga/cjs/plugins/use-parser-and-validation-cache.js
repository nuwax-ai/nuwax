"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useParserAndValidationCache = useParserAndValidationCache;
const create_lru_cache_js_1 = require("../utils/create-lru-cache.js");
function useParserAndValidationCache({ documentCache = (0, create_lru_cache_js_1._createLRUCache)(), errorCache = (0, create_lru_cache_js_1._createLRUCache)(), validationCache = true, }) {
    const validationCacheByRules = (0, create_lru_cache_js_1._createLRUCache)();
    return {
        onParse({ params, setParsedDocument }) {
            const strDocument = params.source.toString();
            const document = documentCache.get(strDocument);
            if (document) {
                setParsedDocument(document);
                return;
            }
            const parserError = errorCache.get(strDocument);
            if (parserError) {
                throw parserError;
            }
            return ({ result }) => {
                if (result != null) {
                    if (result instanceof Error) {
                        errorCache.set(strDocument, result);
                    }
                    else {
                        documentCache.set(strDocument, result);
                    }
                }
            };
        },
        onValidate({ params: { schema, documentAST, rules }, setResult,
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
         }) {
            /** No schema no cache */
            if (schema == null) {
                return;
            }
            if (validationCache !== false) {
                const rulesKey = rules?.map((rule) => rule.name).join(',') || '';
                let validationCacheBySchema = validationCacheByRules.get(rulesKey);
                if (!validationCacheBySchema) {
                    validationCacheBySchema = new WeakMap();
                    validationCacheByRules.set(rulesKey, validationCacheBySchema);
                }
                let validationCacheByDocument = validationCacheBySchema.get(schema);
                if (!validationCacheByDocument) {
                    validationCacheByDocument = new WeakMap();
                    validationCacheBySchema.set(schema, validationCacheByDocument);
                }
                const cachedResult = validationCacheByDocument.get(documentAST);
                if (cachedResult) {
                    setResult(cachedResult);
                    return;
                }
                return ({ result }) => {
                    if (result != null) {
                        validationCacheByDocument?.set(documentAST, result);
                    }
                };
            }
        },
    };
}
