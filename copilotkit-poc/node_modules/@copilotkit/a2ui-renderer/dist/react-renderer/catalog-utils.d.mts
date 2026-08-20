import { Catalog, ComponentApi } from "@a2ui/web_core/v0_9";

//#region src/react-renderer/catalog-utils.d.ts
/**
 * Context description used to identify the A2UI component schema in RunAgentInput.context.
 * Must match the constant in @ag-ui/a2ui-middleware so the middleware can overwrite
 * a frontend-provided schema with a server-side one.
 */
declare const A2UI_SCHEMA_CONTEXT_DESCRIPTION = "A2UI Component Schema \u2014 available components for generating UI surfaces. Use these component names and properties when creating A2UI operations.";
/**
 * Check whether a catalog is a superset of the basic catalog
 * (i.e., it contains all basic components by name).
 */
declare function extendsBasicCatalog(catalog: Catalog<ComponentApi>): boolean;
/**
 * Return the names of components in a catalog that are not in the basic catalog.
 */
declare function getCustomComponentNames(catalog: Catalog<ComponentApi>): string[];
/**
 * Build a context string describing the available A2UI catalog and custom components.
 * Custom components (those not in the basic catalog) are described using their
 * JSON Schema representation, matching the canonical A2UI catalog format.
 */
declare function buildCatalogContextValue(catalog?: Catalog<ComponentApi>): string;
/**
 * A2UI v0.9 inline catalog format — matches the structure defined by the
 * A2UI specification (basic_catalog.json).  Each component is keyed by
 * name and uses `allOf` to compose ComponentCommon with component-specific
 * properties so the schema mirrors the flat wire format the LLM must produce.
 */
interface InlineCatalogSchema {
  catalogId: string;
  components: Record<string, Record<string, unknown>>;
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
declare function extractCatalogComponentSchemas(catalog?: Catalog<ComponentApi>): InlineCatalogSchema;
//#endregion
export { A2UI_SCHEMA_CONTEXT_DESCRIPTION, InlineCatalogSchema, buildCatalogContextValue, extendsBasicCatalog, extractCatalogComponentSchemas, getCustomComponentNames };
//# sourceMappingURL=catalog-utils.d.mts.map