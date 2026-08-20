import { createReactComponent } from "../../../adapter.mjs";
import { ChildList } from "./ChildList.mjs";
import { CommonSchemas } from "@a2ui/web_core/v0_9";
import { jsx } from "react/jsx-runtime";
import { z } from "zod";

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
const RowSchema = z.object({
	children: CommonSchemas.ChildList,
	justify: z.enum([
		"center",
		"end",
		"spaceAround",
		"spaceBetween",
		"spaceEvenly",
		"start",
		"stretch"
	]).optional(),
	align: z.enum([
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
const Row = createReactComponent(RowApiDef, ({ props, buildChild }) => {
	return /* @__PURE__ */ jsx("div", {
		style: {
			display: "flex",
			flexDirection: "row",
			justifyContent: mapJustify(props.justify),
			alignItems: mapAlign(props.align)
		},
		children: /* @__PURE__ */ jsx(ChildList, {
			childList: props.children,
			buildChild
		})
	});
});

//#endregion
export { Row };
//# sourceMappingURL=Row.mjs.map