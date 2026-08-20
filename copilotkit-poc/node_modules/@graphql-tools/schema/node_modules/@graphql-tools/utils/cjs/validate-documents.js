"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGraphQlDocuments = validateGraphQlDocuments;
exports.createDefaultRules = createDefaultRules;
const graphql_1 = require("graphql");
function validateGraphQlDocuments(schema, documents, rules = createDefaultRules()) {
    const definitions = new Set();
    const fragmentsDefinitionsMap = new Map();
    for (const document of documents) {
        for (const docDefinition of document.definitions) {
            if (docDefinition.kind === graphql_1.Kind.FRAGMENT_DEFINITION) {
                fragmentsDefinitionsMap.set(docDefinition.name.value, docDefinition);
            }
            else {
                definitions.add(docDefinition);
            }
        }
    }
    const fullAST = {
        kind: graphql_1.Kind.DOCUMENT,
        definitions: Array.from([...definitions, ...fragmentsDefinitionsMap.values()]),
    };
    const errors = (0, graphql_1.validate)(schema, fullAST, rules);
    for (const error of errors) {
        error.stack = error.message;
        if (error.locations) {
            for (const location of error.locations) {
                error.stack += `\n    at ${error.source?.name}:${location.line}:${location.column}`;
            }
        }
    }
    return errors;
}
function createDefaultRules() {
    let ignored = ['NoUnusedFragmentsRule', 'NoUnusedVariablesRule', 'KnownDirectivesRule'];
    if (graphql_1.versionInfo.major < 15) {
        ignored = ignored.map(rule => rule.replace(/Rule$/, ''));
    }
    return graphql_1.specifiedRules.filter((f) => !ignored.includes(f.name));
}
