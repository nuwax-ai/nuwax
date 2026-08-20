module.exports = {
    "deselectedItem": (args)=>`Polo\u{17E}ka ${args.item} nen\xed vybr\xe1na.`,
    "longPressToSelect": `Dlouh\xfdm stisknut\xedm p\u{159}ejdete do re\u{17E}imu v\xfdb\u{11B}ru.`,
    "select": `Vybrat`,
    "selectedAll": `Vybr\xe1ny v\u{161}echny polo\u{17E}ky.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Nevybr\xe1ny \u{17E}\xe1dn\xe9 polo\u{17E}ky`,
            one: ()=>`Vybr\xe1na ${formatter.number(args.count)} polo\u{17E}ka`,
            other: ()=>`Vybr\xe1no ${formatter.number(args.count)} polo\u{17E}ek`
        })}.`,
    "selectedItem": (args)=>`Vybr\xe1na polo\u{17E}ka ${args.item}.`
};


//# sourceMappingURL=cs-CZ.cjs.map
