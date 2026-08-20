"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictingDefaultValuesError = void 0;
class ConflictingDefaultValuesError extends Error {
    constructor(typeName, fieldName, defaultValueFromDecorator, defaultValueFromInitializer) {
        super(`The '${fieldName}' field of '${typeName}' has conflicting default values. ` +
            `Default value from decorator ('${defaultValueFromDecorator}') ` +
            `is not equal to the property initializer value ('${defaultValueFromInitializer}').`);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.ConflictingDefaultValuesError = ConflictingDefaultValuesError;
