"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CannotDetermineGraphQLTypeError = void 0;
class CannotDetermineGraphQLTypeError extends Error {
    constructor(typeKind, typeName, propertyKey, parameterIndex, argName) {
        let errorMessage = `Cannot determine GraphQL ${typeKind} type for `;
        if (argName) {
            errorMessage += `argument named '${argName}' of `;
        }
        else if (parameterIndex !== undefined) {
            errorMessage += `parameter #${parameterIndex} of `;
        }
        errorMessage +=
            `'${propertyKey}' of '${typeName}' class. ` +
                `Is the value, that is used as its TS type or explicit type, decorated with a proper ` +
                `decorator or is it a proper ${typeKind} value?`;
        super(errorMessage);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.CannotDetermineGraphQLTypeError = CannotDetermineGraphQLTypeError;
