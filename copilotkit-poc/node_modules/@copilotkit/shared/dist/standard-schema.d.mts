import { StandardJSONSchemaV1, StandardSchemaV1 } from "@standard-schema/spec";

//#region src/standard-schema.d.ts
/**
 * Extract the Output type from a StandardSchemaV1 schema.
 * Replaces `z.infer<S>` for generic schema inference.
 */
type InferSchemaOutput<S> = S extends StandardSchemaV1<any, infer O> ? O : never;
interface SchemaToJsonSchemaOptions {
  /**
   * Injected `zodToJsonSchema` function so that `shared` does not depend on
   * `zod-to-json-schema`. Required when the schema is a Zod v3 schema that
   * does not implement Standard JSON Schema V1.
   */
  zodToJsonSchema?: (schema: unknown, options?: {
    $refStrategy?: string;
  }) => Record<string, unknown>;
}
/**
 * Convert any StandardSchemaV1-compatible schema to a JSON Schema object.
 *
 * Strategy:
 * 1. If the schema implements Standard JSON Schema V1 (`~standard.jsonSchema`),
 *    call `schema['~standard'].jsonSchema.input({ target: 'draft-07' })`.
 * 2. If the schema exposes a `toJSONSchema()` method (Zod v4), call it directly.
 * 3. If the schema is a Zod v3 schema (`~standard.vendor === 'zod'`), use the
 *    injected `zodToJsonSchema()` function.
 * 4. Otherwise throw a descriptive error.
 */
declare function schemaToJsonSchema(schema: StandardSchemaV1, options?: SchemaToJsonSchemaOptions): Record<string, unknown>;
//#endregion
export { InferSchemaOutput, SchemaToJsonSchemaOptions, type StandardJSONSchemaV1, type StandardSchemaV1, schemaToJsonSchema };
//# sourceMappingURL=standard-schema.d.mts.map