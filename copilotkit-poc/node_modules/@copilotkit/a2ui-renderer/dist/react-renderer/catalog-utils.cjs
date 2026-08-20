const require_runtime = require('../_virtual/_rolldown/runtime.cjs');
const require_index = require('./a2ui-react/catalog/basic/index.cjs');
require('./a2ui-react/index.cjs');
let zod_to_json_schema = require("zod-to-json-schema");

//#region src/react-renderer/catalog-utils.ts
const BASIC_CATALOG_ID = "https://a2ui.org/specification/v0_9/basic_catalog.json";
/**
* Context description used to identify the A2UI component schema in RunAgentInput.context.
* Must match the constant in @ag-ui/a2ui-middleware so the middleware can overwrite
* a frontend-provided schema with a server-side one.
*/
const A2UI_SCHEMA_CONTEXT_DESCRIPTION = "A2UI Component Schema — available components for generating UI surfaces. Use these component names and properties when creating A2UI operations.";
/**
* Check whether a catalog is a superset of the basic catalog
* (i.e., it contains all basic components by name).
*/
function extendsBasicCatalog(catalog) {
	for (const name of require_index.basicCatalog.components.keys()) if (!catalog.components.has(name)) return false;
	return true;
}
/**
* Return the names of components in a catalog that are not in the basic catalog.
*/
function getCustomComponentNames(catalog) {
	const custom = [];
	for (const name of catalog.components.keys()) if (!require_index.basicCatalog.components.has(name)) custom.push(name);
	return custom;
}
/**
* Build a context string describing the available A2UI catalog and custom components.
* Custom components (those not in the basic catalog) are described using their
* JSON Schema representation, matching the canonical A2UI catalog format.
*/
function buildCatalogContextValue(catalog) {
	const resolved = catalog ?? require_index.basicCatalog;
	const lines = [];
	lines.push("Available A2UI catalog:");
	if (resolved.id === BASIC_CATALOG_ID) {
		lines.push(`- ${resolved.id} (basic catalog)`);
		return lines.join("\n");
	}
	const isSuperset = extendsBasicCatalog(resolved);
	const customNames = getCustomComponentNames(resolved);
	lines.push(`- ${resolved.id}`);
	if (isSuperset) lines.push("  Extends the basic catalog with all standard components plus:");
	else {
		lines.push("  Custom catalog (does NOT include all basic components).");
		lines.push("  Custom components:");
	}
	for (const name of customNames) {
		const comp = resolved.components.get(name);
		if (!comp) continue;
		const jsonSchema = (0, zod_to_json_schema.zodToJsonSchema)(comp.schema);
		lines.push(`  - ${name}:`);
		lines.push(`    ${JSON.stringify(jsonSchema, null, 2).split("\n").join("\n    ")}`);
	}
	return lines.join("\n");
}
/**
* Extract component schemas from a catalog in the A2UI v0.9 inline catalog
* format.  This mirrors `generateInlineCatalog` from `@a2ui/web_core` so
* the schema the LLM sees matches the spec and the flat wire format:
*
*   { "Column": { "allOf": [
*       { "$ref": "common_types.json#/$defs/ComponentCommon" },
*       { "properties": { "component": {"const":"Column"}, "gap": ..., "children": ... },
*         "required": ["component"] }
*   ]}}
*
* When sent via `useAgentContext` with `A2UI_SCHEMA_CONTEXT_DESCRIPTION`,
* the middleware can optionally overwrite it with a server-side schema.
*/
function extractCatalogComponentSchemas(catalog) {
	const resolved = catalog ?? require_index.basicCatalog;
	const components = {};
	for (const [name, comp] of resolved.components) {
		const zodSchema = (0, zod_to_json_schema.zodToJsonSchema)(comp.schema, { target: "jsonSchema2019-09" });
		components[name] = { allOf: [{ $ref: "common_types.json#/$defs/ComponentCommon" }, {
			properties: {
				component: { const: name },
				...zodSchema.properties ?? {}
			},
			required: ["component", ...zodSchema.required ?? []]
		}] };
	}
	return {
		catalogId: resolved.id,
		components
	};
}

//#endregion
exports.A2UI_SCHEMA_CONTEXT_DESCRIPTION = A2UI_SCHEMA_CONTEXT_DESCRIPTION;
exports.buildCatalogContextValue = buildCatalogContextValue;
exports.extendsBasicCatalog = extendsBasicCatalog;
exports.extractCatalogComponentSchemas = extractCatalogComponentSchemas;
exports.getCustomComponentNames = getCustomComponentNames;
//# sourceMappingURL=catalog-utils.cjs.map