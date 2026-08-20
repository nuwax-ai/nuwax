import {useOverlayTriggerState as $f11fb0bcf1b2687a$export$61c6a8c84e605fb6} from "../overlays/useOverlayTriggerState.mjs";
import {useMemo as $auOuY$useMemo, useRef as $auOuY$useRef, useEffect as $auOuY$useEffect} from "react";

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

const $3834487504f4fc00$var$TOOLTIP_DELAY = 1500; // this seems to be a 1.5 second delay, check with design
const $3834487504f4fc00$var$TOOLTIP_COOLDOWN = 500;
let $3834487504f4fc00$var$tooltips = {};
let $3834487504f4fc00$var$tooltipId = 0;
let $3834487504f4fc00$var$globalWarmedUp = false;
let $3834487504f4fc00$var$globalWarmUpTimeout = null;
let $3834487504f4fc00$var$globalCooldownTimeout = null;
function $3834487504f4fc00$export$4d40659c25ecb50b(props = {}) {
    let { delay: delay = $3834487504f4fc00$var$TOOLTIP_DELAY, closeDelay: closeDelay = $3834487504f4fc00$var$TOOLTIP_COOLDOWN } = props;
    let { isOpen: isOpen, open: open, close: close } = (0, $f11fb0bcf1b2687a$export$61c6a8c84e605fb6)(props);
    let id = (0, $auOuY$useMemo)(()=>`${++$3834487504f4fc00$var$tooltipId}`, []);
    let closeTimeout = (0, $auOuY$useRef)(null);
    let closeCallback = (0, $auOuY$useRef)(close);
    let ensureTooltipEntry = ()=>{
        $3834487504f4fc00$var$tooltips[id] = hideTooltip;
    };
    let closeOpenTooltips = ()=>{
        for(let hideTooltipId in $3834487504f4fc00$var$tooltips)if (hideTooltipId !== id) {
            $3834487504f4fc00$var$tooltips[hideTooltipId](true);
            delete $3834487504f4fc00$var$tooltips[hideTooltipId];
        }
    };
    let showTooltip = ()=>{
        if (closeTimeout.current) clearTimeout(closeTimeout.current);
        closeTimeout.current = null;
        closeOpenTooltips();
        ensureTooltipEntry();
        $3834487504f4fc00$var$globalWarmedUp = true;
        open();
        if ($3834487504f4fc00$var$globalWarmUpTimeout) {
            clearTimeout($3834487504f4fc00$var$globalWarmUpTimeout);
            $3834487504f4fc00$var$globalWarmUpTimeout = null;
        }
        if ($3834487504f4fc00$var$globalCooldownTimeout) {
            clearTimeout($3834487504f4fc00$var$globalCooldownTimeout);
            $3834487504f4fc00$var$globalCooldownTimeout = null;
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
        if ($3834487504f4fc00$var$globalWarmUpTimeout) {
            clearTimeout($3834487504f4fc00$var$globalWarmUpTimeout);
            $3834487504f4fc00$var$globalWarmUpTimeout = null;
        }
        if ($3834487504f4fc00$var$globalWarmedUp) {
            if ($3834487504f4fc00$var$globalCooldownTimeout) clearTimeout($3834487504f4fc00$var$globalCooldownTimeout);
            $3834487504f4fc00$var$globalCooldownTimeout = setTimeout(()=>{
                delete $3834487504f4fc00$var$tooltips[id];
                $3834487504f4fc00$var$globalCooldownTimeout = null;
                $3834487504f4fc00$var$globalWarmedUp = false;
            }, Math.max($3834487504f4fc00$var$TOOLTIP_COOLDOWN, closeDelay));
        }
    };
    let warmupTooltip = ()=>{
        closeOpenTooltips();
        ensureTooltipEntry();
        if (!isOpen && !$3834487504f4fc00$var$globalWarmedUp) {
            if ($3834487504f4fc00$var$globalWarmUpTimeout) clearTimeout($3834487504f4fc00$var$globalWarmUpTimeout);
            $3834487504f4fc00$var$globalWarmUpTimeout = setTimeout(()=>{
                $3834487504f4fc00$var$globalWarmUpTimeout = null;
                $3834487504f4fc00$var$globalWarmedUp = true;
                showTooltip();
            }, delay);
        } else if (!isOpen) showTooltip();
    };
    (0, $auOuY$useEffect)(()=>{
        closeCallback.current = close;
    }, [
        close
    ]);
    (0, $auOuY$useEffect)(()=>{
        return ()=>{
            if (closeTimeout.current) clearTimeout(closeTimeout.current);
            let tooltip = $3834487504f4fc00$var$tooltips[id];
            if (tooltip) delete $3834487504f4fc00$var$tooltips[id];
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


export {$3834487504f4fc00$export$4d40659c25ecb50b as useTooltipTriggerState};
//# sourceMappingURL=useTooltipTriggerState.mjs.map
