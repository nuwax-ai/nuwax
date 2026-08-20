module.exports = {
    "close": `\u{5E1}\u{5D2}\u{5D5}\u{5E8}`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} \u{5D4}\u{5EA}\u{5E8}\u{5D0}\u{5D4}`,
            other: ()=>`${formatter.number(args.count)} \u{5D4}\u{5EA}\u{5E8}\u{5D0}\u{5D5}\u{5EA}`
        })}.`
};


//# sourceMappingURL=he-IL.cjs.map
