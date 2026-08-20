import {focusWithoutScrolling as $1969ac565cfec8d0$export$de79e2c695e052f3} from "./focusWithoutScrolling.mjs";
import {isFirefox as $2add3ce32c6007eb$export$b7d78993b74f766d, isIPad as $2add3ce32c6007eb$export$7bef049ce92e4224, isMac as $2add3ce32c6007eb$export$9ac100e40613ea10, isWebKit as $2add3ce32c6007eb$export$78551043582a6a98} from "./platform.mjs";
import $epzQQ$react, {createContext as $epzQQ$createContext, useMemo as $epzQQ$useMemo, useContext as $epzQQ$useContext} from "react";

/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 


const $caaf0dd3060ed57c$var$RouterContext = /*#__PURE__*/ (0, $epzQQ$createContext)({
    isNative: true,
    open: $caaf0dd3060ed57c$var$openSyntheticLink,
    useHref: (href)=>href
});
function $caaf0dd3060ed57c$export$323e4fc2fa4753fb(props) {
    let { children: children, navigate: navigate, useHref: useHref } = props;
    let ctx = (0, $epzQQ$useMemo)(()=>({
            isNative: false,
            open: (target, modifiers, href, routerOptions)=>{
                $caaf0dd3060ed57c$var$getSyntheticLink(target, (link)=>{
                    if ($caaf0dd3060ed57c$export$efa8c9099e530235(link, modifiers)) navigate(href, routerOptions);
                    else $caaf0dd3060ed57c$export$95185d699e05d4d7(link, modifiers);
                });
            },
            useHref: useHref || ((href)=>href)
        }), [
        navigate,
        useHref
    ]);
    return /*#__PURE__*/ (0, $epzQQ$react).createElement($caaf0dd3060ed57c$var$RouterContext.Provider, {
        value: ctx
    }, children);
}
function $caaf0dd3060ed57c$export$9a302a45f65d0572() {
    return (0, $epzQQ$useContext)($caaf0dd3060ed57c$var$RouterContext);
}
function $caaf0dd3060ed57c$export$efa8c9099e530235(link, modifiers) {
    // Use getAttribute here instead of link.target. Firefox will default link.target to "_parent" when inside an iframe.
    let target = link.getAttribute('target');
    return (!target || target === '_self') && link.origin === location.origin && !link.hasAttribute('download') && !modifiers.metaKey && // open in new tab (mac)
    !modifiers.ctrlKey && // open in new tab (windows)
    !modifiers.altKey && // download
    !modifiers.shiftKey;
}
function $caaf0dd3060ed57c$export$95185d699e05d4d7(target, modifiers, setOpening = true) {
    let { metaKey: metaKey, ctrlKey: ctrlKey, altKey: altKey, shiftKey: shiftKey } = modifiers;
    // Firefox does not recognize keyboard events as a user action by default, and the popup blocker
    // will prevent links with target="_blank" from opening. However, it does allow the event if the
    // Command/Control key is held, which opens the link in a background tab. This seems like the best we can do.
    // See https://bugzilla.mozilla.org/show_bug.cgi?id=257870 and https://bugzilla.mozilla.org/show_bug.cgi?id=746640.
    if ((0, $2add3ce32c6007eb$export$b7d78993b74f766d)() && window.event?.type?.startsWith('key') && target.target === '_blank') {
        if ((0, $2add3ce32c6007eb$export$9ac100e40613ea10)()) metaKey = true;
        else ctrlKey = true;
    }
    // WebKit does not support firing click events with modifier keys, but does support keyboard events.
    // https://github.com/WebKit/WebKit/blob/c03d0ac6e6db178f90923a0a63080b5ca210d25f/Source/WebCore/html/HTMLAnchorElement.cpp#L184
    let event = (0, $2add3ce32c6007eb$export$78551043582a6a98)() && (0, $2add3ce32c6007eb$export$9ac100e40613ea10)() && !(0, $2add3ce32c6007eb$export$7bef049ce92e4224)() && process.env.NODE_ENV !== 'test' ? new KeyboardEvent('keydown', {
        keyIdentifier: 'Enter',
        metaKey: metaKey,
        ctrlKey: ctrlKey,
        altKey: altKey,
        shiftKey: shiftKey
    }) : new MouseEvent('click', {
        metaKey: metaKey,
        ctrlKey: ctrlKey,
        altKey: altKey,
        shiftKey: shiftKey,
        detail: 1,
        bubbles: true,
        cancelable: true
    });
    $caaf0dd3060ed57c$export$95185d699e05d4d7.isOpening = setOpening;
    (0, $1969ac565cfec8d0$export$de79e2c695e052f3)(target);
    target.dispatchEvent(event);
    $caaf0dd3060ed57c$export$95185d699e05d4d7.isOpening = false;
}
// https://github.com/parcel-bundler/parcel/issues/8724
$caaf0dd3060ed57c$export$95185d699e05d4d7.isOpening = false;
function $caaf0dd3060ed57c$var$getSyntheticLink(target, open) {
    if (target instanceof HTMLAnchorElement) open(target);
    else if (target.hasAttribute('data-href')) {
        let link = document.createElement('a');
        link.href = target.getAttribute('data-href');
        if (target.hasAttribute('data-target')) link.target = target.getAttribute('data-target');
        if (target.hasAttribute('data-rel')) link.rel = target.getAttribute('data-rel');
        if (target.hasAttribute('data-download')) link.download = target.getAttribute('data-download');
        if (target.hasAttribute('data-ping')) link.ping = target.getAttribute('data-ping');
        if (target.hasAttribute('data-referrer-policy')) link.referrerPolicy = target.getAttribute('data-referrer-policy');
        target.appendChild(link);
        open(link);
        target.removeChild(link);
    }
}
function $caaf0dd3060ed57c$var$openSyntheticLink(target, modifiers) {
    $caaf0dd3060ed57c$var$getSyntheticLink(target, (link)=>$caaf0dd3060ed57c$export$95185d699e05d4d7(link, modifiers));
}
function $caaf0dd3060ed57c$export$bdc77b0c0a3a85d6(props) {
    let router = $caaf0dd3060ed57c$export$9a302a45f65d0572();
    const href = router.useHref(props.href ?? '');
    return {
        'data-href': props.href ? href : undefined,
        'data-target': props.target,
        'data-rel': props.rel,
        'data-download': props.download,
        'data-ping': props.ping,
        'data-referrer-policy': props.referrerPolicy
    };
}
function $caaf0dd3060ed57c$export$51437d503373d223(props) {
    return {
        'data-href': props.href,
        'data-target': props.target,
        'data-rel': props.rel,
        'data-download': props.download,
        'data-ping': props.ping,
        'data-referrer-policy': props.referrerPolicy
    };
}
function $caaf0dd3060ed57c$export$7e924b3091a3bd18(props) {
    let router = $caaf0dd3060ed57c$export$9a302a45f65d0572();
    const href = router.useHref(props?.href ?? '');
    let linkProps = {};
    if (props) {
        for (let key of [
            'href',
            'target',
            'rel',
            'download',
            'ping',
            'referrerPolicy'
        ])if (key in props) linkProps[key] = key === 'href' ? href : props[key];
    }
    return linkProps;
}
function $caaf0dd3060ed57c$export$13aea1a3cb5e3f1f(e, router, href, routerOptions) {
    // If a custom router is provided, prevent default and forward if this link should client navigate.
    if (!router.isNative && e.currentTarget instanceof HTMLAnchorElement && e.currentTarget.href && // If props are applied to a router Link component, it may have already prevented default.
    !e.isDefaultPrevented() && $caaf0dd3060ed57c$export$efa8c9099e530235(e.currentTarget, e) && href) {
        e.preventDefault();
        router.open(e.currentTarget, e, href, routerOptions);
    }
}


export {$caaf0dd3060ed57c$export$323e4fc2fa4753fb as RouterProvider, $caaf0dd3060ed57c$export$efa8c9099e530235 as shouldClientNavigate, $caaf0dd3060ed57c$export$95185d699e05d4d7 as openLink, $caaf0dd3060ed57c$export$9a302a45f65d0572 as useRouter, $caaf0dd3060ed57c$export$bdc77b0c0a3a85d6 as useSyntheticLinkProps, $caaf0dd3060ed57c$export$51437d503373d223 as getSyntheticLinkProps, $caaf0dd3060ed57c$export$7e924b3091a3bd18 as useLinkProps, $caaf0dd3060ed57c$export$13aea1a3cb5e3f1f as handleLinkClick};
//# sourceMappingURL=openLink.mjs.map
