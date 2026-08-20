module.exports = {
    "close": `Zav\u{159}\xedt`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} ozn\xe1men\xed`,
            other: ()=>`${formatter.number(args.count)} ozn\xe1men\xed`
        })}.`
};


//# sourceMappingURL=cs-CZ.cjs.map
