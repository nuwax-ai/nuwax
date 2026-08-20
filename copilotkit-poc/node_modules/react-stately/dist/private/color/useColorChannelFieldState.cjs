var $7dbcf2f8a3f533af$exports = require("../numberfield/useNumberFieldState.cjs");
var $4e0e76ad3205925c$exports = require("./useColor.cjs");
var $14cedf286405cc4b$exports = require("../utils/useControlledState.cjs");
var $6OCUc$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useColorChannelFieldState", function () { return $426f9e14fe3296e9$export$b9fc0d69c9190c4a; });




function $426f9e14fe3296e9$export$b9fc0d69c9190c4a(props) {
    let { channel: channel, colorSpace: colorSpace, locale: locale } = props;
    let initialValue = (0, $4e0e76ad3205925c$exports.useColor)(props.value);
    let initialDefaultValue = (0, $4e0e76ad3205925c$exports.useColor)(props.defaultValue);
    let [colorValue, setColor] = (0, $14cedf286405cc4b$exports.useControlledState)(initialValue, initialDefaultValue ?? null, props.onChange);
    let color = $426f9e14fe3296e9$var$useConvertColor(colorValue, colorSpace);
    let [initialColorValue] = (0, $6OCUc$react.useState)(colorValue);
    let defaultColorValue = initialDefaultValue ?? initialColorValue;
    let defaultColor = $426f9e14fe3296e9$var$useConvertColor(defaultColorValue, colorSpace);
    let value = color.getChannelValue(channel);
    let range = color.getChannelRange(channel);
    let formatOptions = (0, $6OCUc$react.useMemo)(()=>color.getChannelFormatOptions(channel), [
        color,
        channel
    ]);
    let multiplier = formatOptions.style === 'percent' && range.maxValue === 100 ? 100 : 1;
    let numberFieldState = (0, $7dbcf2f8a3f533af$exports.useNumberFieldState)({
        locale: locale,
        value: colorValue === null ? NaN : value / multiplier,
        defaultValue: defaultColorValue === null ? NaN : defaultColor.getChannelValue(channel) / multiplier,
        onChange: (v)=>{
            if (!Number.isNaN(v)) setColor(color.withChannelValue(channel, v * multiplier));
            else setColor(null);
        },
        minValue: range.minValue / multiplier,
        maxValue: range.maxValue / multiplier,
        step: range.step / multiplier,
        formatOptions: formatOptions
    });
    return {
        ...numberFieldState,
        colorValue: color,
        defaultColorValue: defaultColorValue,
        setColorValue: setColor
    };
}
function $426f9e14fe3296e9$var$useConvertColor(colorValue, colorSpace) {
    let black = (0, $4e0e76ad3205925c$exports.useColor)('#000');
    return (0, $6OCUc$react.useMemo)(()=>{
        let nonNullColorValue = colorValue || black;
        return colorSpace && nonNullColorValue ? nonNullColorValue.toFormat(colorSpace) : nonNullColorValue;
    }, [
        black,
        colorValue,
        colorSpace
    ]);
}


//# sourceMappingURL=useColorChannelFieldState.cjs.map
