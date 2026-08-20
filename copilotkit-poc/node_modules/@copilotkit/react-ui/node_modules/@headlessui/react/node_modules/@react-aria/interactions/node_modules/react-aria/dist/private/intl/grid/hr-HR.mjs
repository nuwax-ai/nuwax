var $4dea078d6dac13bd$exports = {};
$4dea078d6dac13bd$exports = {
    "deselectedItem": (args)=>`Stavka ${args.item} nije odabrana.`,
    "longPressToSelect": `Dugo pritisnite za ulazak u na\u{10D}in odabira.`,
    "select": `Odaberite`,
    "selectedAll": `Odabrane su sve stavke.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Nije odabrana nijedna stavka`,
            one: ()=>`Odabrana je ${formatter.number(args.count)} stavka`,
            other: ()=>`Odabrano je ${formatter.number(args.count)} stavki`
        })}.`,
    "selectedItem": (args)=>`Stavka ${args.item} je odabrana.`
};


export {$4dea078d6dac13bd$exports as default};
//# sourceMappingURL=hr-HR.mjs.map
