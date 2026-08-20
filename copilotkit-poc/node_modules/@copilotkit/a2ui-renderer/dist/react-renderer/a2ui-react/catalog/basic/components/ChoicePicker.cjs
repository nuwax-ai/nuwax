const require_runtime = require('../../../../../_virtual/_rolldown/runtime.cjs');
const require_adapter = require('../../../adapter.cjs');
const require_utils = require('../utils.cjs');
let react = require("react");
react = require_runtime.__toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");
let _a2ui_web_core_v0_9_basic_catalog = require("@a2ui/web_core/v0_9/basic_catalog");

//#region src/react-renderer/a2ui-react/catalog/basic/components/ChoicePicker.tsx
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
const ChoicePicker = require_adapter.createReactComponent(_a2ui_web_core_v0_9_basic_catalog.ChoicePickerApi, ({ props, context }) => {
	const [filter, setFilter] = (0, react.useState)("");
	const values = Array.isArray(props.value) ? props.value : [];
	const isMutuallyExclusive = props.variant === "mutuallyExclusive";
	const onToggle = (val) => {
		if (isMutuallyExclusive) props.setValue([val]);
		else {
			const newValues = values.includes(val) ? values.filter((v) => v !== val) : [...values, val];
			props.setValue(newValues);
		}
	};
	const options = (props.options || []).filter((opt) => !props.filterable || filter === "" || String(opt.label).toLowerCase().includes(filter.toLowerCase()));
	const containerStyle = {
		display: "flex",
		flexDirection: "column",
		gap: "8px",
		margin: require_utils.LEAF_MARGIN,
		width: "100%"
	};
	const listStyle = {
		display: "flex",
		flexDirection: props.displayStyle === "chips" ? "row" : "column",
		flexWrap: props.displayStyle === "chips" ? "wrap" : "nowrap",
		gap: "8px"
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: containerStyle,
		children: [
			props.label && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
				style: { fontSize: "14px" },
				children: props.label
			}),
			props.filterable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
				type: "text",
				placeholder: "Filter options...",
				value: filter,
				onChange: (e) => setFilter(e.target.value),
				style: {
					padding: "4px 8px",
					border: require_utils.STANDARD_BORDER,
					borderRadius: require_utils.STANDARD_RADIUS
				}
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: listStyle,
				children: options.map((opt, i) => {
					const isSelected = values.includes(opt.value);
					if (props.displayStyle === "chips") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						onClick: () => onToggle(opt.value),
						style: {
							padding: "4px 12px",
							borderRadius: "16px",
							border: isSelected ? "1px solid var(--a2ui-primary-color, #007bff)" : require_utils.STANDARD_BORDER,
							backgroundColor: isSelected ? "var(--a2ui-primary-color, #007bff)" : "#fff",
							color: isSelected ? "#fff" : "inherit",
							cursor: "pointer",
							fontSize: "12px"
						},
						children: opt.label
					}, i);
					return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: "8px",
							cursor: "pointer"
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							type: isMutuallyExclusive ? "radio" : "checkbox",
							checked: isSelected,
							onChange: () => onToggle(opt.value),
							name: isMutuallyExclusive ? `choice-${context.componentModel.id}` : void 0
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: { fontSize: "14px" },
							children: opt.label
						})]
					}, i);
				})
			})
		]
	});
});

//#endregion
exports.ChoicePicker = ChoicePicker;
//# sourceMappingURL=ChoicePicker.cjs.map