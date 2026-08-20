import { createReactComponent } from "../../../adapter.mjs";
import React from "react";
import { CommonSchemas } from "@a2ui/web_core/v0_9";
import { jsx, jsxs } from "react/jsx-runtime";
import { z } from "zod";

//#region src/react-renderer/a2ui-react/catalog/minimal/components/TextField.tsx
const TextFieldSchema = z.object({
	label: CommonSchemas.DynamicString,
	value: CommonSchemas.DynamicString,
	variant: z.enum([
		"longText",
		"number",
		"shortText",
		"obscured"
	]).optional(),
	validationRegexp: z.string().optional()
});
const TextFieldApiDef = {
	name: "TextField",
	schema: TextFieldSchema
};
const TextField = createReactComponent(TextFieldApiDef, ({ props, context }) => {
	const onChange = (e) => {
		if (props.setValue) props.setValue(e.target.value);
	};
	const isLong = props.variant === "longText";
	const type = props.variant === "number" ? "number" : props.variant === "obscured" ? "password" : "text";
	const style = {
		padding: "8px",
		width: "100%",
		border: "1px solid #ccc",
		borderRadius: "4px",
		boxSizing: "border-box"
	};
	const id = `textfield-${context.componentModel.id}`;
	return /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			gap: "4px",
			width: "100%"
		},
		children: [props.label && /* @__PURE__ */ jsx("label", {
			htmlFor: id,
			style: {
				fontSize: "14px",
				fontWeight: "bold"
			},
			children: props.label
		}), isLong ? /* @__PURE__ */ jsx("textarea", {
			id,
			style,
			value: props.value || "",
			onChange
		}) : /* @__PURE__ */ jsx("input", {
			id,
			type,
			style,
			value: props.value || "",
			onChange
		})]
	});
});

//#endregion
export { TextField };
//# sourceMappingURL=TextField.mjs.map