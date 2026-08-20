var $d40a01178876e077$exports = {};
$d40a01178876e077$exports = {
    "close": `Zatvori`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} obave\u{161}tenje`,
            other: ()=>`${formatter.number(args.count)} obave\u{161}tenja`
        })}.`
};


export {$d40a01178876e077$exports as default};
//# sourceMappingURL=sr-SP.js.map
