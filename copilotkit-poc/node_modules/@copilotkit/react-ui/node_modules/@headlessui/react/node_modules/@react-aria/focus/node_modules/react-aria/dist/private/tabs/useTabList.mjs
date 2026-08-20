import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {tabsIds as $a251981b23baaa12$export$c5f62239608282b6} from "./utils.mjs";
import {TabsKeyboardDelegate as $a226bee26c88efd7$export$15010ca3c1abe90b} from "./TabsKeyboardDelegate.mjs";
import {useId as $390e54f620492c70$export$f680877a34711e37} from "../utils/useId.mjs";
import {useLabels as $e8ac3c3f5d4bae7f$export$d6875122194c7b44} from "../utils/useLabels.mjs";
import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.mjs";
import {useSelectableCollection as $d667c2af82d35a98$export$d6daf82dcd84e87c} from "../selection/useSelectableCollection.mjs";
import {useMemo as $4mYNK$useMemo} from "react";

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







function $83428e53deb13caf$export$773e389e644c5874(props, state, ref) {
    let { orientation: orientation = 'horizontal', keyboardActivation: keyboardActivation = 'automatic' } = props;
    let { collection: collection, selectionManager: manager, disabledKeys: disabledKeys } = state;
    let { direction: direction } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    let delegate = (0, $4mYNK$useMemo)(()=>new (0, $a226bee26c88efd7$export$15010ca3c1abe90b)(collection, direction, orientation, disabledKeys), [
        collection,
        disabledKeys,
        orientation,
        direction
    ]);
    let { collectionProps: collectionProps } = (0, $d667c2af82d35a98$export$d6daf82dcd84e87c)({
        ref: ref,
        selectionManager: manager,
        keyboardDelegate: delegate,
        selectOnFocus: keyboardActivation === 'automatic',
        disallowEmptySelection: true,
        scrollRef: ref,
        linkBehavior: 'selection'
    });
    // Compute base id for all tabs
    let tabsId = (0, $390e54f620492c70$export$f680877a34711e37)();
    (0, $a251981b23baaa12$export$c5f62239608282b6).set(state, tabsId);
    let tabListLabelProps = (0, $e8ac3c3f5d4bae7f$export$d6875122194c7b44)({
        ...props,
        id: tabsId
    });
    return {
        tabListProps: {
            ...(0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(collectionProps, tabListLabelProps),
            role: 'tablist',
            'aria-orientation': orientation,
            tabIndex: undefined
        }
    };
}


export {$83428e53deb13caf$export$773e389e644c5874 as useTabList};
//# sourceMappingURL=useTabList.mjs.map
