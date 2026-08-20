import {isFocusVisible as $b50b1cc8a843ace7$export$b9b3dfddab17db27, useFocusVisibleListener as $b50b1cc8a843ace7$export$ec71b4b83ac08ec3} from "../interactions/useFocusVisible.js";
import {useFocus as $a19d0c473b0e0cad$export$f8168d8dd8fd66e6} from "../interactions/useFocus.js";
import {useFocusWithin as $b842b95ed9b5d4d5$export$420e68273165f4ec} from "../interactions/useFocusWithin.js";
import {useRef as $dAdnq$useRef, useState as $dAdnq$useState, useCallback as $dAdnq$useCallback} from "react";





function $afe82053a7a5aa1e$export$4e328f61c538687f(props = {}) {
    let { autoFocus: autoFocus = false, isTextInput: isTextInput, within: within } = props;
    let state = (0, $dAdnq$useRef)({
        isFocused: false,
        isFocusVisible: autoFocus || (0, $b50b1cc8a843ace7$export$b9b3dfddab17db27)()
    });
    let [isFocused, setFocused] = (0, $dAdnq$useState)(false);
    let [isFocusVisibleState, setFocusVisible] = (0, $dAdnq$useState)(()=>state.current.isFocused && state.current.isFocusVisible);
    let updateState = (0, $dAdnq$useCallback)(()=>setFocusVisible(state.current.isFocused && state.current.isFocusVisible), []);
    let onFocusChange = (0, $dAdnq$useCallback)((isFocused)=>{
        state.current.isFocused = isFocused;
        state.current.isFocusVisible = (0, $b50b1cc8a843ace7$export$b9b3dfddab17db27)();
        setFocused(isFocused);
        updateState();
    }, [
        updateState
    ]);
    (0, $b50b1cc8a843ace7$export$ec71b4b83ac08ec3)((isFocusVisible)=>{
        state.current.isFocusVisible = isFocusVisible;
        updateState();
    }, [
        isTextInput,
        isFocused
    ], {
        enabled: isFocused,
        isTextInput: isTextInput
    });
    let { focusProps: focusProps } = (0, $a19d0c473b0e0cad$export$f8168d8dd8fd66e6)({
        isDisabled: within,
        onFocusChange: onFocusChange
    });
    let { focusWithinProps: focusWithinProps } = (0, $b842b95ed9b5d4d5$export$420e68273165f4ec)({
        isDisabled: !within,
        onFocusWithinChange: onFocusChange
    });
    return {
        isFocused: isFocused,
        isFocusVisible: isFocusVisibleState,
        focusProps: within ? focusWithinProps : focusProps
    };
}


export {$afe82053a7a5aa1e$export$4e328f61c538687f as useFocusRing};
//# sourceMappingURL=useFocusRing.js.map
