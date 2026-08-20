import { createReactComponent } from "../../../adapter.mjs";
import { getBaseLeafStyle } from "../utils.mjs";
import React from "react";
import { jsx } from "react/jsx-runtime";
import { ImageApi } from "@a2ui/web_core/v0_9/basic_catalog";

//#region src/react-renderer/a2ui-react/catalog/basic/components/Image.tsx
const Image = createReactComponent(ImageApi, ({ props }) => {
	const mapFit = (fit) => {
		if (fit === "scaleDown") return "scale-down";
		return fit || "fill";
	};
	const style = {
		...getBaseLeafStyle(),
		objectFit: mapFit(props.fit),
		width: "100%",
		height: "auto",
		display: "block"
	};
	if (props.variant === "icon") {
		style.width = "24px";
		style.height = "24px";
	} else if (props.variant === "avatar") {
		style.width = "40px";
		style.height = "40px";
		style.borderRadius = "50%";
	} else if (props.variant === "smallFeature") style.maxWidth = "100px";
	else if (props.variant === "largeFeature") style.maxHeight = "400px";
	else if (props.variant === "header") {
		style.height = "200px";
		style.objectFit = "cover";
	}
	return /* @__PURE__ */ jsx("img", {
		src: props.url,
		alt: props.description || "",
		style
	});
});

//#endregion
export { Image };
//# sourceMappingURL=Image.mjs.map