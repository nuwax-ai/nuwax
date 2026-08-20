import {BaseCollection as $0c55dae31ace3277$export$408d25a4e12db025, CollectionNode as $0c55dae31ace3277$export$d68d59712b04d9d1} from "./BaseCollection.js";
import {Document as $b4d65d3a608b09a7$export$b34a105447964f9f} from "./Document.js";
import {useCachedChildren as $91ad91478b215293$export$727c8fc270210f13} from "./useCachedChildren.js";
import {FocusableContext as $088f27a386bc4a8f$export$f9762fab77588ecb} from "../interactions/useFocusable.js";
import {Hidden as $dd46fb4c3e047f13$export$8dc98ba7eadeaa56} from "./Hidden.js";
import {useIsSSR as $85138adc03e1f057$export$535bd6ca7f90a273} from "../ssr/SSRProvider.js";
import {createPortal as $87Tar$createPortal} from "react-dom";
import $87Tar$react, {createContext as $87Tar$createContext, useContext as $87Tar$useContext, useRef as $87Tar$useRef, useCallback as $87Tar$useCallback, useState as $87Tar$useState, forwardRef as $87Tar$forwardRef, useMemo as $87Tar$useMemo} from "react";
import {useSyncExternalStore as $87Tar$useSyncExternalStore} from "use-sync-external-store/shim/index.js";

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








