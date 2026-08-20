var $12275897f225851d$exports = {};
$12275897f225851d$exports = {
    "deselectedItem": (args)=>`${args.item} pole valitud.`,
    "longPressToSelect": `Valikure\u{17E}iimi sisenemiseks vajutage pikalt.`,
    "select": `Vali`,
    "selectedAll": `K\xf5ik \xfcksused valitud.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `\xdcksusi pole valitud`,
            one: ()=>`${formatter.number(args.count)} \xfcksus valitud`,
            other: ()=>`${formatter.number(args.count)} \xfcksust valitud`
        })}.`,
    "selectedItem": (args)=>`${args.item} valitud.`
};


export {$12275897f225851d$exports as default};
//# sourceMappingURL=et-EE.mjs.map
