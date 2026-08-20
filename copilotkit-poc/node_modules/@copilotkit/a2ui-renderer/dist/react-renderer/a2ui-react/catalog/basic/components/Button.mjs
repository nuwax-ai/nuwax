import { createReactComponent } from "../../../adapter.mjs";
import { LEAF_MARGIN } from "../utils.mjs";
import React from "react";
import { jsx } from "react/jsx-runtime";
import { ButtonApi } from "@a2ui/web_core/v0_9/basic_catalog";

//#region src/react-renderer/a2ui-react/catalog/basic/components/Button.tsx
const Button = createReactComponent(ButtonApi, ({ props, buildChild }) => {
	return /* @__PURE__ */ jsx("button", {
		style: {
			margin: LEAF_MARGIN,
			padding: "8px 16px",
			cursor: "pointer",
			border: props.variant === "borderless" ? "none" : "1px solid #ccc",
			backgroundColor: props.variant === "primary" ? "var(--a2ui-primary-color, #007bff)" : props.variant === "borderless" ? "transparent" : "#fff",
			color: props.variant === "primary" ? "#fff" : "inherit",
			borderRadius: "4px",
			display: "inline-flex",
			alignItems: "center",
			justifyContent: "center",
			boxSizing: "border-box"
		},
		onClick: props.action,
		disabled: props.isValid === false,
		children: props.child ? buildChild(props.child) : null
	});
});

//#endregion
export { Button };
//# sourceMappingURL=Button.mjs.map