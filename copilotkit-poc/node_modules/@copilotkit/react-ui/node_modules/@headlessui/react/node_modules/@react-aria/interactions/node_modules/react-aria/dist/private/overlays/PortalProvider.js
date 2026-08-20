import $2jBqU$react, {createContext as $2jBqU$createContext, useContext as $2jBqU$useContext} from "react";

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
const $1255006bb8b1b64a$export$60d741e20e0aa309 = /*#__PURE__*/ (0, $2jBqU$createContext)({});
function $1255006bb8b1b64a$export$78efe591171d7d45(props) {
    let { getContainer: getContainer } = props;
    let { getContainer: ctxGetContainer } = $1255006bb8b1b64a$export$9fc1347d4195ccb3();
    return /*#__PURE__*/ (0, $2jBqU$react).createElement($1255006bb8b1b64a$export$60d741e20e0aa309.Provider, {
        value: {
            getContainer: getContainer === null ? undefined : getContainer !== null && getContainer !== void 0 ? getContainer : ctxGetContainer
        }
    }, props.children);
}
function $1255006bb8b1b64a$export$9fc1347d4195ccb3() {
    var _useContext;
    return (_useContext = (0, $2jBqU$useContext)($1255006bb8b1b64a$export$60d741e20e0aa309)) !== null && _useContext !== void 0 ? _useContext : {};
}


export {$1255006bb8b1b64a$export$60d741e20e0aa309 as PortalContext, $1255006bb8b1b64a$export$78efe591171d7d45 as UNSAFE_PortalProvider, $1255006bb8b1b64a$export$9fc1347d4195ccb3 as useUNSAFE_PortalContext};
//# sourceMappingURL=PortalProvider.js.map
