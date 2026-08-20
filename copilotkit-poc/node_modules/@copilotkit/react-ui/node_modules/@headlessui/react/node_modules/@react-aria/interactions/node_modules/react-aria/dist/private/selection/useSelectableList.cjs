var $df9ba3e9a7210056$exports = require("./useSelectableCollection.cjs");
var $22ef0686d6af4fda$exports = require("./ListKeyboardDelegate.cjs");
var $74751389dd0da9fc$exports = require("../i18n/useCollator.cjs");
var $6g6cN$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useSelectableList", function () { return $6c3cc4646da74e51$export$b95089534ab7c1fd; });
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



function $6c3cc4646da74e51$export$b95089534ab7c1fd(props) {
    let { selectionManager: selectionManager, collection: collection, disabledKeys: disabledKeys, ref: ref, keyboardDelegate: keyboardDelegate, layoutDelegate: layoutDelegate, orientation: orientation } = props;
    // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
    // When virtualized, the layout object will be passed in as a prop and override this.
    let collator = (0, $74751389dd0da9fc$exports.useCollator)({
        usage: 'search',
        sensitivity: 'base'
    });
    let disabledBehavior = selectionManager.disabledBehavior;
    let delegate = (0, $6g6cN$react.useMemo)(()=>keyboardDelegate || new (0, $22ef0686d6af4fda$exports.ListKeyboardDelegate)({
            collection: collection,
            disabledKeys: disabledKeys,
            disabledBehavior: disabledBehavior,
            ref: ref,
            collator: collator,
            layoutDelegate: layoutDelegate,
            orientation: orientation
        }), [
        keyboardDelegate,
        layoutDelegate,
        collection,
        disabledKeys,
        ref,
        collator,
        disabledBehavior,
        orientation
    ]);
    let { collectionProps: collectionProps } = (0, $df9ba3e9a7210056$exports.useSelectableCollection)({
        ...props,
        ref: ref,
        selectionManager: selectionManager,
        keyboardDelegate: delegate
    });
    return {
        listProps: collectionProps
    };
}


//# sourceMappingURL=useSelectableList.cjs.map
