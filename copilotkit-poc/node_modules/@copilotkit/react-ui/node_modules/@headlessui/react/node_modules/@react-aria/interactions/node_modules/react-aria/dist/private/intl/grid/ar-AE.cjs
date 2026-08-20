module.exports = {
    "deselectedItem": (args)=>`${args.item} \u{63A}\u{64A}\u{631} \u{627}\u{644}\u{645}\u{62D}\u{62F}\u{62F}`,
    "longPressToSelect": `\u{627}\u{636}\u{63A}\u{637} \u{645}\u{637}\u{648}\u{644}\u{64B}\u{627} \u{644}\u{644}\u{62F}\u{62E}\u{648}\u{644} \u{625}\u{644}\u{649} \u{648}\u{636}\u{639} \u{627}\u{644}\u{62A}\u{62D}\u{62F}\u{64A}\u{62F}.`,
    "select": `\u{62A}\u{62D}\u{62F}\u{64A}\u{62F}`,
    "selectedAll": `\u{62C}\u{645}\u{64A}\u{639} \u{627}\u{644}\u{639}\u{646}\u{627}\u{635}\u{631} \u{627}\u{644}\u{645}\u{62D}\u{62F}\u{62F}\u{629}.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `\u{644}\u{645} \u{64A}\u{62A}\u{645} \u{62A}\u{62D}\u{62F}\u{64A}\u{62F} \u{639}\u{646}\u{627}\u{635}\u{631}`,
            one: ()=>`${formatter.number(args.count)} \u{639}\u{646}\u{635}\u{631} \u{645}\u{62D}\u{62F}\u{62F}`,
            other: ()=>`${formatter.number(args.count)} \u{639}\u{646}\u{635}\u{631} \u{645}\u{62D}\u{62F}\u{62F}`
        })}.`,
    "selectedItem": (args)=>`${args.item} \u{627}\u{644}\u{645}\u{62D}\u{62F}\u{62F}`
};


//# sourceMappingURL=ar-AE.cjs.map
