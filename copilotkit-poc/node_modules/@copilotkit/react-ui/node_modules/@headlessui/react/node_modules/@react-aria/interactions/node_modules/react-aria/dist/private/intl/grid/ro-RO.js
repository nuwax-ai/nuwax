var $0f89cf3d7076ea8f$exports = {};
$0f89cf3d7076ea8f$exports = {
    "deselectedItem": (args)=>`${args.item} neselectat.`,
    "longPressToSelect": `Ap\u{103}sa\u{21B}i lung pentru a intra \xeen modul de selectare.`,
    "select": `Selectare`,
    "selectedAll": `Toate elementele selectate.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Niciun element selectat`,
            one: ()=>`${formatter.number(args.count)} element selectat`,
            other: ()=>`${formatter.number(args.count)} elemente selectate`
        })}.`,
    "selectedItem": (args)=>`${args.item} selectat.`
};


export {$0f89cf3d7076ea8f$exports as default};
//# sourceMappingURL=ro-RO.js.map
