import {useSelectableCollection as $80c8b4b5cf8e1f86$export$d6daf82dcd84e87c} from "./useSelectableCollection.js";
import {ListKeyboardDelegate as $abb04fbee71f000f$export$a05409b8bb224a5a} from "./ListKeyboardDelegate.js";
import {useCollator as $14a307baf19f0c4b$export$a16aca283550c30d} from "../i18n/useCollator.js";
import {useMemo as $3rWHI$useMemo} from "react";

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



function $1bd41fe243048d1b$export$b95089534ab7c1fd(props) {
    let { selectionManager: selectionManager, collection: collection, disabledKeys: disabledKeys, ref: ref, keyboardDelegate: keyboardDelegate, layoutDelegate: layoutDelegate, orientation: orientation } = props;
    // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
    // When virtualized, the layout object will be passed in as a prop and override this.
    let collator = (0, $14a307baf19f0c4b$export$a16aca283550c30d)({
        usage: 'search',
        sensitivity: 'base'
    });
    let disabledBehavior = selectionManager.disabledBehavior;
    let delegate = (0, $3rWHI$useMemo)(()=>keyboardDelegate || new (0, $abb04fbee71f000f$export$a05409b8bb224a5a)({
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
    let { collectionProps: collectionProps } = (0, $80c8b4b5cf8e1f86$export$d6daf82dcd84e87c)({
        ...props,
        ref: ref,
        selectionManager: selectionManager,
        keyboardDelegate: delegate
    });
    return {
        listProps: collectionProps
    };
}


export {$1bd41fe243048d1b$export$b95089534ab7c1fd as useSelectableList};
//# sourceMappingURL=useSelectableList.js.map
