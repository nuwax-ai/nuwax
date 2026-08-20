var $e37e80481a01597b$exports = {};
$e37e80481a01597b$exports = {
    "deselectedItem": (args)=>`${args.item} ikke valgt.`,
    "longPressToSelect": `Lav et langt tryk for at aktivere valgtilstand.`,
    "select": `V\xe6lg`,
    "selectedAll": `Alle elementer valgt.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Ingen elementer valgt`,
            one: ()=>`${formatter.number(args.count)} element valgt`,
            other: ()=>`${formatter.number(args.count)} elementer valgt`
        })}.`,
    "selectedItem": (args)=>`${args.item} valgt.`
};


export {$e37e80481a01597b$exports as default};
//# sourceMappingURL=da-DK.js.map
