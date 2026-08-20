import $bl59K$react, {useContext as $bl59K$useContext, useState as $bl59K$useState, useMemo as $bl59K$useMemo, useLayoutEffect as $bl59K$useLayoutEffect, useRef as $bl59K$useRef} from "react";

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
 */ // We must avoid a circular dependency with @react-aria/utils, and this useLayoutEffect is
// guarded by a check that it only runs on the client side.
// eslint-disable-next-line rsp-rules/use-layout-effect-rule

// Default context value to use in case there is no SSRProvider. This is fine for
// client-only apps. In order to support multiple copies of React Aria potentially
// being on the page at once, the prefix is set to a random number. SSRProvider
// will reset this to zero for consistency between server and client, so in the
// SSR case multiple copies of React Aria is not supported.
const $c7eafbbe1ea5834e$var$defaultContext = {
    prefix: String(Math.round(Math.random() * 10000000000)),
    current: 0
};
const $c7eafbbe1ea5834e$var$SSRContext = /*#__PURE__*/ (0, $bl59K$react).createContext($c7eafbbe1ea5834e$var$defaultContext);
const $c7eafbbe1ea5834e$var$IsSSRContext = /*#__PURE__*/ (0, $bl59K$react).createContext(false);
// This is only used in React < 18.
function $c7eafbbe1ea5834e$var$LegacySSRProvider(props) {
    let cur = (0, $bl59K$useContext)($c7eafbbe1ea5834e$var$SSRContext);
    let counter = $c7eafbbe1ea5834e$var$useCounter(cur === $c7eafbbe1ea5834e$var$defaultContext);
    let [isSSR, setIsSSR] = (0, $bl59K$useState)(true);
    let value = (0, $bl59K$useMemo)(()=>({
            // If this is the first SSRProvider, start with an empty string prefix, otherwise
            // append and increment the counter.
            prefix: cur === $c7eafbbe1ea5834e$var$defaultContext ? '' : `${cur.prefix}-${counter}`,
            current: 0
        }), [
        cur,
        counter
    ]);
    // If on the client, and the component was initially server rendered,
    // then schedule a layout effect to update the component after hydration.
    if (typeof document !== 'undefined') // This if statement technically breaks the rules of hooks, but is safe
    // because the condition never changes after mounting.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    (0, $bl59K$useLayoutEffect)(()=>{
        setIsSSR(false);
    }, []);
    return /*#__PURE__*/ (0, $bl59K$react).createElement($c7eafbbe1ea5834e$var$SSRContext.Provider, {
        value: value
    }, /*#__PURE__*/ (0, $bl59K$react).createElement($c7eafbbe1ea5834e$var$IsSSRContext.Provider, {
        value: isSSR
    }, props.children));
}
let $c7eafbbe1ea5834e$var$warnedAboutSSRProvider = false;
function $c7eafbbe1ea5834e$export$9f8ac96af4b1b2ae(props) {
    if (typeof (0, $bl59K$react)['useId'] === 'function') {
        if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'production' && !$c7eafbbe1ea5834e$var$warnedAboutSSRProvider) {
            console.warn('In React 18, SSRProvider is not necessary and is a noop. You can remove it from your app.');
            $c7eafbbe1ea5834e$var$warnedAboutSSRProvider = true;
        }
        return /*#__PURE__*/ (0, $bl59K$react).createElement((0, $bl59K$react).Fragment, null, props.children);
    }
    return /*#__PURE__*/ (0, $bl59K$react).createElement($c7eafbbe1ea5834e$var$LegacySSRProvider, props);
}
let $c7eafbbe1ea5834e$var$canUseDOM = Boolean(typeof window !== 'undefined' && window.document && window.document.createElement);
let $c7eafbbe1ea5834e$var$componentIds = new WeakMap();
function $c7eafbbe1ea5834e$var$useCounter(isDisabled = false) {
    let ctx = (0, $bl59K$useContext)($c7eafbbe1ea5834e$var$SSRContext);
    let ref = (0, $bl59K$useRef)(null);
    // eslint-disable-next-line rsp-rules/pure-render
    if (ref.current === null && !isDisabled) {
        // In strict mode, React renders components twice, and the ref will be reset to null on the second render.
        // This means our id counter will be incremented twice instead of once. This is a problem because on the
        // server, components are only rendered once and so ids generated on the server won't match the client.
        // In React 18, useId was introduced to solve this, but it is not available in older versions. So to solve this
        // we need to use some React internals to access the underlying Fiber instance, which is stable between renders.
        // This is exposed as ReactCurrentOwner in development, which is all we need since StrictMode only runs in development.
        // To ensure that we only increment the global counter once, we store the starting id for this component in
        // a weak map associated with the Fiber. On the second render, we reset the global counter to this value.
        // Since React runs the second render immediately after the first, this is safe.
        let currentOwner = // @ts-ignore
        (0, $bl59K$react).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentOwner?.current;
        if (currentOwner) {
            let prevComponentValue = $c7eafbbe1ea5834e$var$componentIds.get(currentOwner);
            if (prevComponentValue == null) // On the first render, and first call to useId, store the id and state in our weak map.
            $c7eafbbe1ea5834e$var$componentIds.set(currentOwner, {
                id: ctx.current,
                state: currentOwner.memoizedState
            });
            else if (currentOwner.memoizedState !== prevComponentValue.state) {
                // On the second render, the memoizedState gets reset by React.
                // Reset the counter, and remove from the weak map so we don't
                // do this for subsequent useId calls.
                ctx.current = prevComponentValue.id;
                $c7eafbbe1ea5834e$var$componentIds.delete(currentOwner);
            }
        }
        // eslint-disable-next-line rsp-rules/pure-render
        ref.current = ++ctx.current;
    }
    // eslint-disable-next-line rsp-rules/pure-render
    return ref.current;
}
function $c7eafbbe1ea5834e$var$useLegacySSRSafeId(defaultId) {
    let ctx = (0, $bl59K$useContext)($c7eafbbe1ea5834e$var$SSRContext);
    // If we are rendering in a non-DOM environment, and there's no SSRProvider,
    // provide a warning to hint to the developer to add one.
    if (ctx === $c7eafbbe1ea5834e$var$defaultContext && !$c7eafbbe1ea5834e$var$canUseDOM && process.env.NODE_ENV !== 'production') console.warn('When server rendering, you must wrap your application in an <SSRProvider> to ensure consistent ids are generated between the client and server.');
    let counter = $c7eafbbe1ea5834e$var$useCounter(!!defaultId);
    let prefix = ctx === $c7eafbbe1ea5834e$var$defaultContext && process.env.NODE_ENV === 'test' ? 'react-aria' : `react-aria${ctx.prefix}`;
    return defaultId || `${prefix}-${counter}`;
}
function $c7eafbbe1ea5834e$var$useModernSSRSafeId(defaultId) {
    let id = (0, $bl59K$react).useId();
    let [didSSR] = (0, $bl59K$useState)($c7eafbbe1ea5834e$export$535bd6ca7f90a273());
    let prefix = didSSR || process.env.NODE_ENV === 'test' ? 'react-aria' : `react-aria${$c7eafbbe1ea5834e$var$defaultContext.prefix}`;
    return defaultId || `${prefix}-${id}`;
}
const $c7eafbbe1ea5834e$export$619500959fc48b26 = typeof (0, $bl59K$react)['useId'] === 'function' ? $c7eafbbe1ea5834e$var$useModernSSRSafeId : $c7eafbbe1ea5834e$var$useLegacySSRSafeId;
function $c7eafbbe1ea5834e$var$getSnapshot() {
    return false;
}
function $c7eafbbe1ea5834e$var$getServerSnapshot() {
    return true;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function $c7eafbbe1ea5834e$var$subscribe(onStoreChange) {
    // noop
    return ()=>{};
}
function $c7eafbbe1ea5834e$export$535bd6ca7f90a273() {
    // In React 18, we can use useSyncExternalStore to detect if we're server rendering or hydrating.
    if (typeof (0, $bl59K$react)['useSyncExternalStore'] === 'function') return (0, $bl59K$react)['useSyncExternalStore']($c7eafbbe1ea5834e$var$subscribe, $c7eafbbe1ea5834e$var$getSnapshot, $c7eafbbe1ea5834e$var$getServerSnapshot);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return (0, $bl59K$useContext)($c7eafbbe1ea5834e$var$IsSSRContext);
}


export {$c7eafbbe1ea5834e$export$9f8ac96af4b1b2ae as SSRProvider, $c7eafbbe1ea5834e$export$535bd6ca7f90a273 as useIsSSR, $c7eafbbe1ea5834e$export$619500959fc48b26 as useSSRSafeId};
//# sourceMappingURL=SSRProvider.mjs.map
