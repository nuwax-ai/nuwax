import { createReactComponent } from "../../../adapter.mjs";
import { getBaseContainerStyle } from "../utils.mjs";
import React from "react";
import { jsx } from "react/jsx-runtime";
import { CardApi } from "@a2ui/web_core/v0_9/basic_catalog";

//#region src/react-renderer/a2ui-react/catalog/basic/components/Card.tsx
const Card = createReactComponent(CardApi, ({ props, buildChild }) => {
	return /* @__PURE__ */ jsx("div", {
		style: {
			...getBaseContainerStyle(),
			backgroundColor: "#fff",
			boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
			width: "100%"
		},
		children: props.child ? buildChild(props.child) : null
	});
});

//#endregion
export { Card };
//# sourceMappingURL=Card.mjs.map