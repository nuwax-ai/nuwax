import { createReactComponent } from "./a2ui-react/adapter.mjs";
import { basicCatalog } from "./a2ui-react/catalog/basic/index.mjs";
import { ThemeProvider, useTheme, useThemeOptional } from "./theme/ThemeContext.mjs";
import { A2UIProvider, useA2UIActions, useA2UIContext, useA2UIError, useA2UIState, useA2UIStore, useA2UIStoreSelector } from "./core/A2UIProvider.mjs";
import { useA2UI } from "./hooks/useA2UI.mjs";
import { cn } from "./lib/utils.mjs";
import A2UIRenderer from "./core/A2UIRenderer.mjs";
import { A2UI_SCHEMA_CONTEXT_DESCRIPTION, buildCatalogContextValue, extendsBasicCatalog, extractCatalogComponentSchemas, getCustomComponentNames } from "./catalog-utils.mjs";
import { createA2UICatalog, createCatalog, extractA2UISchema, extractSchema } from "./create-catalog.mjs";
import { injectStyles, removeStyles } from "./styles/index.mjs";
import { Catalog as Catalog$1 } from "@a2ui/web_core/v0_9";

//#region src/react-renderer/index.ts
function registerDefaultCatalog() {}
function initializeDefaultCatalog() {}
const defaultTheme = {};
const litTheme = defaultTheme;

//#endregion
export { Catalog$1 as Catalog, defaultTheme, initializeDefaultCatalog, litTheme, registerDefaultCatalog };
//# sourceMappingURL=index.mjs.map