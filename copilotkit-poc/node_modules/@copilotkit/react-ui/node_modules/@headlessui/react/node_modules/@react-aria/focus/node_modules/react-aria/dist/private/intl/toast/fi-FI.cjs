module.exports = {
    "close": `Sulje`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} ilmoitus`,
            other: ()=>`${formatter.number(args.count)} ilmoitusta`
        })}.`
};


//# sourceMappingURL=fi-FI.cjs.map
