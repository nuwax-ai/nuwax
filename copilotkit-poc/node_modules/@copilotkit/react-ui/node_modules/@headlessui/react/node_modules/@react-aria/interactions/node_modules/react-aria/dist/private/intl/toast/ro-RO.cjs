module.exports = {
    "close": `\xcenchide\u{163}i`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} notificare`,
            other: ()=>`${formatter.number(args.count)} notific\u{103}ri`
        })}.`
};


//# sourceMappingURL=ro-RO.cjs.map
