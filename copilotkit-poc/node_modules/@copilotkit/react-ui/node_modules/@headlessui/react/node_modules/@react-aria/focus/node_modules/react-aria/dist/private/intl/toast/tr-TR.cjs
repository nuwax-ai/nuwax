module.exports = {
    "close": `Kapat`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} bildirim`,
            other: ()=>`${formatter.number(args.count)} bildirim`
        })}.`
};


//# sourceMappingURL=tr-TR.cjs.map
