import { createReactComponent } from "../../../adapter.mjs";
import { getBaseLeafStyle } from "../utils.mjs";
import React from "react";
import { jsx } from "react/jsx-runtime";
import { IconApi } from "@a2ui/web_core/v0_9/basic_catalog";

//#region src/react-renderer/a2ui-react/catalog/basic/components/Icon.tsx
const Icon = createReactComponent(IconApi, ({ props }) => {
	const iconName = typeof props.name === "string" ? props.name : props.name?.path;
	return /* @__PURE__ */ jsx("span", {
		className: "material-symbols-outlined",
		style: {
			...getBaseLeafStyle(),
			fontSize: "24px",
			width: "24px",
			height: "24px",
			display: "inline-flex",
			alignItems: "center",
			justifyContent: "center"
		},
		children: iconName
	});
});

//#endregion
export { Icon };
//# sourceMappingURL=Icon.mjs.map