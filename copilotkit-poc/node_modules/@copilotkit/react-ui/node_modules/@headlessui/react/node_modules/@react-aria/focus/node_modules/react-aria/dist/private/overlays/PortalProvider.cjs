var $33FrE$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "UNSAFE_PortalProvider", function () { return $08e343b750af304b$export$78efe591171d7d45; });
$parcel$export(module.exports, "useUNSAFE_PortalContext", function () { return $08e343b750af304b$export$9fc1347d4195ccb3; });
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
const $08e343b750af304b$export$60d741e20e0aa309 = /*#__PURE__*/ (0, $33FrE$react.createContext)({});
function $08e343b750af304b$export$78efe591171d7d45(props) {
    let { getContainer: getContainer } = props;
    let { getContainer: ctxGetContainer } = $08e343b750af304b$export$9fc1347d4195ccb3();
    return /*#__PURE__*/ (0, ($parcel$interopDefault($33FrE$react))).createElement($08e343b750af304b$export$60d741e20e0aa309.Provider, {
        value: {
            getContainer: getContainer === null ? undefined : getContainer ?? ctxGetContainer
        }
    }, props.children);
}
function $08e343b750af304b$export$9fc1347d4195ccb3() {
    return (0, $33FrE$react.useContext)($08e343b750af304b$export$60d741e20e0aa309) ?? {};
}


//# sourceMappingURL=PortalProvider.cjs.map
