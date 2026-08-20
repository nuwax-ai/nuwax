module.exports = {
    "deselectedItem": (args)=>`${args.item} niet geselecteerd.`,
    "longPressToSelect": `Druk lang om de selectiemodus te openen.`,
    "select": `Selecteren`,
    "selectedAll": `Alle items geselecteerd.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Geen items geselecteerd`,
            one: ()=>`${formatter.number(args.count)} item geselecteerd`,
            other: ()=>`${formatter.number(args.count)} items geselecteerd`
        })}.`,
    "selectedItem": (args)=>`${args.item} geselecteerd.`
};


//# sourceMappingURL=nl-NL.cjs.map
