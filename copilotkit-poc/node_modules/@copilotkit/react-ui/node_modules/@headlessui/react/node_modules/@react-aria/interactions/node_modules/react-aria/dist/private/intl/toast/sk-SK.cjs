module.exports = {
    "close": `Zatvori\u{165}`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} ozn\xe1menie`,
            few: ()=>`${formatter.number(args.count)} ozn\xe1menia`,
            other: ()=>`${formatter.number(args.count)} ozn\xe1men\xed`
        })}.`
};


//# sourceMappingURL=sk-SK.cjs.map
