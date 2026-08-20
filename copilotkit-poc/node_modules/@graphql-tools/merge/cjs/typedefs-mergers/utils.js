"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompareVal = void 0;
exports.isStringTypes = isStringTypes;
exports.isSourceTypes = isSourceTypes;
exports.extractType = extractType;
exports.isWrappingTypeNode = isWrappingTypeNode;
exports.isListTypeNode = isListTypeNode;
exports.isNonNullTypeNode = isNonNullTypeNode;
exports.printTypeNode = printTypeNode;
exports.defaultStringComparator = defaultStringComparator;
const graphql_1 = require("graphql");
function isStringTypes(types) {
    return typeof types === 'string';
}
function isSourceTypes(types) {
    return types instanceof graphql_1.Source;
}
function extractType(type) {
    let visitedType = type;
    while (visitedType.kind === graphql_1.Kind.LIST_TYPE || visitedType.kind === 'NonNullType') {
        visitedType = visitedType.type;
    }
    return visitedType;
}
function isWrappingTypeNode(type) {
    return type.kind !== graphql_1.Kind.NAMED_TYPE;
}
function isListTypeNode(type) {
    return type.kind === graphql_1.Kind.LIST_TYPE;
}
function isNonNullTypeNode(type) {
    return type.kind === graphql_1.Kind.NON_NULL_TYPE;
}
function printTypeNode(type) {
    if (isListTypeNode(type)) {
        return `[${printTypeNode(type.type)}]`;
    }
    if (isNonNullTypeNode(type)) {
        return `${printTypeNode(type.type)}!`;
    }
    return type.name.value;
}
var CompareVal;
(function (CompareVal) {
    CompareVal[CompareVal["A_SMALLER_THAN_B"] = -1] = "A_SMALLER_THAN_B";
    CompareVal[CompareVal["A_EQUALS_B"] = 0] = "A_EQUALS_B";
    CompareVal[CompareVal["A_GREATER_THAN_B"] = 1] = "A_GREATER_THAN_B";
})(CompareVal || (exports.CompareVal = CompareVal = {}));
function defaultStringComparator(a, b) {
    if (a == null && b == null) {
        return CompareVal.A_EQUALS_B;
    }
    if (a == null) {
        return CompareVal.A_SMALLER_THAN_B;
    }
    if (b == null) {
        return CompareVal.A_GREATER_THAN_B;
    }
    if (a < b)
        return CompareVal.A_SMALLER_THAN_B;
    if (a > b)
        return CompareVal.A_GREATER_THAN_B;
    return CompareVal.A_EQUALS_B;
}
