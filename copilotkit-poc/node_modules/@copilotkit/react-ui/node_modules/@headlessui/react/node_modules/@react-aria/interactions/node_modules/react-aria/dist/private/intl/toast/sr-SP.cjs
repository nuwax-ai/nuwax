module.exports = {
    "close": `Zatvori`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} obave\u{161}tenje`,
            other: ()=>`${formatter.number(args.count)} obave\u{161}tenja`
        })}.`
};


//# sourceMappingURL=sr-SP.cjs.map
