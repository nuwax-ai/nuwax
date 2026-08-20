import {useIsSSR as $c7eafbbe1ea5834e$export$535bd6ca7f90a273} from "../ssr/SSRProvider.mjs";
import {useUNSAFE_PortalContext as $72abaeab4d80592f$export$9fc1347d4195ccb3} from "./PortalProvider.mjs";
import $eXzCv$react, {useContext as $eXzCv$useContext, useState as $eXzCv$useState, useMemo as $eXzCv$useMemo, useEffect as $eXzCv$useEffect} from "react";
import $eXzCv$reactdom from "react-dom";

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



const $c07df45195231803$var$Context = /*#__PURE__*/ (0, $eXzCv$react).createContext(null);
function $c07df45195231803$export$178405afcd8c5eb(props) {
    let { children: children } = props;
    let parent = (0, $eXzCv$useContext)($c07df45195231803$var$Context);
    let [modalCount, setModalCount] = (0, $eXzCv$useState)(0);
    let context = (0, $eXzCv$useMemo)(()=>({
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
    return /*#__PURE__*/ (0, $eXzCv$react).createElement($c07df45195231803$var$Context.Provider, {
        value: context
    }, children);
}
function $c07df45195231803$export$d9aaed4c3ece1bc0() {
    let context = (0, $eXzCv$useContext)($c07df45195231803$var$Context);
    return {
        modalProviderProps: {
            'aria-hidden': context && context.modalCount > 0 ? true : undefined
        }
    };
}
/**
 * Creates a root node that will be aria-hidden if there are other modals open.
 */ function $c07df45195231803$var$OverlayContainerDOM(props) {
    let { modalProviderProps: modalProviderProps } = $c07df45195231803$export$d9aaed4c3ece1bc0();
    return /*#__PURE__*/ (0, $eXzCv$react).createElement("div", {
        "data-overlay-container": true,
        ...props,
        ...modalProviderProps
    });
}
function $c07df45195231803$export$bf688221f59024e5(props) {
    return /*#__PURE__*/ (0, $eXzCv$react).createElement($c07df45195231803$export$178405afcd8c5eb, null, /*#__PURE__*/ (0, $eXzCv$react).createElement($c07df45195231803$var$OverlayContainerDOM, props));
}
function $c07df45195231803$export$b47c3594eab58386(props) {
    let isSSR = (0, $c7eafbbe1ea5834e$export$535bd6ca7f90a273)();
    let { portalContainer: portalContainer = isSSR ? null : document.body, ...rest } = props;
    let { getContainer: getContainer } = (0, $72abaeab4d80592f$export$9fc1347d4195ccb3)();
    if (!props.portalContainer && getContainer) portalContainer = getContainer();
    (0, $eXzCv$react).useEffect(()=>{
        if (portalContainer?.closest('[data-overlay-container]')) throw new Error('An OverlayContainer must not be inside another container. Please change the portalContainer prop.');
    }, [
        portalContainer
    ]);
    if (!portalContainer) return null;
    let contents = /*#__PURE__*/ (0, $eXzCv$react).createElement($c07df45195231803$export$bf688221f59024e5, rest);
    return /*#__PURE__*/ (0, $eXzCv$reactdom).createPortal(contents, portalContainer);
}
function $c07df45195231803$export$33ffd74ebf07f060(options) {
    // Add aria-hidden to all parent providers on mount, and restore on unmount.
    let context = (0, $eXzCv$useContext)($c07df45195231803$var$Context);
    if (!context) throw new Error('Modal is not contained within a provider');
    (0, $eXzCv$useEffect)(()=>{
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


export {$c07df45195231803$export$178405afcd8c5eb as ModalProvider, $c07df45195231803$export$d9aaed4c3ece1bc0 as useModalProvider, $c07df45195231803$export$bf688221f59024e5 as OverlayProvider, $c07df45195231803$export$b47c3594eab58386 as OverlayContainer, $c07df45195231803$export$33ffd74ebf07f060 as useModal};
//# sourceMappingURL=useModal.mjs.map
