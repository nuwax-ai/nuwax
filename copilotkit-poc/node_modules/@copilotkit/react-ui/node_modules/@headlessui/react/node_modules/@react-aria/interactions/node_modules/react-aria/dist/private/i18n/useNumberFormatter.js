import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "./I18nProvider.js";
import {NumberFormatter as $7PNqE$NumberFormatter} from "@internationalized/number";
import {useMemo as $7PNqE$useMemo} from "react";

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


function $1dc719caba1a3f1f$export$b7a616150fdb9f44(options = {}) {
    let { locale: locale } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    return (0, $7PNqE$useMemo)(()=>new (0, $7PNqE$NumberFormatter)(locale, options), [
        locale,
        options
    ]);
}


export {$1dc719caba1a3f1f$export$b7a616150fdb9f44 as useNumberFormatter};
//# sourceMappingURL=useNumberFormatter.js.map
