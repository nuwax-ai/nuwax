import { createReactComponent } from "../../../adapter.mjs";
import { getBaseLeafStyle } from "../utils.mjs";
import React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { AudioPlayerApi } from "@a2ui/web_core/v0_9/basic_catalog";

//#region src/react-renderer/a2ui-react/catalog/basic/components/AudioPlayer.tsx
const AudioPlayer = createReactComponent(AudioPlayerApi, ({ props }) => {
	const style = {
		...getBaseLeafStyle(),
		width: "100%"
	};
	return /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			gap: "4px",
			width: "100%"
		},
		children: [props.description && /* @__PURE__ */ jsx("span", {
			style: {
				fontSize: "12px",
				color: "#666"
			},
			children: props.description
		}), /* @__PURE__ */ jsx("audio", {
			src: props.url,
			controls: true,
			style
		})]
	});
});

//#endregion
export { AudioPlayer };
//# sourceMappingURL=AudioPlayer.mjs.map