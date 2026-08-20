var $d6e22460ce4d6b26$exports = require("./useEffectEvent.cjs");
var $518I4$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useResizeObserver", function () { return $7548a328ef909839$export$683480f191c0e3ea; });


function $7548a328ef909839$var$hasResizeObserver() {
    return typeof window.ResizeObserver !== 'undefined';
}
function $7548a328ef909839$export$683480f191c0e3ea(options) {
    // Only call onResize from inside the effect, otherwise we'll void our assumption that
    // useEffectEvents are safe to pass in.
    const { ref: ref, box: box, onResize: onResize } = options;
    let onResizeEvent = (0, $d6e22460ce4d6b26$exports.useEffectEvent)(onResize);
    (0, $518I4$react.useEffect)(()=>{
        let element = ref?.current;
        if (!element) return;
        if (!$7548a328ef909839$var$hasResizeObserver()) {
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


//# sourceMappingURL=useResizeObserver.cjs.map
