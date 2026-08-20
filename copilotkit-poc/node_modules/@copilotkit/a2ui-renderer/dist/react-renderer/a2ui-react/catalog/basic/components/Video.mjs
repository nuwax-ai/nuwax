import { createReactComponent } from "../../../adapter.mjs";
import { getBaseLeafStyle } from "../utils.mjs";
import React from "react";
import { jsx } from "react/jsx-runtime";
import { VideoApi } from "@a2ui/web_core/v0_9/basic_catalog";

//#region src/react-renderer/a2ui-react/catalog/basic/components/Video.tsx
const Video = createReactComponent(VideoApi, ({ props }) => {
	const style = {
		...getBaseLeafStyle(),
		width: "100%",
		aspectRatio: "16/9"
	};
	return /* @__PURE__ */ jsx("video", {
		src: props.url,
		controls: true,
		style
	});
});

//#endregion
export { Video };
//# sourceMappingURL=Video.mjs.map