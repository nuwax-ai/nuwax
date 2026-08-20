import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "./I18nProvider.js";
import {useMemo as $3PHB1$useMemo} from "react";

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

function $264c6016fa169ab9$export$a2f47a3d2973640(options = {}) {
    let { locale: locale } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    return (0, $3PHB1$useMemo)(()=>new Intl.ListFormat(locale, options), [
        locale,
        options
    ]);
}


export {$264c6016fa169ab9$export$a2f47a3d2973640 as useListFormatter};
//# sourceMappingURL=useListFormatter.js.map
