import {useIsSSR as $85138adc03e1f057$export$535bd6ca7f90a273} from "../ssr/SSRProvider.js";
import {useUNSAFE_PortalContext as $1255006bb8b1b64a$export$9fc1347d4195ccb3} from "./PortalProvider.js";
import $exul0$react, {useContext as $exul0$useContext, useState as $exul0$useState, useMemo as $exul0$useMemo, useEffect as $exul0$useEffect} from "react";
import $exul0$reactdom from "react-dom";

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



const $ea58ad6104d3cd1b$var$Context = /*#__PURE__*/ (0, $exul0$react).createContext(null);
function $ea58ad6104d3cd1b$export$178405afcd8c5eb(props) {
    let { children: children } = props;
    let parent = (0, $exul0$useContext)($ea58ad6104d3cd1b$var$Context);
    let [modalCount, setModalCount] = (0, $exul0$useState)(0);
    let context = (0, $exul0$useMemo)(()=>({
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
    return /*#__PURE__*/ (0, $exul0$react).createElement($ea58ad6104d3cd1b$var$Context.Provider, {
        value: context
    }, children);
}
function $ea58ad6104d3cd1b$export$d9aaed4c3ece1bc0() {
    let context = (0, $exul0$useContext)($ea58ad6104d3cd1b$var$Context);
    return {
        modalProviderProps: {
            'aria-hidden': context && context.modalCount > 0 ? true : undefined
        }
    };
}
/**
 * Creates a root node that will be aria-hidden if there are other modals open.
 */ function $ea58ad6104d3cd1b$var$OverlayContainerDOM(props) {
    let { modalProviderProps: modalProviderProps } = $ea58ad6104d3cd1b$export$d9aaed4c3ece1bc0();
    return /*#__PURE__*/ (0, $exul0$react).createElement("div", {
        "data-overlay-container": true,
        ...props,
        ...modalProviderProps
    });
}
function $ea58ad6104d3cd1b$export$bf688221f59024e5(props) {
    return /*#__PURE__*/ (0, $exul0$react).createElement($ea58ad6104d3cd1b$export$178405afcd8c5eb, null, /*#__PURE__*/ (0, $exul0$react).createElement($ea58ad6104d3cd1b$var$OverlayContainerDOM, props));
}
function $ea58ad6104d3cd1b$export$b47c3594eab58386(props) {
    let isSSR = (0, $85138adc03e1f057$export$535bd6ca7f90a273)();
    let { portalContainer: portalContainer = isSSR ? null : document.body, ...rest } = props;
    let { getContainer: getContainer } = (0, $1255006bb8b1b64a$export$9fc1347d4195ccb3)();
    if (!props.portalContainer && getContainer) portalContainer = getContainer();
    (0, $exul0$react).useEffect(()=>{
        if (portalContainer === null || portalContainer === void 0 ? void 0 : portalContainer.closest('[data-overlay-container]')) throw new Error('An OverlayContainer must not be inside another container. Please change the portalContainer prop.');
    }, [
        portalContainer
    ]);
    if (!portalContainer) return null;
    let contents = /*#__PURE__*/ (0, $exul0$react).createElement($ea58ad6104d3cd1b$export$bf688221f59024e5, rest);
    return /*#__PURE__*/ (0, $exul0$reactdom).createPortal(contents, portalContainer);
}
function $ea58ad6104d3cd1b$export$33ffd74ebf07f060(options) {
    // Add aria-hidden to all parent providers on mount, and restore on unmount.
    let context = (0, $exul0$useContext)($ea58ad6104d3cd1b$var$Context);
    if (!context) throw new Error('Modal is not contained within a provider');
    (0, $exul0$useEffect)(()=>{
        if ((options === null || options === void 0 ? void 0 : options.isDisabled) || !context || !context.parent) return;
        // The immediate context is from the provider containing this modal, so we only
        // want to trigger aria-hidden on its parents not on the modal provider itself.
        context.parent.addModal();
        return ()=>{
            if (context && context.parent) context.parent.removeModal();
        };
    }, [
        context,
        context.parent,
        options === null || options === void 0 ? void 0 : options.isDisabled
    ]);
    return {
        modalProps: {
            'data-ismodal': !(options === null || options === void 0 ? void 0 : options.isDisabled)
        }
    };
}


export {$ea58ad6104d3cd1b$export$178405afcd8c5eb as ModalProvider, $ea58ad6104d3cd1b$export$d9aaed4c3ece1bc0 as useModalProvider, $ea58ad6104d3cd1b$export$bf688221f59024e5 as OverlayProvider, $ea58ad6104d3cd1b$export$b47c3594eab58386 as OverlayContainer, $ea58ad6104d3cd1b$export$33ffd74ebf07f060 as useModal};
//# sourceMappingURL=useModal.js.map
