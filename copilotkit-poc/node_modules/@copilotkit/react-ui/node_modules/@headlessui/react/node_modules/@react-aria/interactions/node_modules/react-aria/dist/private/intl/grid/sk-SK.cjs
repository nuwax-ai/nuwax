module.exports = {
    "deselectedItem": (args)=>`Nevybrat\xe9 polo\u{17E}ky: ${args.item}.`,
    "longPressToSelect": `Dlh\u{161}\xedm stla\u{10D}en\xedm prejdite do re\u{17E}imu v\xfdberu.`,
    "select": `Vybra\u{165}`,
    "selectedAll": `V\u{161}etky vybrat\xe9 polo\u{17E}ky.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `\u{17D}iadne vybrat\xe9 polo\u{17E}ky`,
            one: ()=>`${formatter.number(args.count)} vybrat\xe1 polo\u{17E}ka`,
            other: ()=>`Po\u{10D}et vybrat\xfdch polo\u{17E}iek:${formatter.number(args.count)}`
        })}.`,
    "selectedItem": (args)=>`Vybrat\xe9 polo\u{17E}ky: ${args.item}.`
};


//# sourceMappingURL=sk-SK.cjs.map
