var $096ecba971fbf4b7$exports = {};
$096ecba971fbf4b7$exports = {
    "close": `Zatvori`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} obave\u{161}tenje`,
            other: ()=>`${formatter.number(args.count)} obave\u{161}tenja`
        })}.`
};


export {$096ecba971fbf4b7$exports as default};
//# sourceMappingURL=sr-SP.mjs.map
