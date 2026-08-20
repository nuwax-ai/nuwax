module.exports = {
    "deselectedItem": (args)=>`${args.item} non s\xe9lectionn\xe9.`,
    "longPressToSelect": `Appuyez de mani\xe8re prolong\xe9e pour passer en mode de s\xe9lection.`,
    "select": `S\xe9lectionner`,
    "selectedAll": `Tous les \xe9l\xe9ments s\xe9lectionn\xe9s.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Aucun \xe9l\xe9ment s\xe9lectionn\xe9`,
            one: ()=>`${formatter.number(args.count)} \xe9l\xe9ment s\xe9lectionn\xe9`,
            other: ()=>`${formatter.number(args.count)} \xe9l\xe9ments s\xe9lectionn\xe9s`
        })}.`,
    "selectedItem": (args)=>`${args.item} s\xe9lectionn\xe9.`
};


//# sourceMappingURL=fr-FR.cjs.map
