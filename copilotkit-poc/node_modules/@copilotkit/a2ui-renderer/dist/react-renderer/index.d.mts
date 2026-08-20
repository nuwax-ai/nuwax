import { A2UIClientEventMessage, Theme } from "../a2ui-types.mjs";
import { A2UIComponentProps, A2UIProviderConfig, Action, AnyComponentNode, BooleanValue, ComponentLoader, ComponentRegistration, DataValue, MessageProcessor as MessageProcessor$1, NumberValue, OnActionCallback, Primitives, ServerToClientMessage, StringValue, Surface, SurfaceID, Types } from "./types.mjs";
import { A2UIProvider, A2UIProviderProps, useA2UIActions, useA2UIContext, useA2UIError, useA2UIState, useA2UIStore, useA2UIStoreSelector } from "./core/A2UIProvider.mjs";
import { A2UIRenderer, A2UIRendererProps } from "./core/A2UIRenderer.mjs";
import { UseA2UIResult, useA2UI } from "./hooks/useA2UI.mjs";
import { ThemeProvider, useTheme, useThemeOptional } from "./theme/ThemeContext.mjs";
import { cn } from "./lib/utils.mjs";
import { A2UI_SCHEMA_CONTEXT_DESCRIPTION, InlineCatalogSchema, buildCatalogContextValue, extendsBasicCatalog, extractCatalogComponentSchemas, getCustomComponentNames } from "./catalog-utils.mjs";
import { ReactComponentImplementation, createReactComponent } from "./a2ui-react/adapter.mjs";
import { basicCatalog } from "./a2ui-react/catalog/basic/index.mjs";
import { A2UIComponentDefinition, A2UIComponentMap, CatalogComponentDefinition, CatalogDefinitions, CatalogRenderers, ComponentRenderer, PropsOf, RendererProps, createA2UICatalog, createCatalog, extractA2UISchema, extractSchema } from "./create-catalog.mjs";
import { injectStyles, removeStyles } from "./styles/index.mjs";
import { Catalog as Catalog$1 } from "@a2ui/web_core/v0_9";

//#region src/react-renderer/index.d.ts
declare function registerDefaultCatalog(): void;
declare function initializeDefaultCatalog(): void;
declare const defaultTheme: Record<string, unknown>;
declare const litTheme: Record<string, unknown>;
//#endregion
export { Catalog$1 as Catalog, defaultTheme, initializeDefaultCatalog, litTheme, registerDefaultCatalog };
//# sourceMappingURL=index.d.mts.map