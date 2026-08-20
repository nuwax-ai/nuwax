import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {tabsIds as $83ae27ae4c16dc56$export$c5f62239608282b6} from "./utils.js";
import {TabsKeyboardDelegate as $4b109f592e9c286a$export$15010ca3c1abe90b} from "./TabsKeyboardDelegate.js";
import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";
import {useLabels as $93a7fe14591f425f$export$d6875122194c7b44} from "../utils/useLabels.js";
import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.js";
import {useSelectableCollection as $80c8b4b5cf8e1f86$export$d6daf82dcd84e87c} from "../selection/useSelectableCollection.js";
import {useMemo as $5SV2W$useMemo} from "react";

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







function $42d9037209a20bdb$export$773e389e644c5874(props, state, ref) {
    let { orientation: orientation = 'horizontal', keyboardActivation: keyboardActivation = 'automatic' } = props;
    let { collection: collection, selectionManager: manager, disabledKeys: disabledKeys } = state;
    let { direction: direction } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    let delegate = (0, $5SV2W$useMemo)(()=>new (0, $4b109f592e9c286a$export$15010ca3c1abe90b)(collection, direction, orientation, disabledKeys), [
        collection,
        disabledKeys,
        orientation,
        direction
    ]);
    let { collectionProps: collectionProps } = (0, $80c8b4b5cf8e1f86$export$d6daf82dcd84e87c)({
        ref: ref,
        selectionManager: manager,
        keyboardDelegate: delegate,
        selectOnFocus: keyboardActivation === 'automatic',
        disallowEmptySelection: true,
        scrollRef: ref,
        linkBehavior: 'selection'
    });
    // Compute base id for all tabs
    let tabsId = (0, $0292efe68908de6b$export$f680877a34711e37)();
    (0, $83ae27ae4c16dc56$export$c5f62239608282b6).set(state, tabsId);
    let tabListLabelProps = (0, $93a7fe14591f425f$export$d6875122194c7b44)({
        ...props,
        id: tabsId
    });
    return {
        tabListProps: {
            ...(0, $64c36edd757dfa16$export$9d1611c77c2fe928)(collectionProps, tabListLabelProps),
            role: 'tablist',
            'aria-orientation': orientation,
            tabIndex: undefined
        }
    };
}


export {$42d9037209a20bdb$export$773e389e644c5874 as useTabList};
//# sourceMappingURL=useTabList.js.map
