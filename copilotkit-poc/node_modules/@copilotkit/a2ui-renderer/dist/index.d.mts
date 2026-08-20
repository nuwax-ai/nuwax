import { A2UIClientEventMessage, DEFAULT_SURFACE_ID, Theme } from "./a2ui-types.mjs";
import { A2UIComponentProps, A2UIProviderConfig, Action, AnyComponentNode, BooleanValue, ComponentLoader, ComponentRegistration, DataValue, MessageProcessor, NumberValue, OnActionCallback, Primitives, ServerToClientMessage, StringValue, Surface, SurfaceID, Types } from "./react-renderer/types.mjs";
import { A2UIProvider, A2UIProviderProps, useA2UIActions, useA2UIContext, useA2UIError, useA2UIState, useA2UIStore, useA2UIStoreSelector } from "./react-renderer/core/A2UIProvider.mjs";
import { A2UIRenderer, A2UIRendererProps } from "./react-renderer/core/A2UIRenderer.mjs";
import { UseA2UIResult, useA2UI } from "./react-renderer/hooks/useA2UI.mjs";
import { ThemeProvider, useTheme, useThemeOptional } from "./react-renderer/theme/ThemeContext.mjs";
import { cn } from "./react-renderer/lib/utils.mjs";
import { A2UI_SCHEMA_CONTEXT_DESCRIPTION, InlineCatalogSchema, buildCatalogContextValue, extendsBasicCatalog, extractCatalogComponentSchemas, getCustomComponentNames } from "./react-renderer/catalog-utils.mjs";
import { ReactComponentImplementation, createReactComponent } from "./react-renderer/a2ui-react/adapter.mjs";
import { basicCatalog } from "./react-renderer/a2ui-react/catalog/basic/index.mjs";
import { A2UIComponentDefinition, A2UIComponentMap, CatalogComponentDefinition, CatalogDefinitions, CatalogRenderers, ComponentRenderer, PropsOf, RendererProps, createA2UICatalog, createCatalog, extractA2UISchema, extractSchema } from "./react-renderer/create-catalog.mjs";
import { injectStyles, removeStyles } from "./react-renderer/styles/index.mjs";
import { Catalog, defaultTheme, initializeDefaultCatalog, litTheme, registerDefaultCatalog } from "./react-renderer/index.mjs";

//#region src/index.d.ts
declare const viewerTheme: Record<string, unknown>;
//#endregion
export { type A2UIClientEventMessage, A2UIComponentDefinition, A2UIComponentMap, A2UIComponentProps, A2UIProvider, A2UIProviderConfig, A2UIProviderProps, A2UIRenderer, A2UIRendererProps, A2UI_SCHEMA_CONTEXT_DESCRIPTION, Action, AnyComponentNode, BooleanValue, Catalog, CatalogComponentDefinition, CatalogDefinitions, CatalogRenderers, ComponentLoader, ComponentRegistration, ComponentRenderer, DEFAULT_SURFACE_ID, DataValue, InlineCatalogSchema, MessageProcessor, NumberValue, OnActionCallback, Primitives, PropsOf, ReactComponentImplementation, RendererProps, ServerToClientMessage, StringValue, Surface, SurfaceID, type Theme, ThemeProvider, Types, UseA2UIResult, basicCatalog, buildCatalogContextValue, cn, createA2UICatalog, createCatalog, createReactComponent, defaultTheme, extendsBasicCatalog, extractA2UISchema, extractCatalogComponentSchemas, extractSchema, getCustomComponentNames, initializeDefaultCatalog, injectStyles, litTheme, registerDefaultCatalog, removeStyles, useA2UI, useA2UIActions, useA2UIContext, useA2UIError, useA2UIState, useA2UIStore, useA2UIStoreSelector, useTheme, useThemeOptional, viewerTheme };
//# sourceMappingURL=index.d.mts.map