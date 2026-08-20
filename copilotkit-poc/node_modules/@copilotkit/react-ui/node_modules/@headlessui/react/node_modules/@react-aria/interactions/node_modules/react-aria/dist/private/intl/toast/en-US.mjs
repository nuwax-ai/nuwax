var $7380b0fb0752f400$exports = {};
$7380b0fb0752f400$exports = {
    "close": `Close`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} notification`,
            other: ()=>`${formatter.number(args.count)} notifications`
        })}.`
};


export {$7380b0fb0752f400$exports as default};
//# sourceMappingURL=en-US.mjs.map
