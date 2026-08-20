import {useEffectEvent as $85567ef950781b7d$export$7f54fc3180508a52} from "./useEffectEvent.js";
import {useEffect as $1PP4E$useEffect} from "react";



function $875907d93ca5631d$var$hasResizeObserver() {
    return typeof window.ResizeObserver !== 'undefined';
}
function $875907d93ca5631d$export$683480f191c0e3ea(options) {
    // Only call onResize from inside the effect, otherwise we'll void our assumption that
    // useEffectEvents are safe to pass in.
    const { ref: ref, box: box, onResize: onResize } = options;
    let onResizeEvent = (0, $85567ef950781b7d$export$7f54fc3180508a52)(onResize);
    (0, $1PP4E$useEffect)(()=>{
        let element = ref === null || ref === void 0 ? void 0 : ref.current;
        if (!element) return;
        if (!$875907d93ca5631d$var$hasResizeObserver()) {
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


export {$875907d93ca5631d$export$683480f191c0e3ea as useResizeObserver};
//# sourceMappingURL=useResizeObserver.js.map
