export declare class CannotDetermineGraphQLTypeError extends Error {
    constructor(typeKind: "input" | "output", typeName: string, propertyKey: string, parameterIndex?: number, argName?: string);
}
