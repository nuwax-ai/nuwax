import {useOverlayTriggerState as $3b152ed05cfdb7e2$export$61c6a8c84e605fb6} from "../overlays/useOverlayTriggerState.js";
import {useMemo as $9hT9S$useMemo, useRef as $9hT9S$useRef, useEffect as $9hT9S$useEffect} from "react";

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

const $d881726242c7a389$var$TOOLTIP_DELAY = 1500; // this seems to be a 1.5 second delay, check with design
const $d881726242c7a389$var$TOOLTIP_COOLDOWN = 500;
let $d881726242c7a389$var$tooltips = {};
let $d881726242c7a389$var$tooltipId = 0;
let $d881726242c7a389$var$globalWarmedUp = false;
let $d881726242c7a389$var$globalWarmUpTimeout = null;
let $d881726242c7a389$var$globalCooldownTimeout = null;
function $d881726242c7a389$export$4d40659c25ecb50b(props = {}) {
    let { delay: delay = $d881726242c7a389$var$TOOLTIP_DELAY, closeDelay: closeDelay = $d881726242c7a389$var$TOOLTIP_COOLDOWN } = props;
    let { isOpen: isOpen, open: open, close: close } = (0, $3b152ed05cfdb7e2$export$61c6a8c84e605fb6)(props);
    let id = (0, $9hT9S$useMemo)(()=>`${++$d881726242c7a389$var$tooltipId}`, []);
    let closeTimeout = (0, $9hT9S$useRef)(null);
    let closeCallback = (0, $9hT9S$useRef)(close);
    let ensureTooltipEntry = ()=>{
        $d881726242c7a389$var$tooltips[id] = hideTooltip;
    };
    let closeOpenTooltips = ()=>{
        for(let hideTooltipId in $d881726242c7a389$var$tooltips)if (hideTooltipId !== id) {
            $d881726242c7a389$var$tooltips[hideTooltipId](true);
            delete $d881726242c7a389$var$tooltips[hideTooltipId];
        }
    };
    let showTooltip = ()=>{
        if (closeTimeout.current) clearTimeout(closeTimeout.current);
        closeTimeout.current = null;
        closeOpenTooltips();
        ensureTooltipEntry();
        $d881726242c7a389$var$globalWarmedUp = true;
        open();
        if ($d881726242c7a389$var$globalWarmUpTimeout) {
            clearTimeout($d881726242c7a389$var$globalWarmUpTimeout);
            $d881726242c7a389$var$globalWarmUpTimeout = null;
        }
        if ($d881726242c7a389$var$globalCooldownTimeout) {
            clearTimeout($d881726242c7a389$var$globalCooldownTimeout);
            $d881726242c7a389$var$globalCooldownTimeout = null;
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
        if ($d881726242c7a389$var$globalWarmUpTimeout) {
            clearTimeout($d881726242c7a389$var$globalWarmUpTimeout);
            $d881726242c7a389$var$globalWarmUpTimeout = null;
        }
        if ($d881726242c7a389$var$globalWarmedUp) {
            if ($d881726242c7a389$var$globalCooldownTimeout) clearTimeout($d881726242c7a389$var$globalCooldownTimeout);
            $d881726242c7a389$var$globalCooldownTimeout = setTimeout(()=>{
                delete $d881726242c7a389$var$tooltips[id];
                $d881726242c7a389$var$globalCooldownTimeout = null;
                $d881726242c7a389$var$globalWarmedUp = false;
            }, Math.max($d881726242c7a389$var$TOOLTIP_COOLDOWN, closeDelay));
        }
    };
    let warmupTooltip = ()=>{
        closeOpenTooltips();
        ensureTooltipEntry();
        if (!isOpen && !$d881726242c7a389$var$globalWarmedUp) {
            if ($d881726242c7a389$var$globalWarmUpTimeout) clearTimeout($d881726242c7a389$var$globalWarmUpTimeout);
            $d881726242c7a389$var$globalWarmUpTimeout = setTimeout(()=>{
                $d881726242c7a389$var$globalWarmUpTimeout = null;
                $d881726242c7a389$var$globalWarmedUp = true;
                showTooltip();
            }, delay);
        } else if (!isOpen) showTooltip();
    };
    (0, $9hT9S$useEffect)(()=>{
        closeCallback.current = close;
    }, [
        close
    ]);
    (0, $9hT9S$useEffect)(()=>{
        return ()=>{
            if (closeTimeout.current) clearTimeout(closeTimeout.current);
            let tooltip = $d881726242c7a389$var$tooltips[id];
            if (tooltip) delete $d881726242c7a389$var$tooltips[id];
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


export {$d881726242c7a389$export$4d40659c25ecb50b as useTooltipTriggerState};
//# sourceMappingURL=useTooltipTriggerState.js.map
