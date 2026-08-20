var $f9f5656778ebfd2d$exports = {};
$f9f5656778ebfd2d$exports = {
    "deselectedItem": (args)=>`${args.item} not selected.`,
    "select": `Select`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `No items selected`,
            one: ()=>`${formatter.number(args.count)} item selected`,
            other: ()=>`${formatter.number(args.count)} items selected`
        })}.`,
    "selectedAll": `All items selected.`,
    "selectedItem": (args)=>`${args.item} selected.`,
    "longPressToSelect": `Long press to enter selection mode.`
};


export {$f9f5656778ebfd2d$exports as default};
//# sourceMappingURL=en-US.mjs.map
