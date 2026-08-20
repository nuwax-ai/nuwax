import {useNumberFieldState as $3d0ee518c6f3d04f$export$7f629e9dc1ecf37c} from "../numberfield/useNumberFieldState.mjs";
import {useColor as $7d5d4eb4667f32af$export$5aadd9c0606af5c2} from "./useColor.mjs";
import {useControlledState as $3e6197669829fe11$export$40bfa8c7b0832715} from "../utils/useControlledState.mjs";
import {useState as $7kIzU$useState, useMemo as $7kIzU$useMemo} from "react";





function $378fa61546b28d38$export$b9fc0d69c9190c4a(props) {
    let { channel: channel, colorSpace: colorSpace, locale: locale } = props;
    let initialValue = (0, $7d5d4eb4667f32af$export$5aadd9c0606af5c2)(props.value);
    let initialDefaultValue = (0, $7d5d4eb4667f32af$export$5aadd9c0606af5c2)(props.defaultValue);
    let [colorValue, setColor] = (0, $3e6197669829fe11$export$40bfa8c7b0832715)(initialValue, initialDefaultValue ?? null, props.onChange);
    let color = $378fa61546b28d38$var$useConvertColor(colorValue, colorSpace);
    let [initialColorValue] = (0, $7kIzU$useState)(colorValue);
    let defaultColorValue = initialDefaultValue ?? initialColorValue;
    let defaultColor = $378fa61546b28d38$var$useConvertColor(defaultColorValue, colorSpace);
    let value = color.getChannelValue(channel);
    let range = color.getChannelRange(channel);
    let formatOptions = (0, $7kIzU$useMemo)(()=>color.getChannelFormatOptions(channel), [
        color,
        channel
    ]);
    let multiplier = formatOptions.style === 'percent' && range.maxValue === 100 ? 100 : 1;
    let numberFieldState = (0, $3d0ee518c6f3d04f$export$7f629e9dc1ecf37c)({
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
function $378fa61546b28d38$var$useConvertColor(colorValue, colorSpace) {
    let black = (0, $7d5d4eb4667f32af$export$5aadd9c0606af5c2)('#000');
    return (0, $7kIzU$useMemo)(()=>{
        let nonNullColorValue = colorValue || black;
        return colorSpace && nonNullColorValue ? nonNullColorValue.toFormat(colorSpace) : nonNullColorValue;
    }, [
        black,
        colorValue,
        colorSpace
    ]);
}


export {$378fa61546b28d38$export$b9fc0d69c9190c4a as useColorChannelFieldState};
//# sourceMappingURL=useColorChannelFieldState.mjs.map
