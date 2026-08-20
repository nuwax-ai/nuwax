import { createReactComponent } from "./a2ui-react/adapter.mjs";
import { basicCatalog } from "./a2ui-react/catalog/basic/index.mjs";
import "./a2ui-react/index.mjs";
import { Catalog } from "@a2ui/web_core/v0_9";
import { jsx } from "react/jsx-runtime";

//#region src/react-renderer/create-catalog.tsx
/**
* Create an A2UI catalog from definitions and renderers.
*
* Definitions are platform-agnostic (Zod schemas + descriptions).
* Renderers are platform-specific (React components).
* TypeScript enforces that renderers match definitions exactly.
*
* @example
* ```tsx
* // schema.ts (platform-agnostic)
* export const demoCatalogDefinitions = {
*   Card: {
*     description: "A card container",
*     props: z.object({ title: z.string(), child: z.string().optional() }),
*   },
* } satisfies CatalogDefinitions;
*
* // catalog.tsx (React renderers)
* export const demoCatalog = createCatalog(demoCatalogDefinitions, {
*   Card: ({ props, children }) => (
*     <div>{props.title}{props.child && children(props.child)}</div>
*   ),
* });
* ```
*/
function createCatalog(definitions, renderers, options) {
	const catalogId = options?.catalogId ?? "copilotkit://custom-catalog";
	const includeBasic = options?.includeBasicCatalog === true;
	const customComponents = [];
	for (const [name, def] of Object.entries(definitions)) {
		const api = {
			name,
			schema: def.props
		};
		const renderer = renderers[name];
		const wrapped = createReactComponent(api, ({ props, buildChild, context }) => {
			const Render = renderer;
			const dispatch = (action) => context.dispatchAction(action);
			return /* @__PURE__ */ jsx(Render, {
				props,
				children: buildChild,
				dispatch
			});
		});
		customComponents.push(wrapped);
	}
	return new Catalog(catalogId, includeBasic ? [...Array.from(basicCatalog.components.values()), ...customComponents] : customComponents, includeBasic ? Array.from(basicCatalog.functions.values()) : []);
}
/**
* Extract a JSON-serializable schema from catalog definitions.
* Suitable for passing to the runtime's `a2ui.schema` config.
*/
function extractSchema(definitions) {
	return Object.entries(definitions).map(([name, def]) => ({
		name,
		description: def.description,
		props: zodSchemaToSimpleObject(def.props)
	}));
}
function zodSchemaToSimpleObject(schema) {
	const shape = schema.shape;
	const properties = {};
	for (const [key, value] of Object.entries(shape)) {
		const zodValue = value;
		properties[key] = {
			type: zodValue._def?.typeName ?? "unknown",
			...zodValue.description ? { description: zodValue.description } : {}
		};
	}
	return {
		type: "object",
		properties
	};
}
/**
* @deprecated Use `createCatalog(definitions, renderers)` instead.
*/
function createA2UICatalog(components, options) {
	const definitions = {};
	const renderers = {};
	for (const [name, def] of Object.entries(components)) {
		definitions[name] = {
			props: def.props,
			description: def.description
		};
		renderers[name] = def.render;
	}
	return createCatalog(definitions, renderers, options);
}
/**
* @deprecated Use `extractSchema(definitions)` instead.
*/
function extractA2UISchema(components) {
	const definitions = {};
	for (const [name, def] of Object.entries(components)) definitions[name] = {
		props: def.props,
		description: def.description
	};
	return extractSchema(definitions);
}

//#endregion
export { createA2UICatalog, createCatalog, extractA2UISchema, extractSchema };
//# sourceMappingURL=create-catalog.mjs.map