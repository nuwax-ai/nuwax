var $1057bd2d9ffb71b2$exports = {};
$1057bd2d9ffb71b2$exports = {
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


export {$1057bd2d9ffb71b2$exports as default};
//# sourceMappingURL=da-DK.mjs.map
