import {parseColor as $9be7d47340a9a2a9$export$6e865ea70d7724f} from "./Color.js";
import {useColor as $3c80253044a6b286$export$5aadd9c0606af5c2} from "./useColor.js";
import {useControlledState as $2a35a170cf8e413e$export$40bfa8c7b0832715} from "../utils/useControlledState.js";




function $875b5a7eabc5c5bf$export$dc6b73b623f8645f(props) {
    let value = (0, $3c80253044a6b286$export$5aadd9c0606af5c2)(props.value);
    let defaultValue = (0, $3c80253044a6b286$export$5aadd9c0606af5c2)(props.defaultValue || '#000000');
    let [color, setColor] = (0, $2a35a170cf8e413e$export$40bfa8c7b0832715)(value || undefined, defaultValue, props.onChange);
    return {
        color: color,
        setColor (color) {
            if (color != null) setColor(color || (0, $9be7d47340a9a2a9$export$6e865ea70d7724f)('#000000'));
        }
    };
}


export {$875b5a7eabc5c5bf$export$dc6b73b623f8645f as useColorPickerState};
//# sourceMappingURL=useColorPickerState.js.map
