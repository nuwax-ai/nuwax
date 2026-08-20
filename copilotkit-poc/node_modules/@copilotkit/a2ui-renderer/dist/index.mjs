import { createReactComponent } from "./react-renderer/a2ui-react/adapter.mjs";
import { basicCatalog } from "./react-renderer/a2ui-react/catalog/basic/index.mjs";
import { ThemeProvider, useTheme, useThemeOptional } from "./react-renderer/theme/ThemeContext.mjs";
import { A2UIProvider, useA2UIActions, useA2UIContext, useA2UIError, useA2UIState, useA2UIStore, useA2UIStoreSelector } from "./react-renderer/core/A2UIProvider.mjs";
import { useA2UI } from "./react-renderer/hooks/useA2UI.mjs";
import { cn } from "./react-renderer/lib/utils.mjs";
import A2UIRenderer from "./react-renderer/core/A2UIRenderer.mjs";
import { A2UI_SCHEMA_CONTEXT_DESCRIPTION, buildCatalogContextValue, extendsBasicCatalog, extractCatalogComponentSchemas, getCustomComponentNames } from "./react-renderer/catalog-utils.mjs";
import { createA2UICatalog, createCatalog, extractA2UISchema, extractSchema } from "./react-renderer/create-catalog.mjs";
import { injectStyles, removeStyles } from "./react-renderer/styles/index.mjs";
import { Catalog, defaultTheme, initializeDefaultCatalog, litTheme, registerDefaultCatalog } from "./react-renderer/index.mjs";
import { DEFAULT_SURFACE_ID } from "./a2ui-types.mjs";

//#region src/index.ts
const viewerTheme = {};

//#endregion
export { A2UIProvider, A2UIRenderer, A2UI_SCHEMA_CONTEXT_DESCRIPTION, Catalog, DEFAULT_SURFACE_ID, ThemeProvider, basicCatalog, buildCatalogContextValue, cn, createA2UICatalog, createCatalog, createReactComponent, defaultTheme, extendsBasicCatalog, extractA2UISchema, extractCatalogComponentSchemas, extractSchema, getCustomComponentNames, initializeDefaultCatalog, injectStyles, litTheme, registerDefaultCatalog, removeStyles, useA2UI, useA2UIActions, useA2UIContext, useA2UIError, useA2UIState, useA2UIStore, useA2UIStoreSelector, useTheme, useThemeOptional, viewerTheme };
//# sourceMappingURL=index.mjs.map