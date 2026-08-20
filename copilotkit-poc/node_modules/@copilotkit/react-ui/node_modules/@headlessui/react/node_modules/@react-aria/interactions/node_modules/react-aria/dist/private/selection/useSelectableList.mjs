import {useSelectableCollection as $d667c2af82d35a98$export$d6daf82dcd84e87c} from "./useSelectableCollection.mjs";
import {ListKeyboardDelegate as $ae8f8d98b2b18f2f$export$a05409b8bb224a5a} from "./ListKeyboardDelegate.mjs";
import {useCollator as $673d46fce3e5717d$export$a16aca283550c30d} from "../i18n/useCollator.mjs";
import {useMemo as $7JLm2$useMemo} from "react";

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



function $64903b4b31b6bb2a$export$b95089534ab7c1fd(props) {
    let { selectionManager: selectionManager, collection: collection, disabledKeys: disabledKeys, ref: ref, keyboardDelegate: keyboardDelegate, layoutDelegate: layoutDelegate, orientation: orientation } = props;
    // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
    // When virtualized, the layout object will be passed in as a prop and override this.
    let collator = (0, $673d46fce3e5717d$export$a16aca283550c30d)({
        usage: 'search',
        sensitivity: 'base'
    });
    let disabledBehavior = selectionManager.disabledBehavior;
    let delegate = (0, $7JLm2$useMemo)(()=>keyboardDelegate || new (0, $ae8f8d98b2b18f2f$export$a05409b8bb224a5a)({
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
    let { collectionProps: collectionProps } = (0, $d667c2af82d35a98$export$d6daf82dcd84e87c)({
        ...props,
        ref: ref,
        selectionManager: selectionManager,
        keyboardDelegate: delegate
    });
    return {
        listProps: collectionProps
    };
}


export {$64903b4b31b6bb2a$export$b95089534ab7c1fd as useSelectableList};
//# sourceMappingURL=useSelectableList.mjs.map
