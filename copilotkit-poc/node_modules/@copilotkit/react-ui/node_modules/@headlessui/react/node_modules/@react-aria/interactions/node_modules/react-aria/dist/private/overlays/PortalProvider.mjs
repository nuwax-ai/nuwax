import $9DQBE$react, {createContext as $9DQBE$createContext, useContext as $9DQBE$useContext} from "react";

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
const $72abaeab4d80592f$export$60d741e20e0aa309 = /*#__PURE__*/ (0, $9DQBE$createContext)({});
function $72abaeab4d80592f$export$78efe591171d7d45(props) {
    let { getContainer: getContainer } = props;
    let { getContainer: ctxGetContainer } = $72abaeab4d80592f$export$9fc1347d4195ccb3();
    return /*#__PURE__*/ (0, $9DQBE$react).createElement($72abaeab4d80592f$export$60d741e20e0aa309.Provider, {
        value: {
            getContainer: getContainer === null ? undefined : getContainer ?? ctxGetContainer
        }
    }, props.children);
}
function $72abaeab4d80592f$export$9fc1347d4195ccb3() {
    return (0, $9DQBE$useContext)($72abaeab4d80592f$export$60d741e20e0aa309) ?? {};
}


export {$72abaeab4d80592f$export$60d741e20e0aa309 as PortalContext, $72abaeab4d80592f$export$78efe591171d7d45 as UNSAFE_PortalProvider, $72abaeab4d80592f$export$9fc1347d4195ccb3 as useUNSAFE_PortalContext};
//# sourceMappingURL=PortalProvider.mjs.map
