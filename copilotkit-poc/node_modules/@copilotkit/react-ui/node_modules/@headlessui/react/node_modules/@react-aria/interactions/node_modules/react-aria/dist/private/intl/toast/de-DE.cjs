module.exports = {
    "close": `Schlie\xdfen`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} Benachrichtigung`,
            other: ()=>`${formatter.number(args.count)} Benachrichtigungen`
        })}.`
};


//# sourceMappingURL=de-DE.cjs.map
