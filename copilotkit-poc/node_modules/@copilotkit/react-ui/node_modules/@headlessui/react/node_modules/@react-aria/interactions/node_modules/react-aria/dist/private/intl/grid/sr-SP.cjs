module.exports = {
    "deselectedItem": (args)=>`${args.item} nije izabrano.`,
    "longPressToSelect": `Dugo pritisnite za ulazak u re\u{17E}im biranja.`,
    "select": `Izaberite`,
    "selectedAll": `Izabrane su sve stavke.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Nije izabrana nijedna stavka`,
            one: ()=>`Izabrana je ${formatter.number(args.count)} stavka`,
            other: ()=>`Izabrano je ${formatter.number(args.count)} stavki`
        })}.`,
    "selectedItem": (args)=>`${args.item} je izabrano.`
};


//# sourceMappingURL=sr-SP.cjs.map
