
//#region src/standard-schema.ts
/**
* Check whether a schema implements the Standard JSON Schema V1 protocol.
*/
function hasStandardJsonSchema(schema) {
	const props = schema["~standard"];
	return props != null && typeof props === "object" && "jsonSchema" in props && props.jsonSchema != null && typeof props.jsonSchema === "object" && "input" in props.jsonSchema && typeof props.jsonSchema.input === "function";
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
function schemaToJsonSchema(schema, options) {
	if (hasStandardJsonSchema(schema)) return schema["~standard"].jsonSchema.input({ target: "draft-07" });
	if (typeof schema.toJSONSchema === "function") return schema.toJSONSchema();
	const vendor = schema["~standard"].vendor;
	if (vendor === "zod" && options?.zodToJsonSchema) return options.zodToJsonSchema(schema, { $refStrategy: "none" });
	throw new Error(`Cannot convert schema to JSON Schema. The schema (vendor: "${vendor}") does not implement Standard JSON Schema V1 and no zodToJsonSchema fallback is available. Use a library that supports Standard JSON Schema (e.g., Zod 3.24+, Valibot v1+, ArkType v2+) or pass a zodToJsonSchema function in options.`);
}

//#endregion
exports.schemaToJsonSchema = schemaToJsonSchema;
//# sourceMappingURL=standard-schema.cjs.map