module.exports = {
    "close": `Fermer`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} notification`,
            other: ()=>`${formatter.number(args.count)} notifications`
        })}.`
};


//# sourceMappingURL=fr-FR.cjs.map
