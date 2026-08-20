var $309fd0c1bad03077$exports = {};
$309fd0c1bad03077$exports = {
    "close": `\u{625}\u{63A}\u{644}\u{627}\u{642}`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} \u{625}\u{634}\u{639}\u{627}\u{631}`,
            other: ()=>`${formatter.number(args.count)} \u{625}\u{634}\u{639}\u{627}\u{631}\u{627}\u{62A}`
        })}.`
};


export {$309fd0c1bad03077$exports as default};
//# sourceMappingURL=ar-AE.mjs.map
