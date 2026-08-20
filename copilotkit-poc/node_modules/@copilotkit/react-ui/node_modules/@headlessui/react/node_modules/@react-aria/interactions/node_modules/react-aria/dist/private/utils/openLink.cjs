var $4b9e9ed3f006ad27$exports = require("./focusWithoutScrolling.cjs");
var $d0b4a781cf26e80b$exports = require("./platform.cjs");
var $6sd8B$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "RouterProvider", function () { return $75bd88aab025820b$export$323e4fc2fa4753fb; });
$parcel$export(module.exports, "shouldClientNavigate", function () { return $75bd88aab025820b$export$efa8c9099e530235; });
$parcel$export(module.exports, "openLink", function () { return $75bd88aab025820b$export$95185d699e05d4d7; });
$parcel$export(module.exports, "useRouter", function () { return $75bd88aab025820b$export$9a302a45f65d0572; });
$parcel$export(module.exports, "useSyntheticLinkProps", function () { return $75bd88aab025820b$export$bdc77b0c0a3a85d6; });
$parcel$export(module.exports, "getSyntheticLinkProps", function () { return $75bd88aab025820b$export$51437d503373d223; });
$parcel$export(module.exports, "useLinkProps", function () { return $75bd88aab025820b$export$7e924b3091a3bd18; });
$parcel$export(module.exports, "handleLinkClick", function () { return $75bd88aab025820b$export$13aea1a3cb5e3f1f; });
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


const $75bd88aab025820b$var$RouterContext = /*#__PURE__*/ (0, $6sd8B$react.createContext)({
    isNative: true,
    open: $75bd88aab025820b$var$openSyntheticLink,
    useHref: (href)=>href
});
function $75bd88aab025820b$export$323e4fc2fa4753fb(props) {
    let { children: children, navigate: navigate, useHref: useHref } = props;
    let ctx = (0, $6sd8B$react.useMemo)(()=>({
            isNative: false,
            open: (target, modifiers, href, routerOptions)=>{
                $75bd88aab025820b$var$getSyntheticLink(target, (link)=>{
                    if ($75bd88aab025820b$export$efa8c9099e530235(link, modifiers)) navigate(href, routerOptions);
                    else $75bd88aab025820b$export$95185d699e05d4d7(link, modifiers);
                });
            },
            useHref: useHref || ((href)=>href)
        }), [
        navigate,
        useHref
    ]);
    return /*#__PURE__*/ (0, ($parcel$interopDefault($6sd8B$react))).createElement($75bd88aab025820b$var$RouterContext.Provider, {
        value: ctx
    }, children);
}
function $75bd88aab025820b$export$9a302a45f65d0572() {
    return (0, $6sd8B$react.useContext)($75bd88aab025820b$var$RouterContext);
}
function $75bd88aab025820b$export$efa8c9099e530235(link, modifiers) {
    // Use getAttribute here instead of link.target. Firefox will default link.target to "_parent" when inside an iframe.
    let target = link.getAttribute('target');
    return (!target || target === '_self') && link.origin === location.origin && !link.hasAttribute('download') && !modifiers.metaKey && // open in new tab (mac)
    !modifiers.ctrlKey && // open in new tab (windows)
    !modifiers.altKey && // download
    !modifiers.shiftKey;
}
function $75bd88aab025820b$export$95185d699e05d4d7(target, modifiers, setOpening = true) {
    let { metaKey: metaKey, ctrlKey: ctrlKey, altKey: altKey, shiftKey: shiftKey } = modifiers;
    // Firefox does not recognize keyboard events as a user action by default, and the popup blocker
    // will prevent links with target="_blank" from opening. However, it does allow the event if the
    // Command/Control key is held, which opens the link in a background tab. This seems like the best we can do.
    // See https://bugzilla.mozilla.org/show_bug.cgi?id=257870 and https://bugzilla.mozilla.org/show_bug.cgi?id=746640.
    if ((0, $d0b4a781cf26e80b$exports.isFirefox)() && window.event?.type?.startsWith('key') && target.target === '_blank') {
        if ((0, $d0b4a781cf26e80b$exports.isMac)()) metaKey = true;
        else ctrlKey = true;
    }
    // WebKit does not support firing click events with modifier keys, but does support keyboard events.
    // https://github.com/WebKit/WebKit/blob/c03d0ac6e6db178f90923a0a63080b5ca210d25f/Source/WebCore/html/HTMLAnchorElement.cpp#L184
    let event = (0, $d0b4a781cf26e80b$exports.isWebKit)() && (0, $d0b4a781cf26e80b$exports.isMac)() && !(0, $d0b4a781cf26e80b$exports.isIPad)() && process.env.NODE_ENV !== 'test' ? new KeyboardEvent('keydown', {
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
    $75bd88aab025820b$export$95185d699e05d4d7.isOpening = setOpening;
    (0, $4b9e9ed3f006ad27$exports.focusWithoutScrolling)(target);
    target.dispatchEvent(event);
    $75bd88aab025820b$export$95185d699e05d4d7.isOpening = false;
}
// https://github.com/parcel-bundler/parcel/issues/8724
$75bd88aab025820b$export$95185d699e05d4d7.isOpening = false;
function $75bd88aab025820b$var$getSyntheticLink(target, open) {
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
function $75bd88aab025820b$var$openSyntheticLink(target, modifiers) {
    $75bd88aab025820b$var$getSyntheticLink(target, (link)=>$75bd88aab025820b$export$95185d699e05d4d7(link, modifiers));
}
function $75bd88aab025820b$export$bdc77b0c0a3a85d6(props) {
    let router = $75bd88aab025820b$export$9a302a45f65d0572();
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
function $75bd88aab025820b$export$51437d503373d223(props) {
    return {
        'data-href': props.href,
        'data-target': props.target,
        'data-rel': props.rel,
        'data-download': props.download,
        'data-ping': props.ping,
        'data-referrer-policy': props.referrerPolicy
    };
}
function $75bd88aab025820b$export$7e924b3091a3bd18(props) {
    let router = $75bd88aab025820b$export$9a302a45f65d0572();
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
function $75bd88aab025820b$export$13aea1a3cb5e3f1f(e, router, href, routerOptions) {
    // If a custom router is provided, prevent default and forward if this link should client navigate.
    if (!router.isNative && e.currentTarget instanceof HTMLAnchorElement && e.currentTarget.href && // If props are applied to a router Link component, it may have already prevented default.
    !e.isDefaultPrevented() && $75bd88aab025820b$export$efa8c9099e530235(e.currentTarget, e) && href) {
        e.preventDefault();
        router.open(e.currentTarget, e, href, routerOptions);
    }
}


//# sourceMappingURL=openLink.cjs.map
