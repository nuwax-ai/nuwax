var $d0df89f3abe2c2ca$exports = require("../interactions/useFocusVisible.cjs");
var $5e1a09eb20a4a484$exports = require("../interactions/useFocus.cjs");
var $b4f85e31b7b8044c$exports = require("../interactions/useFocusWithin.cjs");
var $7iro8$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useFocusRing", function () { return $4444d250b7958cf6$export$4e328f61c538687f; });




function $4444d250b7958cf6$export$4e328f61c538687f(props = {}) {
    let { autoFocus: autoFocus = false, isTextInput: isTextInput, within: within } = props;
    let state = (0, $7iro8$react.useRef)({
        isFocused: false,
        isFocusVisible: autoFocus || (0, $d0df89f3abe2c2ca$exports.isFocusVisible)()
    });
    let [isFocused, setFocused] = (0, $7iro8$react.useState)(false);
    let [isFocusVisibleState, setFocusVisible] = (0, $7iro8$react.useState)(()=>state.current.isFocused && state.current.isFocusVisible);
    let updateState = (0, $7iro8$react.useCallback)(()=>setFocusVisible(state.current.isFocused && state.current.isFocusVisible), []);
    let onFocusChange = (0, $7iro8$react.useCallback)((isFocused)=>{
        state.current.isFocused = isFocused;
        state.current.isFocusVisible = (0, $d0df89f3abe2c2ca$exports.isFocusVisible)();
        setFocused(isFocused);
        updateState();
    }, [
        updateState
    ]);
    (0, $d0df89f3abe2c2ca$exports.useFocusVisibleListener)((isFocusVisible)=>{
        state.current.isFocusVisible = isFocusVisible;
        updateState();
    }, [
        isTextInput,
        isFocused
    ], {
        enabled: isFocused,
        isTextInput: isTextInput
    });
    let { focusProps: focusProps } = (0, $5e1a09eb20a4a484$exports.useFocus)({
        isDisabled: within,
        onFocusChange: onFocusChange
    });
    let { focusWithinProps: focusWithinProps } = (0, $b4f85e31b7b8044c$exports.useFocusWithin)({
        isDisabled: !within,
        onFocusWithinChange: onFocusChange
    });
    return {
        isFocused: isFocused,
        isFocusVisible: isFocusVisibleState,
        focusProps: within ? focusWithinProps : focusProps
    };
}


//# sourceMappingURL=useFocusRing.cjs.map
