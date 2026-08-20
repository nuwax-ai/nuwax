var $7def316a905ee012$exports = {};
$7def316a905ee012$exports = {
    "deselectedItem": (args)=>`${args.item} nincs kijel\xf6lve.`,
    "longPressToSelect": `Nyomja hosszan a kijel\xf6l\xe9shez.`,
    "select": `Kijel\xf6l\xe9s`,
    "selectedAll": `Az \xf6sszes elem kijel\xf6lve.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Egy elem sincs kijel\xf6lve`,
            one: ()=>`${formatter.number(args.count)} elem kijel\xf6lve`,
            other: ()=>`${formatter.number(args.count)} elem kijel\xf6lve`
        })}.`,
    "selectedItem": (args)=>`${args.item} kijel\xf6lve.`
};


export {$7def316a905ee012$exports as default};
//# sourceMappingURL=hu-HU.mjs.map
