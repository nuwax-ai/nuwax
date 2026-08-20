var $113fc138444b3ff6$exports = {};
$113fc138444b3ff6$exports = {
    "deselectedItem": (args)=>`${args.item} non selezionato.`,
    "longPressToSelect": `Premi a lungo per passare alla modalit\xe0 di selezione.`,
    "select": `Seleziona`,
    "selectedAll": `Tutti gli elementi selezionati.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Nessun elemento selezionato`,
            one: ()=>`${formatter.number(args.count)} elemento selezionato`,
            other: ()=>`${formatter.number(args.count)} elementi selezionati`
        })}.`,
    "selectedItem": (args)=>`${args.item} selezionato.`
};


export {$113fc138444b3ff6$exports as default};
//# sourceMappingURL=it-IT.js.map
