var $b4106780a48d8be8$exports = {};
$b4106780a48d8be8$exports = {
    "deselectedItem": (args)=>`${args.item} nicht ausgew\xe4hlt.`,
    "longPressToSelect": `Gedr\xfcckt halten, um Auswahlmodus zu \xf6ffnen.`,
    "select": `Ausw\xe4hlen`,
    "selectedAll": `Alle Elemente ausgew\xe4hlt.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Keine Elemente ausgew\xe4hlt`,
            one: ()=>`${formatter.number(args.count)} Element ausgew\xe4hlt`,
            other: ()=>`${formatter.number(args.count)} Elemente ausgew\xe4hlt`
        })}.`,
    "selectedItem": (args)=>`${args.item} ausgew\xe4hlt.`
};


export {$b4106780a48d8be8$exports as default};
//# sourceMappingURL=de-DE.mjs.map
