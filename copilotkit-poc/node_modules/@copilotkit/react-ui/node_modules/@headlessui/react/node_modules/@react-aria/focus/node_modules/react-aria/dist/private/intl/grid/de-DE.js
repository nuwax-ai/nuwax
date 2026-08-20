var $c79492c39ff53be3$exports = {};
$c79492c39ff53be3$exports = {
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


export {$c79492c39ff53be3$exports as default};
//# sourceMappingURL=de-DE.js.map
