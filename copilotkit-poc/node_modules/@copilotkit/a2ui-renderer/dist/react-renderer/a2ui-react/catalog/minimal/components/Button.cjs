const require_runtime = require('../../../../../_virtual/_rolldown/runtime.cjs');
const require_adapter = require('../../../adapter.cjs');
let react = require("react");
react = require_runtime.__toESM(react);
let _a2ui_web_core_v0_9 = require("@a2ui/web_core/v0_9");
let react_jsx_runtime = require("react/jsx-runtime");
let zod = require("zod");

//#region src/react-renderer/a2ui-react/catalog/minimal/components/Button.tsx
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
const ButtonSchema = zod.z.object({
	child: _a2ui_web_core_v0_9.CommonSchemas.ComponentId,
	action: _a2ui_web_core_v0_9.CommonSchemas.Action,
	variant: zod.z.enum(["primary", "borderless"]).optional()
});
const ButtonApiDef = {
	name: "Button",
	schema: ButtonSchema
};
const Button = require_adapter.createReactComponent(ButtonApiDef, ({ props, buildChild }) => {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
		style: {
			padding: "8px 16px",
			cursor: "pointer",
			border: props.variant === "borderless" ? "none" : "1px solid #ccc",
			backgroundColor: props.variant === "primary" ? "#007bff" : "transparent",
			color: props.variant === "primary" ? "#fff" : "inherit",
			borderRadius: "4px"
		},
		onClick: props.action,
		children: props.child ? buildChild(props.child) : null
	});
});

//#endregion
exports.Button = Button;
//# sourceMappingURL=Button.cjs.map