import { createReactComponent } from "../../../adapter.mjs";
import { mapAlign } from "../utils.mjs";
import { ChildList } from "./ChildList.mjs";
import React from "react";
import { jsx } from "react/jsx-runtime";
import { ListApi } from "@a2ui/web_core/v0_9/basic_catalog";

//#region src/react-renderer/a2ui-react/catalog/basic/components/List.tsx
const List = createReactComponent(ListApi, ({ props, buildChild, context }) => {
	const isHorizontal = props.direction === "horizontal";
	return /* @__PURE__ */ jsx("div", {
		style: {
			display: "flex",
			flexDirection: isHorizontal ? "row" : "column",
			alignItems: mapAlign(props.align),
			overflowX: isHorizontal ? "auto" : "hidden",
			overflowY: isHorizontal ? "hidden" : "auto",
			width: "100%",
			margin: 0,
			padding: 0
		},
		children: /* @__PURE__ */ jsx(ChildList, {
			childList: props.children,
			buildChild,
			context
		})
	});
});

//#endregion
export { List };
//# sourceMappingURL=List.mjs.map