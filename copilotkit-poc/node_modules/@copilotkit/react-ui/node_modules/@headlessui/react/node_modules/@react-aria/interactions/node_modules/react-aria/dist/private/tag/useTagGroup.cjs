var $9a37293f310f6644$exports = require("../gridlist/useGridList.cjs");
var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $22ef0686d6af4fda$exports = require("../selection/ListKeyboardDelegate.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $e3486d9c44549186$exports = require("../label/useField.cjs");
var $b4f85e31b7b8044c$exports = require("../interactions/useFocusWithin.cjs");
var $2522e612fa919664$exports = require("../i18n/I18nProvider.cjs");
var $3YUJC$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "hookData", function () { return $8b7a8c87b9acc046$export$653eddfc964b0f8a; });
$parcel$export(module.exports, "useTagGroup", function () { return $8b7a8c87b9acc046$export$4f8b5cda58b7e8ff; });
/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 







const $8b7a8c87b9acc046$export$653eddfc964b0f8a = new WeakMap();
function $8b7a8c87b9acc046$export$4f8b5cda58b7e8ff(props, state, ref) {
    let { direction: direction } = (0, $2522e612fa919664$exports.useLocale)();
    let keyboardDelegate = props.keyboardDelegate || new (0, $22ef0686d6af4fda$exports.ListKeyboardDelegate)({
        collection: state.collection,
        ref: ref,
        orientation: 'horizontal',
        direction: direction,
        disabledKeys: state.disabledKeys,
        disabledBehavior: state.selectionManager.disabledBehavior
    });
    let { labelProps: labelProps, fieldProps: fieldProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps } = (0, $e3486d9c44549186$exports.useField)({
        ...props,
        labelElementType: 'span'
    });
    let { gridProps: gridProps } = (0, $9a37293f310f6644$exports.useGridList)({
        ...props,
        ...fieldProps,
        keyboardDelegate: keyboardDelegate,
        shouldFocusWrap: true,
        linkBehavior: 'override',
        keyboardNavigationBehavior: 'tab'
    }, state, ref);
    let [isFocusWithin, setFocusWithin] = (0, $3YUJC$react.useState)(false);
    let { focusWithinProps: focusWithinProps } = (0, $b4f85e31b7b8044c$exports.useFocusWithin)({
        onFocusWithinChange: setFocusWithin
    });
    let domProps = (0, $b97366b6eabbb2cc$exports.filterDOMProps)(props);
    // If the last tag is removed, focus the container.
    let prevCount = (0, $3YUJC$react.useRef)(state.collection.size);
    (0, $3YUJC$react.useEffect)(()=>{
        if (ref.current && prevCount.current > 0 && state.collection.size === 0 && isFocusWithin) ref.current.focus();
        prevCount.current = state.collection.size;
    }, [
        state.collection.size,
        isFocusWithin,
        ref
    ]);
    $8b7a8c87b9acc046$export$653eddfc964b0f8a.set(state, {
        onRemove: props.onRemove
    });
    return {
        gridProps: (0, $89b39774f3b79dbb$exports.mergeProps)(gridProps, domProps, {
            role: state.collection.size ? 'grid' : 'group',
            'aria-atomic': false,
            'aria-relevant': 'additions',
            'aria-live': isFocusWithin ? 'polite' : 'off',
            ...focusWithinProps,
            ...fieldProps
        }),
        labelProps: labelProps,
        descriptionProps: descriptionProps,
        errorMessageProps: errorMessageProps
    };
}


//# sourceMappingURL=useTagGroup.cjs.map
