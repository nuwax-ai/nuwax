import {BaseCollection as $6f0c29017aeec335$export$408d25a4e12db025, CollectionNode as $6f0c29017aeec335$export$d68d59712b04d9d1} from "./BaseCollection.mjs";
import {Document as $96ead35620b8fd36$export$b34a105447964f9f} from "./Document.mjs";
import {useCachedChildren as $a80bd3e9349588e7$export$727c8fc270210f13} from "./useCachedChildren.mjs";
import {FocusableContext as $d1116acdf220c2da$export$f9762fab77588ecb} from "../interactions/useFocusable.mjs";
import {Hidden as $d7f64c32b702fe2c$export$8dc98ba7eadeaa56} from "./Hidden.mjs";
import {useIsSSR as $c7eafbbe1ea5834e$export$535bd6ca7f90a273} from "../ssr/SSRProvider.mjs";
import {createPortal as $kT5Ur$createPortal} from "react-dom";
import $kT5Ur$react, {createContext as $kT5Ur$createContext, useContext as $kT5Ur$useContext, useRef as $kT5Ur$useRef, useCallback as $kT5Ur$useCallback, useState as $kT5Ur$useState, forwardRef as $kT5Ur$forwardRef, useMemo as $kT5Ur$useMemo} from "react";
import {useSyncExternalStore as $kT5Ur$useSyncExternalStore} from "use-sync-external-store/shim/index.js";

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








