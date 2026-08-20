const require_runtime = require('../../../../_virtual/_rolldown/runtime.cjs');
const require_Text = require('./components/Text.cjs');
const require_Button = require('./components/Button.cjs');
const require_Row = require('./components/Row.cjs');
const require_Column = require('./components/Column.cjs');
const require_TextField = require('./components/TextField.cjs');
let _a2ui_web_core_v0_9 = require("@a2ui/web_core/v0_9");
let zod = require("zod");

//#region src/react-renderer/a2ui-react/catalog/minimal/index.ts
/**
* Copyright 2026 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
const minimalComponents = [
	require_Text.Text,
	require_Button.Button,
	require_Row.Row,
	require_Column.Column,
	require_TextField.TextField
];
const minimalCatalog = new _a2ui_web_core_v0_9.Catalog("https://a2ui.org/specification/v0_9/catalogs/minimal/minimal_catalog.json", minimalComponents, [(0, _a2ui_web_core_v0_9.createFunctionImplementation)({
	name: "capitalize",
	returnType: "string",
	schema: zod.z.object({ value: zod.z.unknown() })
}, (args) => {
	const val = args.value;
	if (typeof val === "string") return val.toUpperCase();
	return val;
})]);

//#endregion
//# sourceMappingURL=index.cjs.map