var $ca04e7102e830455$exports = {};
$ca04e7102e830455$exports = {
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


export {$ca04e7102e830455$exports as default};
//# sourceMappingURL=sv-SE.mjs.map
