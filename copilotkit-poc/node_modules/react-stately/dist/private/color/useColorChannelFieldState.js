import {useNumberFieldState as $350d668ac1240cb8$export$7f629e9dc1ecf37c} from "../numberfield/useNumberFieldState.js";
import {useColor as $3c80253044a6b286$export$5aadd9c0606af5c2} from "./useColor.js";
import {useControlledState as $2a35a170cf8e413e$export$40bfa8c7b0832715} from "../utils/useControlledState.js";
import {useState as $kIP6i$useState, useMemo as $kIP6i$useMemo} from "react";





function $2a6e4ba192d4a25d$export$b9fc0d69c9190c4a(props) {
    let { channel: channel, colorSpace: colorSpace, locale: locale } = props;
    let initialValue = (0, $3c80253044a6b286$export$5aadd9c0606af5c2)(props.value);
    let initialDefaultValue = (0, $3c80253044a6b286$export$5aadd9c0606af5c2)(props.defaultValue);
    let [colorValue, setColor] = (0, $2a35a170cf8e413e$export$40bfa8c7b0832715)(initialValue, initialDefaultValue !== null && initialDefaultValue !== void 0 ? initialDefaultValue : null, props.onChange);
    let color = $2a6e4ba192d4a25d$var$useConvertColor(colorValue, colorSpace);
    let [initialColorValue] = (0, $kIP6i$useState)(colorValue);
    let defaultColorValue = initialDefaultValue !== null && initialDefaultValue !== void 0 ? initialDefaultValue : initialColorValue;
    let defaultColor = $2a6e4ba192d4a25d$var$useConvertColor(defaultColorValue, colorSpace);
    let value = color.getChannelValue(channel);
    let range = color.getChannelRange(channel);
    let formatOptions = (0, $kIP6i$useMemo)(()=>color.getChannelFormatOptions(channel), [
        color,
        channel
    ]);
    let multiplier = formatOptions.style === 'percent' && range.maxValue === 100 ? 100 : 1;
    let numberFieldState = (0, $350d668ac1240cb8$export$7f629e9dc1ecf37c)({
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
function $2a6e4ba192d4a25d$var$useConvertColor(colorValue, colorSpace) {
    let black = (0, $3c80253044a6b286$export$5aadd9c0606af5c2)('#000');
    return (0, $kIP6i$useMemo)(()=>{
        let nonNullColorValue = colorValue || black;
        return colorSpace && nonNullColorValue ? nonNullColorValue.toFormat(colorSpace) : nonNullColorValue;
    }, [
        black,
        colorValue,
        colorSpace
    ]);
}


export {$2a6e4ba192d4a25d$export$b9fc0d69c9190c4a as useColorChannelFieldState};
//# sourceMappingURL=useColorChannelFieldState.js.map
