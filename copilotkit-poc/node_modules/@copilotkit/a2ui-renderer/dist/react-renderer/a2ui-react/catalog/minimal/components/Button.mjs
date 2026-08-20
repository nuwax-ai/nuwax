import { createReactComponent } from "../../../adapter.mjs";
import React from "react";
import { CommonSchemas } from "@a2ui/web_core/v0_9";
import { jsx } from "react/jsx-runtime";
import { z } from "zod";

//#region src/react-renderer/a2ui-react/catalog/minimal/components/Button.tsx
const ButtonSchema = z.object({
	child: CommonSchemas.ComponentId,
	action: CommonSchemas.Action,
	variant: z.enum(["primary", "borderless"]).optional()
});
const ButtonApiDef = {
	name: "Button",
	schema: ButtonSchema
};
const Button = createReactComponent(ButtonApiDef, ({ props, buildChild }) => {
	return /* @__PURE__ */ jsx("button", {
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
export { Button };
//# sourceMappingURL=Button.mjs.map