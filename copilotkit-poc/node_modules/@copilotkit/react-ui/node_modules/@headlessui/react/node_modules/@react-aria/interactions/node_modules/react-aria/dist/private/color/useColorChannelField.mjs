import {useNumberField as $cd2fa56213693c5e$export$23f548e970bdf099} from "../numberfield/useNumberField.mjs";
import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.mjs";

/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 

function $d362ea20c2c75815$export$e55dd820142d3131(props, state, inputRef) {
    let { locale: locale } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    return (0, $cd2fa56213693c5e$export$23f548e970bdf099)({
        ...props,
        value: undefined,
        defaultValue: undefined,
        onChange: undefined,
        validate: undefined,
        // Provide a default aria-label if no other label is provided.
        'aria-label': props['aria-label'] || (props.label || props['aria-labelledby'] ? undefined : state.colorValue.getChannelName(props.channel, locale))
    }, state, inputRef);
}


export {$d362ea20c2c75815$export$e55dd820142d3131 as useColorChannelField};
//# sourceMappingURL=useColorChannelField.mjs.map
