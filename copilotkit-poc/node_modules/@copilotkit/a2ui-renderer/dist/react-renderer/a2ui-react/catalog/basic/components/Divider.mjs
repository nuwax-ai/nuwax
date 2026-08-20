import { createReactComponent } from "../../../adapter.mjs";
import { LEAF_MARGIN } from "../utils.mjs";
import React from "react";
import { jsx } from "react/jsx-runtime";
import { DividerApi } from "@a2ui/web_core/v0_9/basic_catalog";

//#region src/react-renderer/a2ui-react/catalog/basic/components/Divider.tsx
const Divider = createReactComponent(DividerApi, ({ props }) => {
	const isVertical = props.axis === "vertical";
	const style = {
		margin: LEAF_MARGIN,
		border: "none",
		backgroundColor: "#ccc"
	};
	if (isVertical) {
		style.width = "1px";
		style.height = "100%";
	} else {
		style.width = "100%";
		style.height = "1px";
	}
	return /* @__PURE__ */ jsx("div", { style });
});

//#endregion
export { Divider };
//# sourceMappingURL=Divider.mjs.map