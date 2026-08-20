import { createReactComponent } from "../../../adapter.mjs";
import { getBaseLeafStyle } from "../utils.mjs";
import React from "react";
import { jsx } from "react/jsx-runtime";
import { TextApi } from "@a2ui/web_core/v0_9/basic_catalog";

//#region src/react-renderer/a2ui-react/catalog/basic/components/Text.tsx
const Text = createReactComponent(TextApi, ({ props }) => {
	const text = props.text ?? "";
	const style = {
		...getBaseLeafStyle(),
		display: "inline-block"
	};
	switch (props.variant) {
		case "h1": return /* @__PURE__ */ jsx("h1", {
			style,
			children: text
		});
		case "h2": return /* @__PURE__ */ jsx("h2", {
			style,
			children: text
		});
		case "h3": return /* @__PURE__ */ jsx("h3", {
			style,
			children: text
		});
		case "h4": return /* @__PURE__ */ jsx("h4", {
			style,
			children: text
		});
		case "h5": return /* @__PURE__ */ jsx("h5", {
			style,
			children: text
		});
		case "caption": return /* @__PURE__ */ jsx("small", {
			style: {
				...style,
				color: "#666",
				textAlign: "left"
			},
			children: text
		});
		default: return /* @__PURE__ */ jsx("span", {
			style,
			children: text
		});
	}
});

//#endregion
export { Text };
//# sourceMappingURL=Text.mjs.map