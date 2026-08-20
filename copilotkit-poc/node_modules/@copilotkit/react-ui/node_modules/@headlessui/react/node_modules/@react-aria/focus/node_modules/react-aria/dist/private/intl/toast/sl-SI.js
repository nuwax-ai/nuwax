var $ce8240cde6f684b0$exports = {};
$ce8240cde6f684b0$exports = {
    "close": `Zapri`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} obvestilo`,
            two: ()=>`${formatter.number(args.count)} obvestili`,
            few: ()=>`${formatter.number(args.count)} obvestila`,
            other: ()=>`${formatter.number(args.count)} obvestil`
        })}.`
};


export {$ce8240cde6f684b0$exports as default};
//# sourceMappingURL=sl-SI.js.map
