module.exports = {
    "deselectedItem": (args)=>`${args.item} \u{5DC}\u{5D0} \u{5E0}\u{5D1}\u{5D7}\u{5E8}.`,
    "longPressToSelect": `\u{5D4}\u{5E7}\u{5E9}\u{5D4} \u{5D0}\u{5E8}\u{5D5}\u{5DB}\u{5D4} \u{5DC}\u{5DB}\u{5E0}\u{5D9}\u{5E1}\u{5D4} \u{5DC}\u{5DE}\u{5E6}\u{5D1} \u{5D1}\u{5D7}\u{5D9}\u{5E8}\u{5D4}.`,
    "select": `\u{5D1}\u{5D7}\u{5E8}`,
    "selectedAll": `\u{5DB}\u{5DC} \u{5D4}\u{5E4}\u{5E8}\u{5D9}\u{5D8}\u{5D9}\u{5DD} \u{5E0}\u{5D1}\u{5D7}\u{5E8}\u{5D5}.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `\u{5DC}\u{5D0} \u{5E0}\u{5D1}\u{5D7}\u{5E8}\u{5D5} \u{5E4}\u{5E8}\u{5D9}\u{5D8}\u{5D9}\u{5DD}`,
            one: ()=>`\u{5E4}\u{5E8}\u{5D9}\u{5D8} ${formatter.number(args.count)} \u{5E0}\u{5D1}\u{5D7}\u{5E8}`,
            other: ()=>`${formatter.number(args.count)} \u{5E4}\u{5E8}\u{5D9}\u{5D8}\u{5D9}\u{5DD} \u{5E0}\u{5D1}\u{5D7}\u{5E8}\u{5D5}`
        })}.`,
    "selectedItem": (args)=>`${args.item} \u{5E0}\u{5D1}\u{5D7}\u{5E8}.`
};


//# sourceMappingURL=he-IL.cjs.map
