var $4e49c7d7e3a86269$exports = {};
$4e49c7d7e3a86269$exports = {
    "close": `Zatvori\u{165}`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} ozn\xe1menie`,
            few: ()=>`${formatter.number(args.count)} ozn\xe1menia`,
            other: ()=>`${formatter.number(args.count)} ozn\xe1men\xed`
        })}.`
};


export {$4e49c7d7e3a86269$exports as default};
//# sourceMappingURL=sk-SK.mjs.map