const $42ceafc619f9c3ba$var$ShallowRenderContext = /*#__PURE__*/ (0, $kT5Ur$createContext)(false);
const $42ceafc619f9c3ba$var$CollectionDocumentContext = /*#__PURE__*/ (0, $kT5Ur$createContext)(null);
function $42ceafc619f9c3ba$export$bf788dd355e3a401(props) {
    // If a document was provided above us, we're already in a hidden tree. Just render the content.
    let doc = (0, $kT5Ur$useContext)($42ceafc619f9c3ba$var$CollectionDocumentContext);
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
    let { collection: collection, document: document } = $42ceafc619f9c3ba$var$useCollectionDocument(props.createCollection);
    return /*#__PURE__*/ (0, $kT5Ur$react).createElement((0, $kT5Ur$react).Fragment, null, /*#__PURE__*/ (0, $kT5Ur$react).createElement((0, $d7f64c32b702fe2c$export$8dc98ba7eadeaa56), null, /*#__PURE__*/ (0, $kT5Ur$react).createElement($42ceafc619f9c3ba$var$CollectionDocumentContext.Provider, {
        value: document
    }, props.content)), /*#__PURE__*/ (0, $kT5Ur$react).createElement($42ceafc619f9c3ba$var$CollectionInner, {
        render: props.children,
        collection: collection
    }));
}
function $42ceafc619f9c3ba$var$CollectionInner({ collection: collection, render: render }) {
    return render(collection);
}
// React 16 and 17 don't support useSyncExternalStore natively, and the shim provided by React does not support getServerSnapshot.
// This wrapper uses the shim, but additionally calls getServerSnapshot during SSR (according to SSRProvider).
function $42ceafc619f9c3ba$var$useSyncExternalStoreFallback(subscribe, getSnapshot, getServerSnapshot) {
    let isSSR = (0, $c7eafbbe1ea5834e$export$535bd6ca7f90a273)();
    let isSSRRef = (0, $kT5Ur$useRef)(isSSR);
    // This is read immediately inside the wrapper, which also runs during render.
    // We just need a ref to avoid invalidating the callback itself, which
    // would cause React to re-run the callback more than necessary.
    // eslint-disable-next-line rsp-rules/pure-render
    isSSRRef.current = isSSR;
    let getSnapshotWrapper = (0, $kT5Ur$useCallback)(()=>{
        return isSSRRef.current ? getServerSnapshot() : getSnapshot();
    }, [
        getSnapshot,
        getServerSnapshot
    ]);
    return (0, $kT5Ur$useSyncExternalStore)(subscribe, getSnapshotWrapper);
}
const $42ceafc619f9c3ba$var$useSyncExternalStore = typeof (0, $kT5Ur$react)['useSyncExternalStore'] === 'function' ? (0, $kT5Ur$react)['useSyncExternalStore'] : $42ceafc619f9c3ba$var$useSyncExternalStoreFallback;
function $42ceafc619f9c3ba$var$useCollectionDocument(createCollection) {
    // The document instance is mutable, and should never change between renders.
    // useSyncExternalStore is used to subscribe to updates, which vends immutable Collection objects.
    let [document] = (0, $kT5Ur$useState)(()=>new (0, $96ead35620b8fd36$export$b34a105447964f9f)(createCollection?.() || new (0, $6f0c29017aeec335$export$408d25a4e12db025)()));
    let subscribe = (0, $kT5Ur$useCallback)((fn)=>document.subscribe(fn), [
        document
    ]);
    let getSnapshot = (0, $kT5Ur$useCallback)(()=>{
        let collection = document.getCollection();
        if (document.isSSR) // After SSR is complete, reset the document to empty so it is ready for React to render the portal into.
        // We do this _after_ getting the collection above so that the collection still has content in it from SSR
        // during the current render, before React has finished the client render.
        document.resetAfterSSR();
        return collection;
    }, [
        document
    ]);
    let getServerSnapshot = (0, $kT5Ur$useCallback)(()=>{
        document.isSSR = true;
        return document.getCollection();
    }, [
        document
    ]);
    let collection = $42ceafc619f9c3ba$var$useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    return {
        collection: collection,
        document: document
    };
}
const $42ceafc619f9c3ba$var$SSRContext = /*#__PURE__*/ (0, $kT5Ur$createContext)(null);
function $42ceafc619f9c3ba$var$createCollectionNodeClass(type) {
    let NodeClass = class extends (0, $6f0c29017aeec335$export$d68d59712b04d9d1) {
        static{
            this.type = type;
        }
    };
    return NodeClass;
}
function $42ceafc619f9c3ba$var$useSSRCollectionNode(CollectionNodeClass, props, ref, rendered, children, render) {
    // To prevent breaking change, if CollectionNodeClass is a string, create a CollectionNodeClass using the string as the type
    if (typeof CollectionNodeClass === 'string') CollectionNodeClass = $42ceafc619f9c3ba$var$createCollectionNodeClass(CollectionNodeClass);
    // During SSR, portals are not supported, so the collection children will be wrapped in an SSRContext.
    // Since SSR occurs only once, we assume that the elements are rendered in order and never re-render.
    // Therefore we can create elements in our collection document during render so that they are in the
    // collection by the time we need to use the collection to render to the real DOM.
    // After hydration, we switch to client rendering using the portal.
    let itemRef = (0, $kT5Ur$useCallback)((element)=>{
        element?.setProps(props, ref, CollectionNodeClass, rendered, render);
    }, [
        props,
        ref,
        rendered,
        render,
        CollectionNodeClass
    ]);
    let parentNode = (0, $kT5Ur$useContext)($42ceafc619f9c3ba$var$SSRContext);
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
        return children ? /*#__PURE__*/ (0, $kT5Ur$react).createElement($42ceafc619f9c3ba$var$SSRContext.Provider, {
            value: element
        }, children) : null;
    }
    // @ts-ignore
    return /*#__PURE__*/ (0, $kT5Ur$react).createElement(CollectionNodeClass.type, {
        ref: itemRef
    }, children);
}
function $42ceafc619f9c3ba$export$18af5c7a9e9b3664(CollectionNodeClass, render) {
    let Component = ({ node: node })=>render(node.props, node.props.ref, node);
    let Result = (0, $kT5Ur$forwardRef)((props, ref)=>{
        let focusableProps = (0, $kT5Ur$useContext)((0, $d1116acdf220c2da$export$f9762fab77588ecb));
        let isShallow = (0, $kT5Ur$useContext)($42ceafc619f9c3ba$var$ShallowRenderContext);
        if (!isShallow) {
            if (render.length >= 3) throw new Error(render.name + ' cannot be rendered outside a collection.');
            return render(props, ref);
        }
        return $42ceafc619f9c3ba$var$useSSRCollectionNode(CollectionNodeClass, props, ref, 'children' in props ? props.children : null, null, (node)=>// Forward FocusableContext to real DOM tree so tooltips work.
            /*#__PURE__*/ (0, $kT5Ur$react).createElement((0, $d1116acdf220c2da$export$f9762fab77588ecb).Provider, {
                value: focusableProps
            }, /*#__PURE__*/ (0, $kT5Ur$react).createElement(Component, {
                node: node
            })));
    });
    // @ts-ignore
    Result.displayName = render.name;
    return Result;
}
function $42ceafc619f9c3ba$export$e953bb1cd0f19726(CollectionNodeClass, render, useChildren = $42ceafc619f9c3ba$var$useCollectionChildren) {
    let Component = ({ node: node })=>render(node.props, node.props.ref, node);
    let Result = (0, $kT5Ur$forwardRef)((props, ref)=>{
        let children = useChildren(props);
        return $42ceafc619f9c3ba$var$useSSRCollectionNode(CollectionNodeClass, props, ref, null, children, (node)=>/*#__PURE__*/ (0, $kT5Ur$react).createElement(Component, {
                node: node
            })) ?? /*#__PURE__*/ (0, $kT5Ur$react).createElement((0, $kT5Ur$react).Fragment, null);
    });
    // @ts-ignore
    Result.displayName = render.name;
    return Result;
}
function $42ceafc619f9c3ba$var$useCollectionChildren(options) {
    return (0, $a80bd3e9349588e7$export$727c8fc270210f13)({
        ...options,
        addIdAndValue: true
    });
}
const $42ceafc619f9c3ba$var$CollectionContext = /*#__PURE__*/ (0, $kT5Ur$createContext)(null);
function $42ceafc619f9c3ba$export$fb8073518f34e6ec(props) {
    let ctx = (0, $kT5Ur$useContext)($42ceafc619f9c3ba$var$CollectionContext);
    let dependencies = (ctx?.dependencies || []).concat(props.dependencies);
    let idScope = props.idScope ?? ctx?.idScope;
    let children = $42ceafc619f9c3ba$var$useCollectionChildren({
        ...props,
        idScope: idScope,
        dependencies: dependencies
    });
    let doc = (0, $kT5Ur$useContext)($42ceafc619f9c3ba$var$CollectionDocumentContext);
    if (doc) children = /*#__PURE__*/ (0, $kT5Ur$react).createElement($42ceafc619f9c3ba$var$CollectionRoot, null, children);
    // Propagate dependencies and idScope to child collections.
    ctx = (0, $kT5Ur$useMemo)(()=>({
            dependencies: dependencies,
            idScope: idScope
        }), // eslint-disable-next-line react-hooks/exhaustive-deps
    [
        idScope,
        ...dependencies
    ]);
    return /*#__PURE__*/ (0, $kT5Ur$react).createElement($42ceafc619f9c3ba$var$CollectionContext.Provider, {
        value: ctx
    }, children);
}
function $42ceafc619f9c3ba$var$CollectionRoot({ children: children }) {
    let doc = (0, $kT5Ur$useContext)($42ceafc619f9c3ba$var$CollectionDocumentContext);
    let wrappedChildren = (0, $kT5Ur$useMemo)(()=>/*#__PURE__*/ (0, $kT5Ur$react).createElement($42ceafc619f9c3ba$var$CollectionDocumentContext.Provider, {
            value: null
        }, /*#__PURE__*/ (0, $kT5Ur$react).createElement($42ceafc619f9c3ba$var$ShallowRenderContext.Provider, {
            value: true
        }, children)), [
        children
    ]);
    // During SSR, we render the content directly, and append nodes to the document during render.
    // The collection children return null so that nothing is actually rendered into the HTML.
    return (0, $c7eafbbe1ea5834e$export$535bd6ca7f90a273)() ? /*#__PURE__*/ (0, $kT5Ur$react).createElement($42ceafc619f9c3ba$var$SSRContext.Provider, {
        value: doc
    }, wrappedChildren) : /*#__PURE__*/ (0, $kT5Ur$createPortal)(wrappedChildren, doc);
}


export {$42ceafc619f9c3ba$export$bf788dd355e3a401 as CollectionBuilder, $42ceafc619f9c3ba$export$18af5c7a9e9b3664 as createLeafComponent, $42ceafc619f9c3ba$export$e953bb1cd0f19726 as createBranchComponent, $42ceafc619f9c3ba$export$fb8073518f34e6ec as Collection};
//# sourceMappingURL=CollectionBuilder.mjs.map
