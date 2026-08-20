module.exports = {
    "close": `\u{B2EB}\u{AE30}`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)}\u{AC1C} \u{C54C}\u{B9BC}`,
            other: ()=>`${formatter.number(args.count)}\u{AC1C} \u{C54C}\u{B9BC}`
        })}.`
};


//# sourceMappingURL=ko-KR.cjs.map
