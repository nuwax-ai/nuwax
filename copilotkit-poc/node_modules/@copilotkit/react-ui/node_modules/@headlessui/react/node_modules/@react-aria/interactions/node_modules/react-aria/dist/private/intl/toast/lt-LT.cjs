module.exports = {
    "close": `U\u{17E}daryti`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} prane\u{161}imas`,
            other: ()=>`${formatter.number(args.count)} prane\u{161}imai`
        })}.`
};


//# sourceMappingURL=lt-LT.cjs.map
