module.exports = {
    "deselectedItem": (args)=>`${args.item} se\xe7ilmedi.`,
    "longPressToSelect": `Se\xe7im moduna girmek i\xe7in uzun bas\u{131}n.`,
    "select": `Se\xe7`,
    "selectedAll": `T\xfcm \xf6geler se\xe7ildi.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Hi\xe7bir \xf6ge se\xe7ilmedi`,
            one: ()=>`${formatter.number(args.count)} \xf6ge se\xe7ildi`,
            other: ()=>`${formatter.number(args.count)} \xf6ge se\xe7ildi`
        })}.`,
    "selectedItem": (args)=>`${args.item} se\xe7ildi.`
};


//# sourceMappingURL=tr-TR.cjs.map
