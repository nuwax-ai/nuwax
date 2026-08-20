var $d5720ca22d188058$exports = {};
$d5720ca22d188058$exports = {
    "close": `Zapri`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} obvestilo`,
            two: ()=>`${formatter.number(args.count)} obvestili`,
            few: ()=>`${formatter.number(args.count)} obvestila`,
            other: ()=>`${formatter.number(args.count)} obvestil`
        })}.`
};


export {$d5720ca22d188058$exports as default};
//# sourceMappingURL=sl-SI.mjs.map
