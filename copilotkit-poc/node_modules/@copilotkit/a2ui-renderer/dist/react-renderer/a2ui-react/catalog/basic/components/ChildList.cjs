const require_runtime = require('../../../../../_virtual/_rolldown/runtime.cjs');
let react = require("react");
react = require_runtime.__toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");

//#region src/react-renderer/a2ui-react/catalog/basic/components/ChildList.tsx
/**
* Copyright 2026 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
const ChildList = ({ childList, buildChild }) => {
	if (Array.isArray(childList)) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: childList.map((item, i) => {
		if (item && typeof item === "object" && "id" in item) {
			const node = item;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react.default.Fragment, { children: buildChild(node.id, node.basePath) }, `${node.id}-${i}`);
		}
		if (typeof item === "string") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react.default.Fragment, { children: buildChild(item) }, `${item}-${i}`);
		return null;
	}) });
	return null;
};

//#endregion
exports.ChildList = ChildList;
//# sourceMappingURL=ChildList.cjs.map