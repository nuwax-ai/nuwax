var $c95907e6aed76e0f$exports = {};
$c95907e6aed76e0f$exports = {
    "close": `St\xe4ng`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} meddelande`,
            other: ()=>`${formatter.number(args.count)} meddelanden`
        })}.`
};


export {$c95907e6aed76e0f$exports as default};
//# sourceMappingURL=sv-SE.mjs.map
