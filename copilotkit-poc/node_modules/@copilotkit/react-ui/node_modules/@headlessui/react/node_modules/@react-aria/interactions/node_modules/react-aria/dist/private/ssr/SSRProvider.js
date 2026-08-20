import $gqSoq$react, {useContext as $gqSoq$useContext, useState as $gqSoq$useState, useMemo as $gqSoq$useMemo, useLayoutEffect as $gqSoq$useLayoutEffect, useRef as $gqSoq$useRef} from "react";

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
const $85138adc03e1f057$var$defaultContext = {
    prefix: String(Math.round(Math.random() * 10000000000)),
    current: 0
};
const $85138adc03e1f057$var$SSRContext = /*#__PURE__*/ (0, $gqSoq$react).createContext($85138adc03e1f057$var$defaultContext);
const $85138adc03e1f057$var$IsSSRContext = /*#__PURE__*/ (0, $gqSoq$react).createContext(false);
// This is only used in React < 18.
function $85138adc03e1f057$var$LegacySSRProvider(props) {
    let cur = (0, $gqSoq$useContext)($85138adc03e1f057$var$SSRContext);
    let counter = $85138adc03e1f057$var$useCounter(cur === $85138adc03e1f057$var$defaultContext);
    let [isSSR, setIsSSR] = (0, $gqSoq$useState)(true);
    let value = (0, $gqSoq$useMemo)(()=>({
            // If this is the first SSRProvider, start with an empty string prefix, otherwise
            // append and increment the counter.
            prefix: cur === $85138adc03e1f057$var$defaultContext ? '' : `${cur.prefix}-${counter}`,
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
    (0, $gqSoq$useLayoutEffect)(()=>{
        setIsSSR(false);
    }, []);
    return /*#__PURE__*/ (0, $gqSoq$react).createElement($85138adc03e1f057$var$SSRContext.Provider, {
        value: value
    }, /*#__PURE__*/ (0, $gqSoq$react).createElement($85138adc03e1f057$var$IsSSRContext.Provider, {
        value: isSSR
    }, props.children));
}
let $85138adc03e1f057$var$warnedAboutSSRProvider = false;
function $85138adc03e1f057$export$9f8ac96af4b1b2ae(props) {
    if (typeof (0, $gqSoq$react)['useId'] === 'function') {
        if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'production' && !$85138adc03e1f057$var$warnedAboutSSRProvider) {
            console.warn('In React 18, SSRProvider is not necessary and is a noop. You can remove it from your app.');
            $85138adc03e1f057$var$warnedAboutSSRProvider = true;
        }
        return /*#__PURE__*/ (0, $gqSoq$react).createElement((0, $gqSoq$react).Fragment, null, props.children);
    }
    return /*#__PURE__*/ (0, $gqSoq$react).createElement($85138adc03e1f057$var$LegacySSRProvider, props);
}
let $85138adc03e1f057$var$canUseDOM = Boolean(typeof window !== 'undefined' && window.document && window.document.createElement);
let $85138adc03e1f057$var$componentIds = new WeakMap();
function $85138adc03e1f057$var$useCounter(isDisabled = false) {
    let ctx = (0, $gqSoq$useContext)($85138adc03e1f057$var$SSRContext);
    let ref = (0, $gqSoq$useRef)(null);
    // eslint-disable-next-line rsp-rules/pure-render
    if (ref.current === null && !isDisabled) {
        var // @ts-ignore
        _React___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_ReactCurrentOwner, _React___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        // In strict mode, React renders components twice, and the ref will be reset to null on the second render.
        // This means our id counter will be incremented twice instead of once. This is a problem because on the
        // server, components are only rendered once and so ids generated on the server won't match the client.
        // In React 18, useId was introduced to solve this, but it is not available in older versions. So to solve this
        // we need to use some React internals to access the underlying Fiber instance, which is stable between renders.
        // This is exposed as ReactCurrentOwner in development, which is all we need since StrictMode only runs in development.
        // To ensure that we only increment the global counter once, we store the starting id for this component in
        // a weak map associated with the Fiber. On the second render, we reset the global counter to this value.
        // Since React runs the second render immediately after the first, this is safe.
        let currentOwner = (_React___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = (0, $gqSoq$react).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) === null || _React___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED === void 0 ? void 0 : (_React___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_ReactCurrentOwner = _React___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner) === null || _React___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_ReactCurrentOwner === void 0 ? void 0 : _React___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_ReactCurrentOwner.current;
        if (currentOwner) {
            let prevComponentValue = $85138adc03e1f057$var$componentIds.get(currentOwner);
            if (prevComponentValue == null) // On the first render, and first call to useId, store the id and state in our weak map.
            $85138adc03e1f057$var$componentIds.set(currentOwner, {
                id: ctx.current,
                state: currentOwner.memoizedState
            });
            else if (currentOwner.memoizedState !== prevComponentValue.state) {
                // On the second render, the memoizedState gets reset by React.
                // Reset the counter, and remove from the weak map so we don't
                // do this for subsequent useId calls.
                ctx.current = prevComponentValue.id;
                $85138adc03e1f057$var$componentIds.delete(currentOwner);
            }
        }
        // eslint-disable-next-line rsp-rules/pure-render
        ref.current = ++ctx.current;
    }
    // eslint-disable-next-line rsp-rules/pure-render
    return ref.current;
}
function $85138adc03e1f057$var$useLegacySSRSafeId(defaultId) {
    let ctx = (0, $gqSoq$useContext)($85138adc03e1f057$var$SSRContext);
    // If we are rendering in a non-DOM environment, and there's no SSRProvider,
    // provide a warning to hint to the developer to add one.
    if (ctx === $85138adc03e1f057$var$defaultContext && !$85138adc03e1f057$var$canUseDOM && process.env.NODE_ENV !== 'production') console.warn('When server rendering, you must wrap your application in an <SSRProvider> to ensure consistent ids are generated between the client and server.');
    let counter = $85138adc03e1f057$var$useCounter(!!defaultId);
    let prefix = ctx === $85138adc03e1f057$var$defaultContext && process.env.NODE_ENV === 'test' ? 'react-aria' : `react-aria${ctx.prefix}`;
    return defaultId || `${prefix}-${counter}`;
}
function $85138adc03e1f057$var$useModernSSRSafeId(defaultId) {
    let id = (0, $gqSoq$react).useId();
    let [didSSR] = (0, $gqSoq$useState)($85138adc03e1f057$export$535bd6ca7f90a273());
    let prefix = didSSR || process.env.NODE_ENV === 'test' ? 'react-aria' : `react-aria${$85138adc03e1f057$var$defaultContext.prefix}`;
    return defaultId || `${prefix}-${id}`;
}
const $85138adc03e1f057$export$619500959fc48b26 = typeof (0, $gqSoq$react)['useId'] === 'function' ? $85138adc03e1f057$var$useModernSSRSafeId : $85138adc03e1f057$var$useLegacySSRSafeId;
function $85138adc03e1f057$var$getSnapshot() {
    return false;
}
function $85138adc03e1f057$var$getServerSnapshot() {
    return true;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function $85138adc03e1f057$var$subscribe(onStoreChange) {
    // noop
    return ()=>{};
}
function $85138adc03e1f057$export$535bd6ca7f90a273() {
    // In React 18, we can use useSyncExternalStore to detect if we're server rendering or hydrating.
    if (typeof (0, $gqSoq$react)['useSyncExternalStore'] === 'function') return (0, $gqSoq$react)['useSyncExternalStore']($85138adc03e1f057$var$subscribe, $85138adc03e1f057$var$getSnapshot, $85138adc03e1f057$var$getServerSnapshot);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return (0, $gqSoq$useContext)($85138adc03e1f057$var$IsSSRContext);
}


export {$85138adc03e1f057$export$9f8ac96af4b1b2ae as SSRProvider, $85138adc03e1f057$export$535bd6ca7f90a273 as useIsSSR, $85138adc03e1f057$export$619500959fc48b26 as useSSRSafeId};
//# sourceMappingURL=SSRProvider.js.map
