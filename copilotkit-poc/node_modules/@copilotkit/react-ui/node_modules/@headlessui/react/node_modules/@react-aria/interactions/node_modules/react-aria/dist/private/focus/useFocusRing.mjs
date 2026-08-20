import {isFocusVisible as $8f5a2122b0992be3$export$b9b3dfddab17db27, useFocusVisibleListener as $8f5a2122b0992be3$export$ec71b4b83ac08ec3} from "../interactions/useFocusVisible.mjs";
import {useFocus as $1e74c67db218ce67$export$f8168d8dd8fd66e6} from "../interactions/useFocus.mjs";
import {useFocusWithin as $2c9edc598a03d523$export$420e68273165f4ec} from "../interactions/useFocusWithin.mjs";
import {useRef as $3s2y0$useRef, useState as $3s2y0$useState, useCallback as $3s2y0$useCallback} from "react";





function $0c4a58759813079a$export$4e328f61c538687f(props = {}) {
    let { autoFocus: autoFocus = false, isTextInput: isTextInput, within: within } = props;
    let state = (0, $3s2y0$useRef)({
        isFocused: false,
        isFocusVisible: autoFocus || (0, $8f5a2122b0992be3$export$b9b3dfddab17db27)()
    });
    let [isFocused, setFocused] = (0, $3s2y0$useState)(false);
    let [isFocusVisibleState, setFocusVisible] = (0, $3s2y0$useState)(()=>state.current.isFocused && state.current.isFocusVisible);
    let updateState = (0, $3s2y0$useCallback)(()=>setFocusVisible(state.current.isFocused && state.current.isFocusVisible), []);
    let onFocusChange = (0, $3s2y0$useCallback)((isFocused)=>{
        state.current.isFocused = isFocused;
        state.current.isFocusVisible = (0, $8f5a2122b0992be3$export$b9b3dfddab17db27)();
        setFocused(isFocused);
        updateState();
    }, [
        updateState
    ]);
    (0, $8f5a2122b0992be3$export$ec71b4b83ac08ec3)((isFocusVisible)=>{
        state.current.isFocusVisible = isFocusVisible;
        updateState();
    }, [
        isTextInput,
        isFocused
    ], {
        enabled: isFocused,
        isTextInput: isTextInput
    });
    let { focusProps: focusProps } = (0, $1e74c67db218ce67$export$f8168d8dd8fd66e6)({
        isDisabled: within,
        onFocusChange: onFocusChange
    });
    let { focusWithinProps: focusWithinProps } = (0, $2c9edc598a03d523$export$420e68273165f4ec)({
        isDisabled: !within,
        onFocusWithinChange: onFocusChange
    });
    return {
        isFocused: isFocused,
        isFocusVisible: isFocusVisibleState,
        focusProps: within ? focusWithinProps : focusProps
    };
}


export {$0c4a58759813079a$export$4e328f61c538687f as useFocusRing};
//# sourceMappingURL=useFocusRing.mjs.map
