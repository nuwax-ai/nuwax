export declare class ConflictingDefaultValuesError extends Error {
    constructor(typeName: string, fieldName: string, defaultValueFromDecorator: unknown, defaultValueFromInitializer: unknown);
}
