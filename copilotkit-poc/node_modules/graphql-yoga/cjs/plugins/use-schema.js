"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSchema = void 0;
const promise_helpers_1 = require("@whatwg-node/promise-helpers");
function isGraphQLSchema(schemaDef) {
    // @ts-expect-error - Symbol.toStringTag exists
    return schemaDef?.[Symbol.toStringTag] === 'GraphQLSchema';
}
const useSchema = (schemaDef) => {
    if (schemaDef == null) {
        return {};
    }
    if (isGraphQLSchema(schemaDef)) {
        return {
            onPluginInit({ setSchema }) {
                setSchema(schemaDef);
            },
        };
    }
    if ('then' in schemaDef) {
        let schema;
        return {
            onRequestParse() {
                return {
                    onRequestParseDone() {
                        if (!schema) {
                            return (0, promise_helpers_1.handleMaybePromise)(() => schemaDef, schemaDef => {
                                schema = schemaDef;
                            });
                        }
                    },
                };
            },
            onEnveloped({ setSchema }) {
                if (schema == null) {
                    throw new Error(`You provide a promise of a schema but it hasn't been resolved yet. Make sure you use this plugin with GraphQL Yoga.`);
                }
                if (!isGraphQLSchema(schema)) {
                    throw new Error(`The resolved schema is not a valid GraphQLSchema instance.`);
                }
                setSchema(schema);
            },
        };
    }
    if (typeof schemaDef === 'function') {
        const schemaByRequest = new WeakMap();
        return {
            onRequestParse({ request, serverContext }) {
                return {
                    onRequestParseDone() {
                        return (0, promise_helpers_1.handleMaybePromise)(() => schemaDef({
                            ...serverContext,
                            request,
                        }), schemaDef => {
                            if (!isGraphQLSchema(schemaDef)) {
                                throw new Error('The factory function did not return a valid GraphQLSchema.');
                            }
                            schemaByRequest.set(request, schemaDef);
                        });
                    },
                };
            },
            onEnveloped({ setSchema, context }) {
                if (context?.request == null) {
                    throw new Error('Request object is not available in the context. Make sure you use this plugin with GraphQL Yoga.');
                }
                const schema = schemaByRequest.get(context.request);
                if (schema == null) {
                    throw new Error(`No schema found for this request. Make sure you use this plugin with GraphQL Yoga.`);
                }
                setSchema(schema);
            },
        };
    }
    throw new Error(`Invalid schema definition provided, expected a schema, promise or function.`);
};
exports.useSchema = useSchema;
