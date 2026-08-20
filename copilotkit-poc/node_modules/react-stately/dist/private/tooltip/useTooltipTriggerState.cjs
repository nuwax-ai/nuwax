var $a359060d53fd4d72$exports = require("../overlays/useOverlayTriggerState.cjs");
var $4ZRdi$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTooltipTriggerState", function () { return $aa006296c94ee187$export$4d40659c25ecb50b; });
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

const $aa006296c94ee187$var$TOOLTIP_DELAY = 1500; // this seems to be a 1.5 second delay, check with design
const $aa006296c94ee187$var$TOOLTIP_COOLDOWN = 500;
let $aa006296c94ee187$var$tooltips = {};
let $aa006296c94ee187$var$tooltipId = 0;
let $aa006296c94ee187$var$globalWarmedUp = false;
let $aa006296c94ee187$var$globalWarmUpTimeout = null;
let $aa006296c94ee187$var$globalCooldownTimeout = null;
function $aa006296c94ee187$export$4d40659c25ecb50b(props = {}) {
    let { delay: delay = $aa006296c94ee187$var$TOOLTIP_DELAY, closeDelay: closeDelay = $aa006296c94ee187$var$TOOLTIP_COOLDOWN } = props;
    let { isOpen: isOpen, open: open, close: close } = (0, $a359060d53fd4d72$exports.useOverlayTriggerState)(props);
    let id = (0, $4ZRdi$react.useMemo)(()=>`${++$aa006296c94ee187$var$tooltipId}`, []);
    let closeTimeout = (0, $4ZRdi$react.useRef)(null);
    let closeCallback = (0, $4ZRdi$react.useRef)(close);
    let ensureTooltipEntry = ()=>{
        $aa006296c94ee187$var$tooltips[id] = hideTooltip;
    };
    let closeOpenTooltips = ()=>{
        for(let hideTooltipId in $aa006296c94ee187$var$tooltips)if (hideTooltipId !== id) {
            $aa006296c94ee187$var$tooltips[hideTooltipId](true);
            delete $aa006296c94ee187$var$tooltips[hideTooltipId];
        }
    };
    let showTooltip = ()=>{
        if (closeTimeout.current) clearTimeout(closeTimeout.current);
        closeTimeout.current = null;
        closeOpenTooltips();
        ensureTooltipEntry();
        $aa006296c94ee187$var$globalWarmedUp = true;
        open();
        if ($aa006296c94ee187$var$globalWarmUpTimeout) {
            clearTimeout($aa006296c94ee187$var$globalWarmUpTimeout);
            $aa006296c94ee187$var$globalWarmUpTimeout = null;
        }
        if ($aa006296c94ee187$var$globalCooldownTimeout) {
            clearTimeout($aa006296c94ee187$var$globalCooldownTimeout);
            $aa006296c94ee187$var$globalCooldownTimeout = null;
        }
    };
    let hideTooltip = (immediate)=>{
        if (immediate || closeDelay <= 0) {
            if (closeTimeout.current) clearTimeout(closeTimeout.current);
            closeTimeout.current = null;
            closeCallback.current();
        } else if (!closeTimeout.current) closeTimeout.current = setTimeout(()=>{
            closeTimeout.current = null;
            closeCallback.current();
        }, closeDelay);
        if ($aa006296c94ee187$var$globalWarmUpTimeout) {
            clearTimeout($aa006296c94ee187$var$globalWarmUpTimeout);
            $aa006296c94ee187$var$globalWarmUpTimeout = null;
        }
        if ($aa006296c94ee187$var$globalWarmedUp) {
            if ($aa006296c94ee187$var$globalCooldownTimeout) clearTimeout($aa006296c94ee187$var$globalCooldownTimeout);
            $aa006296c94ee187$var$globalCooldownTimeout = setTimeout(()=>{
                delete $aa006296c94ee187$var$tooltips[id];
                $aa006296c94ee187$var$globalCooldownTimeout = null;
                $aa006296c94ee187$var$globalWarmedUp = false;
            }, Math.max($aa006296c94ee187$var$TOOLTIP_COOLDOWN, closeDelay));
        }
    };
    let warmupTooltip = ()=>{
        closeOpenTooltips();
        ensureTooltipEntry();
        if (!isOpen && !$aa006296c94ee187$var$globalWarmedUp) {
            if ($aa006296c94ee187$var$globalWarmUpTimeout) clearTimeout($aa006296c94ee187$var$globalWarmUpTimeout);
            $aa006296c94ee187$var$globalWarmUpTimeout = setTimeout(()=>{
                $aa006296c94ee187$var$globalWarmUpTimeout = null;
                $aa006296c94ee187$var$globalWarmedUp = true;
                showTooltip();
            }, delay);
        } else if (!isOpen) showTooltip();
    };
    (0, $4ZRdi$react.useEffect)(()=>{
        closeCallback.current = close;
    }, [
        close
    ]);
    (0, $4ZRdi$react.useEffect)(()=>{
        return ()=>{
            if (closeTimeout.current) clearTimeout(closeTimeout.current);
            let tooltip = $aa006296c94ee187$var$tooltips[id];
            if (tooltip) delete $aa006296c94ee187$var$tooltips[id];
        };
    }, [
        id
    ]);
    return {
        isOpen: isOpen,
        open: (immediate)=>{
            if (!immediate && delay > 0 && !closeTimeout.current) warmupTooltip();
            else showTooltip();
        },
        close: hideTooltip
    };
}


//# sourceMappingURL=useTooltipTriggerState.cjs.map
