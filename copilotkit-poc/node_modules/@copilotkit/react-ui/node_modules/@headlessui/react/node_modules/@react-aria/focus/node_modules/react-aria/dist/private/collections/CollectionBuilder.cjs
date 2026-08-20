var $a76f1c7ecd25aae2$exports = require("./BaseCollection.cjs");
var $d25e7dd485e8c002$exports = require("./Document.cjs");
var $252b361f1adaf82f$exports = require("./useCachedChildren.cjs");
var $cfe896014413cb8c$exports = require("../interactions/useFocusable.cjs");
var $680d2e5e7cbb12b5$exports = require("./Hidden.cjs");
var $25c7fefe1bb8073e$exports = require("../ssr/SSRProvider.cjs");
var $i5fXx$reactdom = require("react-dom");
var $i5fXx$react = require("react");
var $i5fXx$usesyncexternalstoreshimindexjs = require("use-sync-external-store/shim/index.js");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "CollectionBuilder", function () { return $e44165de1d1c1606$export$bf788dd355e3a401; });
$parcel$export(module.exports, "createLeafComponent", function () { return $e44165de1d1c1606$export$18af5c7a9e9b3664; });
$parcel$export(module.exports, "createBranchComponent", function () { return $e44165de1d1c1606$export$e953bb1cd0f19726; });
$parcel$export(module.exports, "Collection", function () { return $e44165de1d1c1606$export$fb8073518f34e6ec; });
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








