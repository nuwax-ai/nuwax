var $25c7fefe1bb8073e$exports = require("../ssr/SSRProvider.cjs");
var $08e343b750af304b$exports = require("./PortalProvider.cjs");
var $lvVQD$react = require("react");
var $lvVQD$reactdom = require("react-dom");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "ModalProvider", function () { return $98a179454e1991cf$export$178405afcd8c5eb; });
$parcel$export(module.exports, "useModalProvider", function () { return $98a179454e1991cf$export$d9aaed4c3ece1bc0; });
$parcel$export(module.exports, "OverlayProvider", function () { return $98a179454e1991cf$export$bf688221f59024e5; });
$parcel$export(module.exports, "OverlayContainer", function () { return $98a179454e1991cf$export$b47c3594eab58386; });
$parcel$export(module.exports, "useModal", function () { return $98a179454e1991cf$export$33ffd74ebf07f060; });
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



const $98a179454e1991cf$var$Context = /*#__PURE__*/ (0, ($parcel$interopDefault($lvVQD$react))).createContext(null);
function $98a179454e1991cf$export$178405afcd8c5eb(props) {
    let { children: children } = props;
    let parent = (0, $lvVQD$react.useContext)($98a179454e1991cf$var$Context);
    let [modalCount, setModalCount] = (0, $lvVQD$react.useState)(0);
    let context = (0, $lvVQD$react.useMemo)(()=>({
            parent: parent,
            modalCount: modalCount,
            addModal () {
                setModalCount((count)=>count + 1);
                if (parent) parent.addModal();
            },
            removeModal () {
                setModalCount((count)=>count - 1);
                if (parent) parent.removeModal();
            }
        }), [
        parent,
        modalCount
    ]);
    return /*#__PURE__*/ (0, ($parcel$interopDefault($lvVQD$react))).createElement($98a179454e1991cf$var$Context.Provider, {
        value: context
    }, children);
}
function $98a179454e1991cf$export$d9aaed4c3ece1bc0() {
    let context = (0, $lvVQD$react.useContext)($98a179454e1991cf$var$Context);
    return {
        modalProviderProps: {
            'aria-hidden': context && context.modalCount > 0 ? true : undefined
        }
    };
}
/**
 * Creates a root node that will be aria-hidden if there are other modals open.
 */ function $98a179454e1991cf$var$OverlayContainerDOM(props) {
    let { modalProviderProps: modalProviderProps } = $98a179454e1991cf$export$d9aaed4c3ece1bc0();
    return /*#__PURE__*/ (0, ($parcel$interopDefault($lvVQD$react))).createElement("div", {
        "data-overlay-container": true,
        ...props,
        ...modalProviderProps
    });
}
function $98a179454e1991cf$export$bf688221f59024e5(props) {
    return /*#__PURE__*/ (0, ($parcel$interopDefault($lvVQD$react))).createElement($98a179454e1991cf$export$178405afcd8c5eb, null, /*#__PURE__*/ (0, ($parcel$interopDefault($lvVQD$react))).createElement($98a179454e1991cf$var$OverlayContainerDOM, props));
}
function $98a179454e1991cf$export$b47c3594eab58386(props) {
    let isSSR = (0, $25c7fefe1bb8073e$exports.useIsSSR)();
    let { portalContainer: portalContainer = isSSR ? null : document.body, ...rest } = props;
    let { getContainer: getContainer } = (0, $08e343b750af304b$exports.useUNSAFE_PortalContext)();
    if (!props.portalContainer && getContainer) portalContainer = getContainer();
    (0, ($parcel$interopDefault($lvVQD$react))).useEffect(()=>{
        if (portalContainer?.closest('[data-overlay-container]')) throw new Error('An OverlayContainer must not be inside another container. Please change the portalContainer prop.');
    }, [
        portalContainer
    ]);
    if (!portalContainer) return null;
    let contents = /*#__PURE__*/ (0, ($parcel$interopDefault($lvVQD$react))).createElement($98a179454e1991cf$export$bf688221f59024e5, rest);
    return /*#__PURE__*/ (0, ($parcel$interopDefault($lvVQD$reactdom))).createPortal(contents, portalContainer);
}
function $98a179454e1991cf$export$33ffd74ebf07f060(options) {
    // Add aria-hidden to all parent providers on mount, and restore on unmount.
    let context = (0, $lvVQD$react.useContext)($98a179454e1991cf$var$Context);
    if (!context) throw new Error('Modal is not contained within a provider');
    (0, $lvVQD$react.useEffect)(()=>{
        if (options?.isDisabled || !context || !context.parent) return;
        // The immediate context is from the provider containing this modal, so we only
        // want to trigger aria-hidden on its parents not on the modal provider itself.
        context.parent.addModal();
        return ()=>{
            if (context && context.parent) context.parent.removeModal();
        };
    }, [
        context,
        context.parent,
        options?.isDisabled
    ]);
    return {
        modalProps: {
            'data-ismodal': !options?.isDisabled
        }
    };
}


//# sourceMappingURL=useModal.cjs.map
