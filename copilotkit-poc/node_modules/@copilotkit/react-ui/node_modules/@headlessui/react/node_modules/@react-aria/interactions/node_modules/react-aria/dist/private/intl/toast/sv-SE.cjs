module.exports = {
    "close": `St\xe4ng`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} meddelande`,
            other: ()=>`${formatter.number(args.count)} meddelanden`
        })}.`
};


//# sourceMappingURL=sv-SE.cjs.map
