/**
 * Represents a JSON Schema definition.
 * Typed as Record<string, any> to allow standard JSON schema properties
 * without importing heavy schema types.
 */
export type JsonSchema = Record<string, any>;
/**
 * Describes a function's interface within an inline catalog.
 */
export interface FunctionDefinition {
    name: string;
    description?: string;
    parameters: JsonSchema;
    returnType: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'any' | 'void';
}
/**
 * Defines a catalog inline for the a2uiClientCapabilities object.
 */
export interface InlineCatalog {
    catalogId: string;
    components?: Record<string, JsonSchema>;
    functions?: FunctionDefinition[];
    theme?: Record<string, JsonSchema>;
}
/**
 * The capabilities structure sent from the client to the server as part of transport metadata.
 */
export interface A2uiClientCapabilities {
    'v0.9': {
        supportedCatalogIds: string[];
        inlineCatalogs?: InlineCatalog[];
    };
}
//# sourceMappingURL=client-capabilities.d.ts.map