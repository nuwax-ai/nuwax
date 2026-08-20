var $d49350d8f1deac05$exports = {};
$d49350d8f1deac05$exports = {
    "close": `Zatvori\u{165}`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} ozn\xe1menie`,
            few: ()=>`${formatter.number(args.count)} ozn\xe1menia`,
            other: ()=>`${formatter.number(args.count)} ozn\xe1men\xed`
        })}.`
};


export {$d49350d8f1deac05$exports as default};
//# sourceMappingURL=sk-SK.js.map
