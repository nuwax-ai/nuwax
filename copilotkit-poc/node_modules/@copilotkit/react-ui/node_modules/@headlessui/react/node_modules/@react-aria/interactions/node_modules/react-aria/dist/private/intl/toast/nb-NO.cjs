module.exports = {
    "close": `Lukk`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} varsling`,
            other: ()=>`${formatter.number(args.count)} varsler`
        })}.`
};


//# sourceMappingURL=nb-NO.cjs.map
