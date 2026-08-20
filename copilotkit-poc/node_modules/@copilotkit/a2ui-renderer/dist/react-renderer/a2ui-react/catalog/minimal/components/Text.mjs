import { createReactComponent } from "../../../adapter.mjs";
import { CommonSchemas } from "@a2ui/web_core/v0_9";
import { jsx } from "react/jsx-runtime";
import { z } from "zod";

//#region src/react-renderer/a2ui-react/catalog/minimal/components/Text.tsx
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
const TextSchema = z.object({
	text: CommonSchemas.DynamicString,
	variant: z.enum([
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"caption",
		"body"
	]).optional()
});
const TextApiDef = {
	name: "Text",
	schema: TextSchema
};
const Text = createReactComponent(TextApiDef, ({ props }) => {
	const text = props.text ?? "";
	switch (props.variant) {
		case "h1": return /* @__PURE__ */ jsx("h1", { children: text });
		case "h2": return /* @__PURE__ */ jsx("h2", { children: text });
		case "h3": return /* @__PURE__ */ jsx("h3", { children: text });
		case "h4": return /* @__PURE__ */ jsx("h4", { children: text });
		case "h5": return /* @__PURE__ */ jsx("h5", { children: text });
		case "caption": return /* @__PURE__ */ jsx("small", { children: text });
		default: return /* @__PURE__ */ jsx("span", { children: text });
	}
});

//#endregion
export { Text };
//# sourceMappingURL=Text.mjs.map