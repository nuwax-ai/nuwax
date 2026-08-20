var $b32ccbefbe0dd889$exports = {};
$b32ccbefbe0dd889$exports = {
    "deselectedItem": (args)=>`${args.item} er ikke valgt.`,
    "longPressToSelect": `Bruk et langt trykk for \xe5 g\xe5 inn i valgmodus.`,
    "select": `Velg`,
    "selectedAll": `Alle elementer er valgt.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Ingen elementer er valgt`,
            one: ()=>`${formatter.number(args.count)} element er valgt`,
            other: ()=>`${formatter.number(args.count)} elementer er valgt`
        })}.`,
    "selectedItem": (args)=>`${args.item} er valgt.`
};


export {$b32ccbefbe0dd889$exports as default};
//# sourceMappingURL=nb-NO.js.map
