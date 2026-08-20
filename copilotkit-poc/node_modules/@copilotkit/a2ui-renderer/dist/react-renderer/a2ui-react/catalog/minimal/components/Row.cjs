const require_runtime = require('../../../../../_virtual/_rolldown/runtime.cjs');
const require_adapter = require('../../../adapter.cjs');
const require_ChildList = require('./ChildList.cjs');
let _a2ui_web_core_v0_9 = require("@a2ui/web_core/v0_9");
let react_jsx_runtime = require("react/jsx-runtime");
let zod = require("zod");

//#region src/react-renderer/a2ui-react/catalog/minimal/components/Row.tsx
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
const RowSchema = zod.z.object({
	children: _a2ui_web_core_v0_9.CommonSchemas.ChildList,
	justify: zod.z.enum([
		"center",
		"end",
		"spaceAround",
		"spaceBetween",
		"spaceEvenly",
		"start",
		"stretch"
	]).optional(),
	align: zod.z.enum([
		"start",
		"center",
		"end",
		"stretch"
	]).optional()
});
const mapJustify = (j) => {
	switch (j) {
		case "center": return "center";
		case "end": return "flex-end";
		case "spaceAround": return "space-around";
		case "spaceBetween": return "space-between";
		case "spaceEvenly": return "space-evenly";
		case "start": return "flex-start";
		case "stretch": return "stretch";
		default: return "flex-start";
	}
};
const mapAlign = (a) => {
	switch (a) {
		case "start": return "flex-start";
		case "center": return "center";
		case "end": return "flex-end";
		case "stretch": return "stretch";
		default: return "stretch";
	}
};
const RowApiDef = {
	name: "Row",
	schema: RowSchema
};
const Row = require_adapter.createReactComponent(RowApiDef, ({ props, buildChild }) => {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		style: {
			display: "flex",
			flexDirection: "row",
			justifyContent: mapJustify(props.justify),
			alignItems: mapAlign(props.align)
		},
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(require_ChildList.ChildList, {
			childList: props.children,
			buildChild
		})
	});
});

//#endregion
exports.Row = Row;
//# sourceMappingURL=Row.cjs.map