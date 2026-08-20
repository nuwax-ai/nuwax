var $80d37fee4e8e52e2$exports = {};
$80d37fee4e8e52e2$exports = {
    "deselectedItem": (args)=>`${args.item} ej markerat.`,
    "longPressToSelect": `Tryck l\xe4nge n\xe4r du vill \xf6ppna v\xe4ljarl\xe4ge.`,
    "select": `Markera`,
    "selectedAll": `Alla markerade objekt.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Inga markerade objekt`,
            one: ()=>`${formatter.number(args.count)} markerat objekt`,
            other: ()=>`${formatter.number(args.count)} markerade objekt`
        })}.`,
    "selectedItem": (args)=>`${args.item} markerat.`
};


export {$80d37fee4e8e52e2$exports as default};
//# sourceMappingURL=sv-SE.js.map
