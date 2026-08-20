module.exports = {
    "close": `Sule`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} teatis`,
            other: ()=>`${formatter.number(args.count)} teatist`
        })}.`
};


//# sourceMappingURL=et-EE.cjs.map
