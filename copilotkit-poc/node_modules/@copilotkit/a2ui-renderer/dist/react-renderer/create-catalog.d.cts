import { ReactComponentImplementation } from "./a2ui-react/adapter.cjs";
import "./a2ui-react/index.cjs";
import { Catalog } from "@a2ui/web_core/v0_9";
import { ZodObject, ZodRawShape, z } from "zod";

//#region src/react-renderer/create-catalog.d.ts
/**
 * A single component definition — Zod props schema + optional description.
 * Platform-agnostic: no React or rendering details.
 */
interface CatalogComponentDefinition<T extends ZodRawShape = ZodRawShape> {
  /** Zod schema for component props */
  props: ZodObject<T>;
  /** Description for the AI agent */
  description?: string;
}
/**
 * A record mapping component names to their definitions.
 * This is the platform-agnostic "contract" that agents use.
 */
type CatalogDefinitions = Record<string, CatalogComponentDefinition<any>>;
/**
 * Infer the props type for a specific component in the definitions.
 */
type PropsOf<D extends CatalogDefinitions, K extends keyof D> = z.infer<D[K]["props"]>;
/**
 * Props passed to a renderer function.
 */
interface RendererProps<T = Record<string, unknown>> {
  /** Resolved prop values from the A2UI data model */
  props: T;
  /** Render a child component by ID */
  children: (id: string) => React.ReactNode;
  /** Dispatch an A2UI action from this component (e.g., on button click) */
  dispatch?: (action: any) => void;
}
/**
 * A renderer function for a component.
 */
type ComponentRenderer<T = Record<string, unknown>> = React.FC<RendererProps<T>>;
/**
 * A record mapping component names to React renderer functions.
 * Type-checked against the catalog definitions.
 */
type CatalogRenderers<D extends CatalogDefinitions> = { [K in keyof D]: ComponentRenderer<z.infer<D[K]["props"]>> };
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
declare function createCatalog<D extends CatalogDefinitions>(definitions: D, renderers: CatalogRenderers<D>, options?: {
  /** Catalog ID. Defaults to a generated URI. */catalogId?: string; /** If true, merge the built-in basic catalog components (Text, Button, Row, etc.) into this catalog. Default: false */
  includeBasicCatalog?: boolean;
}): Catalog<ReactComponentImplementation>;
/**
 * Extract a JSON-serializable schema from catalog definitions.
 * Suitable for passing to the runtime's `a2ui.schema` config.
 */
declare function extractSchema(definitions: CatalogDefinitions): Array<{
  name: string;
  description?: string;
  props?: Record<string, unknown>;
}>;
interface A2UIComponentDefinition<T extends ZodRawShape = ZodRawShape> {
  props: ZodObject<T>;
  description?: string;
  render: React.FC<RendererProps<z.infer<ZodObject<T>>>>;
}
type A2UIComponentMap = Record<string, A2UIComponentDefinition<any>>;
/**
 * @deprecated Use `createCatalog(definitions, renderers)` instead.
 */
declare function createA2UICatalog(components: A2UIComponentMap, options?: {
  catalogId?: string;
  includeBasicCatalog?: boolean;
}): Catalog<ReactComponentImplementation>;
/**
 * @deprecated Use `extractSchema(definitions)` instead.
 */
declare function extractA2UISchema(components: A2UIComponentMap): Array<{
  name: string;
  description?: string;
  props?: Record<string, unknown>;
}>;
//#endregion
export { A2UIComponentDefinition, A2UIComponentMap, CatalogComponentDefinition, CatalogDefinitions, CatalogRenderers, ComponentRenderer, PropsOf, RendererProps, createA2UICatalog, createCatalog, extractA2UISchema, extractSchema };
//# sourceMappingURL=create-catalog.d.cts.map