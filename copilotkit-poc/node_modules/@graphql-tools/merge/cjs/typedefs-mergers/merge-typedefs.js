"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeTypeDefs = mergeTypeDefs;
exports.mergeGraphQLTypes = mergeGraphQLTypes;
const graphql_1 = require("graphql");
const utils_1 = require("@graphql-tools/utils");
const links_js_1 = require("../links.js");
const merge_nodes_js_1 = require("./merge-nodes.js");
const schema_def_js_1 = require("./schema-def.js");
const utils_js_1 = require("./utils.js");
function mergeTypeDefs(typeSource, config) {
    (0, utils_1.resetComments)();
    const doc = {
        kind: graphql_1.Kind.DOCUMENT,
        definitions: mergeGraphQLTypes(typeSource, {
            useSchemaDefinition: true,
            forceSchemaDefinition: false,
            throwOnConflict: false,
            commentDescriptions: false,
            ...config,
        }),
    };
    let result;
    if (config?.commentDescriptions) {
        result = (0, utils_1.printWithComments)(doc);
    }
    else {
        result = doc;
    }
    (0, utils_1.resetComments)();
    return result;
}
function visitTypeSources(typeSource, options, allDirectives = [], allNodes = [], visitedTypeSources = new Set(), repeatableLinkImports = new Set()) {
    const addRepeatable = (name) => {
        repeatableLinkImports.add(name);
    };
    if (typeSource && !visitedTypeSources.has(typeSource)) {
        visitedTypeSources.add(typeSource);
        if (typeof typeSource === 'function') {
            visitTypeSources(typeSource(), options, allDirectives, allNodes, visitedTypeSources, repeatableLinkImports);
        }
        else if (Array.isArray(typeSource)) {
            for (const type of typeSource) {
                visitTypeSources(type, options, allDirectives, allNodes, visitedTypeSources, repeatableLinkImports);
            }
        }
        else if ((0, graphql_1.isSchema)(typeSource)) {
            const documentNode = (0, utils_1.getDocumentNodeFromSchema)(typeSource, options);
            visitTypeSources(documentNode.definitions, options, allDirectives, allNodes, visitedTypeSources, repeatableLinkImports);
        }
        else if ((0, utils_js_1.isStringTypes)(typeSource) || (0, utils_js_1.isSourceTypes)(typeSource)) {
            const documentNode = (0, graphql_1.parse)(typeSource, options);
            visitTypeSources(documentNode.definitions, options, allDirectives, allNodes, visitedTypeSources, repeatableLinkImports);
        }
        else if (typeof typeSource === 'object' && (0, graphql_1.isDefinitionNode)(typeSource)) {
            const links = (0, links_js_1.extractLinks)({
                definitions: [typeSource],
                kind: graphql_1.Kind.DOCUMENT,
            });
            const federationUrl = 'https://specs.apollo.dev/federation';
            const linkUrl = 'https://specs.apollo.dev/link';
            /**
             * Official Federated imports are special because they can be referenced without specifyin the import.
             * To handle this case, we must prepare a list of all the possible valid usages to check against.
             * Note that this versioning is not technically correct, since some definitions are after v2.0.
             * But this is enough information to be comfortable not blocking the imports at this phase. It's
             * the job of the composer to validate the versions.
             * */
            const federationLink = links.find(l => l.url.identity === federationUrl);
            if (federationLink) {
                addRepeatable((0, links_js_1.resolveImportName)(federationLink, '@composeDirective'));
                addRepeatable((0, links_js_1.resolveImportName)(federationLink, '@key'));
            }
            const linkLink = links.find(l => l.url.identity === linkUrl);
            if (linkLink) {
                addRepeatable((0, links_js_1.resolveImportName)(linkLink, '@link'));
            }
            if (typeSource.kind === graphql_1.Kind.DIRECTIVE_DEFINITION) {
                allDirectives.push(typeSource);
            }
            else {
                allNodes.push(typeSource);
            }
        }
        else if ((0, utils_1.isDocumentNode)(typeSource)) {
            visitTypeSources(typeSource.definitions, options, allDirectives, allNodes, visitedTypeSources, repeatableLinkImports);
        }
        else {
            throw new Error(`typeDefs must contain only strings, documents, schemas, or functions, got ${typeof typeSource}`);
        }
    }
    return { allDirectives, allNodes, repeatableLinkImports };
}
function mergeGraphQLTypes(typeSource, config) {
    (0, utils_1.resetComments)();
    const { allDirectives, allNodes, repeatableLinkImports } = visitTypeSources(typeSource, config);
    const mergedDirectives = (0, merge_nodes_js_1.mergeGraphQLNodes)(allDirectives, config);
    config.repeatableLinkImports = repeatableLinkImports;
    const mergedNodes = (0, merge_nodes_js_1.mergeGraphQLNodes)(allNodes, config, mergedDirectives);
    if (config?.useSchemaDefinition) {
        // XXX: right now we don't handle multiple schema definitions
        const schemaDef = mergedNodes[merge_nodes_js_1.schemaDefSymbol] || {
            kind: graphql_1.Kind.SCHEMA_DEFINITION,
            operationTypes: [],
        };
        const operationTypes = schemaDef.operationTypes;
        for (const opTypeDefNodeType in schema_def_js_1.DEFAULT_OPERATION_TYPE_NAME_MAP) {
            const opTypeDefNode = operationTypes.find(operationType => operationType.operation === opTypeDefNodeType);
            if (!opTypeDefNode) {
                const possibleRootTypeName = schema_def_js_1.DEFAULT_OPERATION_TYPE_NAME_MAP[opTypeDefNodeType];
                const existingPossibleRootType = mergedNodes[possibleRootTypeName];
                if (existingPossibleRootType != null && existingPossibleRootType.name != null) {
                    operationTypes.push({
                        kind: graphql_1.Kind.OPERATION_TYPE_DEFINITION,
                        type: {
                            kind: graphql_1.Kind.NAMED_TYPE,
                            name: existingPossibleRootType.name,
                        },
                        operation: opTypeDefNodeType,
                    });
                }
            }
        }
        if (schemaDef?.operationTypes?.length != null && schemaDef.operationTypes.length > 0) {
            mergedNodes[merge_nodes_js_1.schemaDefSymbol] = schemaDef;
        }
    }
    if (config?.forceSchemaDefinition && !mergedNodes[merge_nodes_js_1.schemaDefSymbol]?.operationTypes?.length) {
        mergedNodes[merge_nodes_js_1.schemaDefSymbol] = {
            kind: graphql_1.Kind.SCHEMA_DEFINITION,
            operationTypes: [
                {
                    kind: graphql_1.Kind.OPERATION_TYPE_DEFINITION,
                    operation: 'query',
                    type: {
                        kind: graphql_1.Kind.NAMED_TYPE,
                        name: {
                            kind: graphql_1.Kind.NAME,
                            value: 'Query',
                        },
                    },
                },
            ],
        };
    }
    const mergedNodeDefinitions = Object.values(mergedNodes);
    if (config?.sort) {
        const sortFn = typeof config.sort === 'function' ? config.sort : utils_js_1.defaultStringComparator;
        mergedNodeDefinitions.sort((a, b) => sortFn(a.name?.value, b.name?.value));
    }
    return mergedNodeDefinitions;
}
