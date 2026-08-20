module.exports = {
    "close": `Luk`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} besked`,
            other: ()=>`${formatter.number(args.count)} beskeder`
        })}.`
};


//# sourceMappingURL=da-DK.cjs.map
