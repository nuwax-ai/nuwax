module.exports = {
    "deselectedItem": (args)=>`Element ${args.item} ni izbran.`,
    "longPressToSelect": `Za izbirni na\u{10D}in pritisnite in dlje \u{10D}asa dr\u{17E}ite.`,
    "select": `Izberite`,
    "selectedAll": `Vsi elementi so izbrani.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Noben element ni izbran`,
            one: ()=>`${formatter.number(args.count)} element je izbran`,
            other: ()=>`${formatter.number(args.count)} elementov je izbranih`
        })}.`,
    "selectedItem": (args)=>`Element ${args.item} je izbran.`
};


//# sourceMappingURL=sl-SI.cjs.map
