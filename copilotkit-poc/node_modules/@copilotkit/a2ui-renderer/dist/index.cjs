Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
const require_runtime = require('./_virtual/_rolldown/runtime.cjs');
const require_adapter = require('./react-renderer/a2ui-react/adapter.cjs');
const require_index = require('./react-renderer/a2ui-react/catalog/basic/index.cjs');
const require_ThemeContext = require('./react-renderer/theme/ThemeContext.cjs');
const require_A2UIProvider = require('./react-renderer/core/A2UIProvider.cjs');
const require_useA2UI = require('./react-renderer/hooks/useA2UI.cjs');
const require_utils = require('./react-renderer/lib/utils.cjs');
const require_A2UIRenderer = require('./react-renderer/core/A2UIRenderer.cjs');
const require_catalog_utils = require('./react-renderer/catalog-utils.cjs');
const require_create_catalog = require('./react-renderer/create-catalog.cjs');
const require_index$1 = require('./react-renderer/styles/index.cjs');
const require_index$2 = require('./react-renderer/index.cjs');
const require_a2ui_types = require('./a2ui-types.cjs');
let _a2ui_web_core_v0_9 = require("@a2ui/web_core/v0_9");

//#region src/index.ts
const viewerTheme = {};

//#endregion
exports.A2UIProvider = require_A2UIProvider.A2UIProvider;
exports.A2UIRenderer = require_A2UIRenderer;
exports.A2UI_SCHEMA_CONTEXT_DESCRIPTION = require_catalog_utils.A2UI_SCHEMA_CONTEXT_DESCRIPTION;
Object.defineProperty(exports, 'Catalog', {
  enumerable: true,
  get: function () {
    return _a2ui_web_core_v0_9.Catalog;
  }
});
exports.DEFAULT_SURFACE_ID = require_a2ui_types.DEFAULT_SURFACE_ID;
exports.ThemeProvider = require_ThemeContext.ThemeProvider;
exports.basicCatalog = require_index.basicCatalog;
exports.buildCatalogContextValue = require_catalog_utils.buildCatalogContextValue;
exports.cn = require_utils.cn;
exports.createA2UICatalog = require_create_catalog.createA2UICatalog;
exports.createCatalog = require_create_catalog.createCatalog;
exports.createReactComponent = require_adapter.createReactComponent;
exports.defaultTheme = require_index$2.defaultTheme;
exports.extendsBasicCatalog = require_catalog_utils.extendsBasicCatalog;
exports.extractA2UISchema = require_create_catalog.extractA2UISchema;
exports.extractCatalogComponentSchemas = require_catalog_utils.extractCatalogComponentSchemas;
exports.extractSchema = require_create_catalog.extractSchema;
exports.getCustomComponentNames = require_catalog_utils.getCustomComponentNames;
exports.initializeDefaultCatalog = require_index$2.initializeDefaultCatalog;
exports.injectStyles = require_index$1.injectStyles;
exports.litTheme = require_index$2.litTheme;
exports.registerDefaultCatalog = require_index$2.registerDefaultCatalog;
exports.removeStyles = require_index$1.removeStyles;
exports.useA2UI = require_useA2UI.useA2UI;
exports.useA2UIActions = require_A2UIProvider.useA2UIActions;
exports.useA2UIContext = require_A2UIProvider.useA2UIContext;
exports.useA2UIError = require_A2UIProvider.useA2UIError;
exports.useA2UIState = require_A2UIProvider.useA2UIState;
exports.useA2UIStore = require_A2UIProvider.useA2UIStore;
exports.useA2UIStoreSelector = require_A2UIProvider.useA2UIStoreSelector;
exports.useTheme = require_ThemeContext.useTheme;
exports.useThemeOptional = require_ThemeContext.useThemeOptional;
exports.viewerTheme = viewerTheme;
//# sourceMappingURL=index.cjs.map