const $e44165de1d1c1606$var$ShallowRenderContext = /*#__PURE__*/ (0, $i5fXx$react.createContext)(false);
const $e44165de1d1c1606$var$CollectionDocumentContext = /*#__PURE__*/ (0, $i5fXx$react.createContext)(null);
function $e44165de1d1c1606$export$bf788dd355e3a401(props) {
    // If a document was provided above us, we're already in a hidden tree. Just render the content.
    let doc = (0, $i5fXx$react.useContext)($e44165de1d1c1606$var$CollectionDocumentContext);
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
    let { collection: collection, document: document } = $e44165de1d1c1606$var$useCollectionDocument(props.createCollection);
    return /*#__PURE__*/ (0, ($parcel$interopDefault($i5fXx$react))).createElement((0, ($parcel$interopDefault($i5fXx$react))).Fragment, null, /*#__PURE__*/ (0, ($parcel$interopDefault($i5fXx$react))).createElement((0, $680d2e5e7cbb12b5$exports.Hidden), null, /*#__PURE__*/ (0, ($parcel$interopDefault($i5fXx$react))).createElement($e44165de1d1c1606$var$CollectionDocumentContext.Provider, {
        value: document
    }, props.content)), /*#__PURE__*/ (0, ($parcel$interopDefault($i5fXx$react))).createElement($e44165de1d1c1606$var$CollectionInner, {
        render: props.children,
        collection: collection
    }));
}
function $e44165de1d1c1606$var$CollectionInner({ collection: collection, render: render }) {
    return render(collection);
}
// React 16 and 17 don't support useSyncExternalStore natively, and the shim provided by React does not support getServerSnapshot.
// This wrapper uses the shim, but additionally calls getServerSnapshot during SSR (according to SSRProvider).
function $e44165de1d1c1606$var$useSyncExternalStoreFallback(subscribe, getSnapshot, getServerSnapshot) {
    let isSSR = (0, $25c7fefe1bb8073e$exports.useIsSSR)();
    let isSSRRef = (0, $i5fXx$react.useRef)(isSSR);
    // This is read immediately inside the wrapper, which also runs during render.
    // We just need a ref to avoid invalidating the callback itself, which
    // would cause React to re-run the callback more than necessary.
    // eslint-disable-next-line rsp-rules/pure-render
    isSSRRef.current = isSSR;
    let getSnapshotWrapper = (0, $i5fXx$react.useCallback)(()=>{
        return isSSRRef.current ? getServerSnapshot() : getSnapshot();
    }, [
        getSnapshot,
        getServerSnapshot
    ]);
    return (0, $i5fXx$usesyncexternalstoreshimindexjs.useSyncExternalStore)(subscribe, getSnapshotWrapper);
}
const $e44165de1d1c1606$var$useSyncExternalStore = typeof (0, ($parcel$interopDefault($i5fXx$react)))['useSyncExternalStore'] === 'function' ? (0, ($parcel$interopDefault($i5fXx$react)))['useSyncExternalStore'] : $e44165de1d1c1606$var$useSyncExternalStoreFallback;
function $e44165de1d1c1606$var$useCollectionDocument(createCollection) {
    // The document instance is mutable, and should never change between renders.
    // useSyncExternalStore is used to subscribe to updates, which vends immutable Collection objects.
    let [document] = (0, $i5fXx$react.useState)(()=>new (0, $d25e7dd485e8c002$exports.Document)(createCollection?.() || new (0, $a76f1c7ecd25aae2$exports.BaseCollection)()));
    let subscribe = (0, $i5fXx$react.useCallback)((fn)=>document.subscribe(fn), [
        document
    ]);
    let getSnapshot = (0, $i5fXx$react.useCallback)(()=>{
        let collection = document.getCollection();
        if (document.isSSR) // After SSR is complete, reset the document to empty so it is ready for React to render the portal into.
        // We do this _after_ getting the collection above so that the collection still has content in it from SSR
        // during the current render, before React has finished the client render.
        document.resetAfterSSR();
        return collection;
    }, [
        document
    ]);
    let getServerSnapshot = (0, $i5fXx$react.useCallback)(()=>{
        document.isSSR = true;
        return document.getCollection();
    }, [
        document
    ]);
    let collection = $e44165de1d1c1606$var$useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    return {
        collection: collection,
        document: document
    };
}
const $e44165de1d1c1606$var$SSRContext = /*#__PURE__*/ (0, $i5fXx$react.createContext)(null);
function $e44165de1d1c1606$var$createCollectionNodeClass(type) {
    let NodeClass = class extends (0, $a76f1c7ecd25aae2$exports.CollectionNode) {
        static{
            this.type = type;
        }
    };
    return NodeClass;
}
function $e44165de1d1c1606$var$useSSRCollectionNode(CollectionNodeClass, props, ref, rendered, children, render) {
    // To prevent breaking change, if CollectionNodeClass is a string, create a CollectionNodeClass using the string as the type
    if (typeof CollectionNodeClass === 'string') CollectionNodeClass = $e44165de1d1c1606$var$createCollectionNodeClass(CollectionNodeClass);
    // During SSR, portals are not supported, so the collection children will be wrapped in an SSRContext.
    // Since SSR occurs only once, we assume that the elements are rendered in order and never re-render.
    // Therefore we can create elements in our collection document during render so that they are in the
    // collection by the time we need to use the collection to render to the real DOM.
    // After hydration, we switch to client rendering using the portal.
    let itemRef = (0, $i5fXx$react.useCallback)((element)=>{
        element?.setProps(props, ref, CollectionNodeClass, rendered, render);
    }, [
        props,
        ref,
        rendered,
        render,
        CollectionNodeClass
    ]);
    let parentNode = (0, $i5fXx$react.useContext)($e44165de1d1c1606$var$SSRContext);
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
        return children ? /*#__PURE__*/ (0, ($parcel$interopDefault($i5fXx$react))).createElement($e44165de1d1c1606$var$SSRContext.Provider, {
            value: element
        }, children) : null;
    }
    // @ts-ignore
    return /*#__PURE__*/ (0, ($parcel$interopDefault($i5fXx$react))).createElement(CollectionNodeClass.type, {
        ref: itemRef
    }, children);
}
function $e44165de1d1c1606$export$18af5c7a9e9b3664(CollectionNodeClass, render) {
    let Component = ({ node: node })=>render(node.props, node.props.ref, node);
    let Result = (0, $i5fXx$react.forwardRef)((props, ref)=>{
        let focusableProps = (0, $i5fXx$react.useContext)((0, $cfe896014413cb8c$exports.FocusableContext));
        let isShallow = (0, $i5fXx$react.useContext)($e44165de1d1c1606$var$ShallowRenderContext);
        if (!isShallow) {
            if (render.length >= 3) throw new Error(render.name + ' cannot be rendered outside a collection.');
            return render(props, ref);
        }
        return $e44165de1d1c1606$var$useSSRCollectionNode(CollectionNodeClass, props, ref, 'children' in props ? props.children : null, null, (node)=>// Forward FocusableContext to real DOM tree so tooltips work.
            /*#__PURE__*/ (0, ($parcel$interopDefault($i5fXx$react))).createElement((0, $cfe896014413cb8c$exports.FocusableContext).Provider, {
                value: focusableProps
            }, /*#__PURE__*/ (0, ($parcel$interopDefault($i5fXx$react))).createElement(Component, {
                node: node
            })));
    });
    // @ts-ignore
    Result.displayName = render.name;
    return Result;
}
function $e44165de1d1c1606$export$e953bb1cd0f19726(CollectionNodeClass, render, useChildren = $e44165de1d1c1606$var$useCollectionChildren) {
    let Component = ({ node: node })=>render(node.props, node.props.ref, node);
    let Result = (0, $i5fXx$react.forwardRef)((props, ref)=>{
        let children = useChildren(props);
        return $e44165de1d1c1606$var$useSSRCollectionNode(CollectionNodeClass, props, ref, null, children, (node)=>/*#__PURE__*/ (0, ($parcel$interopDefault($i5fXx$react))).createElement(Component, {
                node: node
            })) ?? /*#__PURE__*/ (0, ($parcel$interopDefault($i5fXx$react))).createElement((0, ($parcel$interopDefault($i5fXx$react))).Fragment, null);
    });
    // @ts-ignore
    Result.displayName = render.name;
    return Result;
}
function $e44165de1d1c1606$var$useCollectionChildren(options) {
    return (0, $252b361f1adaf82f$exports.useCachedChildren)({
        ...options,
        addIdAndValue: true
    });
}
const $e44165de1d1c1606$var$CollectionContext = /*#__PURE__*/ (0, $i5fXx$react.createContext)(null);
function $e44165de1d1c1606$export$fb8073518f34e6ec(props) {
    let ctx = (0, $i5fXx$react.useContext)($e44165de1d1c1606$var$CollectionContext);
    let dependencies = (ctx?.dependencies || []).concat(props.dependencies);
    let idScope = props.idScope ?? ctx?.idScope;
    let children = $e44165de1d1c1606$var$useCollectionChildren({
        ...props,
        idScope: idScope,
        dependencies: dependencies
    });
    let doc = (0, $i5fXx$react.useContext)($e44165de1d1c1606$var$CollectionDocumentContext);
    if (doc) children = /*#__PURE__*/ (0, ($parcel$interopDefault($i5fXx$react))).createElement($e44165de1d1c1606$var$CollectionRoot, null, children);
    // Propagate dependencies and idScope to child collections.
    ctx = (0, $i5fXx$react.useMemo)(()=>({
            dependencies: dependencies,
            idScope: idScope
        }), // eslint-disable-next-line react-hooks/exhaustive-deps
    [
        idScope,
        ...dependencies
    ]);
    return /*#__PURE__*/ (0, ($parcel$interopDefault($i5fXx$react))).createElement($e44165de1d1c1606$var$CollectionContext.Provider, {
        value: ctx
    }, children);
}
function $e44165de1d1c1606$var$CollectionRoot({ children: children }) {
    let doc = (0, $i5fXx$react.useContext)($e44165de1d1c1606$var$CollectionDocumentContext);
    let wrappedChildren = (0, $i5fXx$react.useMemo)(()=>/*#__PURE__*/ (0, ($parcel$interopDefault($i5fXx$react))).createElement($e44165de1d1c1606$var$CollectionDocumentContext.Provider, {
            value: null
        }, /*#__PURE__*/ (0, ($parcel$interopDefault($i5fXx$react))).createElement($e44165de1d1c1606$var$ShallowRenderContext.Provider, {
            value: true
        }, children)), [
        children
    ]);
    // During SSR, we render the content directly, and append nodes to the document during render.
    // The collection children return null so that nothing is actually rendered into the HTML.
    return (0, $25c7fefe1bb8073e$exports.useIsSSR)() ? /*#__PURE__*/ (0, ($parcel$interopDefault($i5fXx$react))).createElement($e44165de1d1c1606$var$SSRContext.Provider, {
        value: doc
    }, wrappedChildren) : /*#__PURE__*/ (0, $i5fXx$reactdom.createPortal)(wrappedChildren, doc);
}


//# sourceMappingURL=CollectionBuilder.cjs.map
