const require_runtime = require('../_virtual/_rolldown/runtime.cjs');
const require_adapter = require('./a2ui-react/adapter.cjs');
const require_index = require('./a2ui-react/catalog/basic/index.cjs');
const require_ThemeContext = require('./theme/ThemeContext.cjs');
const require_A2UIProvider = require('./core/A2UIProvider.cjs');
const require_useA2UI = require('./hooks/useA2UI.cjs');
const require_utils = require('./lib/utils.cjs');
const require_A2UIRenderer = require('./core/A2UIRenderer.cjs');
const require_catalog_utils = require('./catalog-utils.cjs');
const require_create_catalog = require('./create-catalog.cjs');
const require_index$1 = require('./styles/index.cjs');
let _a2ui_web_core_v0_9 = require("@a2ui/web_core/v0_9");

//#region src/react-renderer/index.ts
function registerDefaultCatalog() {}
function initializeDefaultCatalog() {}
const defaultTheme = {};
const litTheme = defaultTheme;

//#endregion
exports.defaultTheme = defaultTheme;
exports.initializeDefaultCatalog = initializeDefaultCatalog;
exports.litTheme = litTheme;
exports.registerDefaultCatalog = registerDefaultCatalog;
//# sourceMappingURL=index.cjs.map