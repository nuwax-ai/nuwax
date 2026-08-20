const require_runtime = require('../../../../../_virtual/_rolldown/runtime.cjs');
const require_adapter = require('../../../adapter.cjs');
const require_utils = require('../utils.cjs');
let react = require("react");
react = require_runtime.__toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");
let _a2ui_web_core_v0_9_basic_catalog = require("@a2ui/web_core/v0_9/basic_catalog");

//#region src/react-renderer/a2ui-react/catalog/basic/components/Card.tsx
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
const Card = require_adapter.createReactComponent(_a2ui_web_core_v0_9_basic_catalog.CardApi, ({ props, buildChild }) => {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		style: {
			...require_utils.getBaseContainerStyle(),
			backgroundColor: "#fff",
			boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
			width: "100%"
		},
		children: props.child ? buildChild(props.child) : null
	});
});

//#endregion
exports.Card = Card;
//# sourceMappingURL=Card.cjs.map