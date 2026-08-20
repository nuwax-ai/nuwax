var $90c404755d945e7c$exports = require("./Color.cjs");
var $4e0e76ad3205925c$exports = require("./useColor.cjs");
var $14cedf286405cc4b$exports = require("../utils/useControlledState.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useColorPickerState", function () { return $dcddb119933ec704$export$dc6b73b623f8645f; });



function $dcddb119933ec704$export$dc6b73b623f8645f(props) {
    let value = (0, $4e0e76ad3205925c$exports.useColor)(props.value);
    let defaultValue = (0, $4e0e76ad3205925c$exports.useColor)(props.defaultValue || '#000000');
    let [color, setColor] = (0, $14cedf286405cc4b$exports.useControlledState)(value || undefined, defaultValue, props.onChange);
    return {
        color: color,
        setColor (color) {
            if (color != null) setColor(color || (0, $90c404755d945e7c$exports.parseColor)('#000000'));
        }
    };
}


//# sourceMappingURL=useColorPickerState.cjs.map
