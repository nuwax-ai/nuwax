module.exports = {
    "close": `Zapri`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} obvestilo`,
            two: ()=>`${formatter.number(args.count)} obvestili`,
            few: ()=>`${formatter.number(args.count)} obvestila`,
            other: ()=>`${formatter.number(args.count)} obvestil`
        })}.`
};


//# sourceMappingURL=sl-SI.cjs.map
