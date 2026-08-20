module.exports = {
    "close": `Sluiten`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} melding`,
            other: ()=>`${formatter.number(args.count)} meldingen`
        })}.`
};


//# sourceMappingURL=nl-NL.cjs.map
