import {parseColor as $890783418b00a858$export$6e865ea70d7724f} from "./Color.mjs";
import {useColor as $7d5d4eb4667f32af$export$5aadd9c0606af5c2} from "./useColor.mjs";
import {useControlledState as $3e6197669829fe11$export$40bfa8c7b0832715} from "../utils/useControlledState.mjs";




function $f229ad6ed8947519$export$dc6b73b623f8645f(props) {
    let value = (0, $7d5d4eb4667f32af$export$5aadd9c0606af5c2)(props.value);
    let defaultValue = (0, $7d5d4eb4667f32af$export$5aadd9c0606af5c2)(props.defaultValue || '#000000');
    let [color, setColor] = (0, $3e6197669829fe11$export$40bfa8c7b0832715)(value || undefined, defaultValue, props.onChange);
    return {
        color: color,
        setColor (color) {
            if (color != null) setColor(color || (0, $890783418b00a858$export$6e865ea70d7724f)('#000000'));
        }
    };
}


export {$f229ad6ed8947519$export$dc6b73b623f8645f as useColorPickerState};
//# sourceMappingURL=useColorPickerState.mjs.map