const $d0e72a6e56b3c41b$var$ShallowRenderContext = /*#__PURE__*/ (0, $87Tar$createContext)(false);
const $d0e72a6e56b3c41b$var$CollectionDocumentContext = /*#__PURE__*/ (0, $87Tar$createContext)(null);
function $d0e72a6e56b3c41b$export$bf788dd355e3a401(props) {
    // If a document was provided above us, we're already in a hidden tree. Just render the content.
    let doc = (0, $87Tar$useContext)($d0e72a6e56b3c41b$var$CollectionDocumentContext);
    if (doc) // The React types prior to 18 did not allow returning ReactNode from components
    // even though the actual implementation since React 16 did.
    // We must return ReactElement so that TS does not complain that <CollectionBuilder>
    // is not a valid JSX element with React 16 and 17 types.
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20544
    return props.content;
    // Otherwise, render a hidden copy of the children so that we can build the collection before constructing the state.
    // This should always come before the real DOM content so we have built the collection by the time it renders during SSR.
    // This is fine. CollectionDocumentContext never changes after mounting.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    let { collection: collection, document: document } = $d0e72a6e56b3c41b$var$useCollectionDocument(props.createCollection);
    return /*#__PURE__*/ (0, $87Tar$react).createElement((0, $87Tar$react).Fragment, null, /*#__PURE__*/ (0, $87Tar$react).createElement((0, $dd46fb4c3e047f13$export$8dc98ba7eadeaa56), null, /*#__PURE__*/ (0, $87Tar$react).createElement($d0e72a6e56b3c41b$var$CollectionDocumentContext.Provider, {
        value: document
    }, props.content)), /*#__PURE__*/ (0, $87Tar$react).createElement($d0e72a6e56b3c41b$var$CollectionInner, {
        render: props.children,
        collection: collection
    }));
}
function $d0e72a6e56b3c41b$var$CollectionInner({ collection: collection, render: render }) {
    return render(collection);
}
// React 16 and 17 don't support useSyncExternalStore natively, and the shim provided by React does not support getServerSnapshot.
// This wrapper uses the shim, but additionally calls getServerSnapshot during SSR (according to SSRProvider).
function $d0e72a6e56b3c41b$var$useSyncExternalStoreFallback(subscribe, getSnapshot, getServerSnapshot) {
    let isSSR = (0, $85138adc03e1f057$export$535bd6ca7f90a273)();
    let isSSRRef = (0, $87Tar$useRef)(isSSR);
    // This is read immediately inside the wrapper, which also runs during render.
    // We just need a ref to avoid invalidating the callback itself, which
    // would cause React to re-run the callback more than necessary.
    // eslint-disable-next-line rsp-rules/pure-render
    isSSRRef.current = isSSR;
    let getSnapshotWrapper = (0, $87Tar$useCallback)(()=>{
        return isSSRRef.current ? getServerSnapshot() : getSnapshot();
    }, [
        getSnapshot,
        getServerSnapshot
    ]);
    return (0, $87Tar$useSyncExternalStore)(subscribe, getSnapshotWrapper);
}
const $d0e72a6e56b3c41b$var$useSyncExternalStore = typeof (0, $87Tar$react)['useSyncExternalStore'] === 'function' ? (0, $87Tar$react)['useSyncExternalStore'] : $d0e72a6e56b3c41b$var$useSyncExternalStoreFallback;
function $d0e72a6e56b3c41b$var$useCollectionDocument(createCollection) {
    // The document instance is mutable, and should never change between renders.
    // useSyncExternalStore is used to subscribe to updates, which vends immutable Collection objects.
    let [document] = (0, $87Tar$useState)(()=>new (0, $b4d65d3a608b09a7$export$b34a105447964f9f)((createCollection === null || createCollection === void 0 ? void 0 : createCollection()) || new (0, $0c55dae31ace3277$export$408d25a4e12db025)()));
    let subscribe = (0, $87Tar$useCallback)((fn)=>document.subscribe(fn), [
        document
    ]);
    let getSnapshot = (0, $87Tar$useCallback)(()=>{
        let collection = document.getCollection();
        if (document.isSSR) // After SSR is complete, reset the document to empty so it is ready for React to render the portal into.
        // We do this _after_ getting the collection above so that the collection still has content in it from SSR
        // during the current render, before React has finished the client render.
        document.resetAfterSSR();
        return collection;
    }, [
        document
    ]);
    let getServerSnapshot = (0, $87Tar$useCallback)(()=>{
        document.isSSR = true;
        return document.getCollection();
    }, [
        document
    ]);
    let collection = $d0e72a6e56b3c41b$var$useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    return {
        collection: collection,
        document: document
    };
}
const $d0e72a6e56b3c41b$var$SSRContext = /*#__PURE__*/ (0, $87Tar$createContext)(null);
function $d0e72a6e56b3c41b$var$createCollectionNodeClass(type) {
    var _class;
    let NodeClass = (_class = class extends (0, $0c55dae31ace3277$export$d68d59712b04d9d1) {
    }, _class.type = type, _class);
    return NodeClass;
}
function $d0e72a6e56b3c41b$var$useSSRCollectionNode(CollectionNodeClass, props, ref, rendered, children, render) {
    // To prevent breaking change, if CollectionNodeClass is a string, create a CollectionNodeClass using the string as the type
    if (typeof CollectionNodeClass === 'string') CollectionNodeClass = $d0e72a6e56b3c41b$var$createCollectionNodeClass(CollectionNodeClass);
    // During SSR, portals are not supported, so the collection children will be wrapped in an SSRContext.
    // Since SSR occurs only once, we assume that the elements are rendered in order and never re-render.
    // Therefore we can create elements in our collection document during render so that they are in the
    // collection by the time we need to use the collection to render to the real DOM.
    // After hydration, we switch to client rendering using the portal.
    let itemRef = (0, $87Tar$useCallback)((element)=>{
        element === null || element === void 0 ? void 0 : element.setProps(props, ref, CollectionNodeClass, rendered, render);
    }, [
        props,
        ref,
        rendered,
        render,
        CollectionNodeClass
    ]);
    let parentNode = (0, $87Tar$useContext)($d0e72a6e56b3c41b$var$SSRContext);
    if (parentNode) {
        // Guard against double rendering in strict mode.
        let element = parentNode.ownerDocument.nodesByProps.get(props);
        if (!element) {
            element = parentNode.ownerDocument.createElement(CollectionNodeClass.type);
            element.setProps(props, ref, CollectionNodeClass, rendered, render);
            parentNode.appendChild(element);
            parentNode.ownerDocument.updateCollection();
            parentNode.ownerDocument.nodesByProps.set(props, element);
        }
        return children ? /*#__PURE__*/ (0, $87Tar$react).createElement($d0e72a6e56b3c41b$var$SSRContext.Provider, {
            value: element
        }, children) : null;
    }
    // @ts-ignore
    return /*#__PURE__*/ (0, $87Tar$react).createElement(CollectionNodeClass.type, {
        ref: itemRef
    }, children);
}
function $d0e72a6e56b3c41b$export$18af5c7a9e9b3664(CollectionNodeClass, render) {
    let Component = ({ node: node })=>render(node.props, node.props.ref, node);
    let Result = (0, $87Tar$forwardRef)((props, ref)=>{
        let focusableProps = (0, $87Tar$useContext)((0, $088f27a386bc4a8f$export$f9762fab77588ecb));
        let isShallow = (0, $87Tar$useContext)($d0e72a6e56b3c41b$var$ShallowRenderContext);
        if (!isShallow) {
            if (render.length >= 3) throw new Error(render.name + ' cannot be rendered outside a collection.');
            return render(props, ref);
        }
        return $d0e72a6e56b3c41b$var$useSSRCollectionNode(CollectionNodeClass, props, ref, 'children' in props ? props.children : null, null, (node)=>// Forward FocusableContext to real DOM tree so tooltips work.
            /*#__PURE__*/ (0, $87Tar$react).createElement((0, $088f27a386bc4a8f$export$f9762fab77588ecb).Provider, {
                value: focusableProps
            }, /*#__PURE__*/ (0, $87Tar$react).createElement(Component, {
                node: node
            })));
    });
    // @ts-ignore
    Result.displayName = render.name;
    return Result;
}
function $d0e72a6e56b3c41b$export$e953bb1cd0f19726(CollectionNodeClass, render, useChildren = $d0e72a6e56b3c41b$var$useCollectionChildren) {
    let Component = ({ node: node })=>render(node.props, node.props.ref, node);
    let Result = (0, $87Tar$forwardRef)((props, ref)=>{
        let children = useChildren(props);
        var _useSSRCollectionNode;
        return (_useSSRCollectionNode = $d0e72a6e56b3c41b$var$useSSRCollectionNode(CollectionNodeClass, props, ref, null, children, (node)=>/*#__PURE__*/ (0, $87Tar$react).createElement(Component, {
                node: node
            }))) !== null && _useSSRCollectionNode !== void 0 ? _useSSRCollectionNode : /*#__PURE__*/ (0, $87Tar$react).createElement((0, $87Tar$react).Fragment, null);
    });
    // @ts-ignore
    Result.displayName = render.name;
    return Result;
}
function $d0e72a6e56b3c41b$var$useCollectionChildren(options) {
    return (0, $91ad91478b215293$export$727c8fc270210f13)({
        ...options,
        addIdAndValue: true
    });
}
const $d0e72a6e56b3c41b$var$CollectionContext = /*#__PURE__*/ (0, $87Tar$createContext)(null);
function $d0e72a6e56b3c41b$export$fb8073518f34e6ec(props) {
    let ctx = (0, $87Tar$useContext)($d0e72a6e56b3c41b$var$CollectionContext);
    let dependencies = ((ctx === null || ctx === void 0 ? void 0 : ctx.dependencies) || []).concat(props.dependencies);
    var _props_idScope;
    let idScope = (_props_idScope = props.idScope) !== null && _props_idScope !== void 0 ? _props_idScope : ctx === null || ctx === void 0 ? void 0 : ctx.idScope;
    let children = $d0e72a6e56b3c41b$var$useCollectionChildren({
        ...props,
        idScope: idScope,
        dependencies: dependencies
    });
    let doc = (0, $87Tar$useContext)($d0e72a6e56b3c41b$var$CollectionDocumentContext);
    if (doc) children = /*#__PURE__*/ (0, $87Tar$react).createElement($d0e72a6e56b3c41b$var$CollectionRoot, null, children);
    // Propagate dependencies and idScope to child collections.
    ctx = (0, $87Tar$useMemo)(()=>({
            dependencies: dependencies,
            idScope: idScope
        }), // eslint-disable-next-line react-hooks/exhaustive-deps
    [
        idScope,
        ...dependencies
    ]);
    return /*#__PURE__*/ (0, $87Tar$react).createElement($d0e72a6e56b3c41b$var$CollectionContext.Provider, {
        value: ctx
    }, children);
}
function $d0e72a6e56b3c41b$var$CollectionRoot({ children: children }) {
    let doc = (0, $87Tar$useContext)($d0e72a6e56b3c41b$var$CollectionDocumentContext);
    let wrappedChildren = (0, $87Tar$useMemo)(()=>/*#__PURE__*/ (0, $87Tar$react).createElement($d0e72a6e56b3c41b$var$CollectionDocumentContext.Provider, {
            value: null
        }, /*#__PURE__*/ (0, $87Tar$react).createElement($d0e72a6e56b3c41b$var$ShallowRenderContext.Provider, {
            value: true
        }, children)), [
        children
    ]);
    // During SSR, we render the content directly, and append nodes to the document during render.
    // The collection children return null so that nothing is actually rendered into the HTML.
    return (0, $85138adc03e1f057$export$535bd6ca7f90a273)() ? /*#__PURE__*/ (0, $87Tar$react).createElement($d0e72a6e56b3c41b$var$SSRContext.Provider, {
        value: doc
    }, wrappedChildren) : /*#__PURE__*/ (0, $87Tar$createPortal)(wrappedChildren, doc);
}


export {$d0e72a6e56b3c41b$export$bf788dd355e3a401 as CollectionBuilder, $d0e72a6e56b3c41b$export$18af5c7a9e9b3664 as createLeafComponent, $d0e72a6e56b3c41b$export$e953bb1cd0f19726 as createBranchComponent, $d0e72a6e56b3c41b$export$fb8073518f34e6ec as Collection};
//# sourceMappingURL=CollectionBuilder.js.map
