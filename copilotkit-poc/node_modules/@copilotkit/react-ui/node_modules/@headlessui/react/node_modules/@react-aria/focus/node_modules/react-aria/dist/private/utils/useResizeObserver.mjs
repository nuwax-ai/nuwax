import {useEffectEvent as $fe16bffc7a557bf0$export$7f54fc3180508a52} from "./useEffectEvent.mjs";
import {useEffect as $aLvW6$useEffect} from "react";



function $970072cf4b13fde3$var$hasResizeObserver() {
    return typeof window.ResizeObserver !== 'undefined';
}
function $970072cf4b13fde3$export$683480f191c0e3ea(options) {
    // Only call onResize from inside the effect, otherwise we'll void our assumption that
    // useEffectEvents are safe to pass in.
    const { ref: ref, box: box, onResize: onResize } = options;
    let onResizeEvent = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)(onResize);
    (0, $aLvW6$useEffect)(()=>{
        let element = ref?.current;
        if (!element) return;
        if (!$970072cf4b13fde3$var$hasResizeObserver()) {
            window.addEventListener('resize', onResizeEvent, false);
            return ()=>{
                window.removeEventListener('resize', onResizeEvent, false);
            };
        } else {
            const resizeObserverInstance = new window.ResizeObserver((entries)=>{
                if (!entries.length) return;
                onResizeEvent();
            });
            resizeObserverInstance.observe(element, {
                box: box
            });
            return ()=>{
                if (element) resizeObserverInstance.unobserve(element);
            };
        }
    }, [
        ref,
        box
    ]);
}


export {$970072cf4b13fde3$export$683480f191c0e3ea as useResizeObserver};
//# sourceMappingURL=useResizeObserver.mjs.map
