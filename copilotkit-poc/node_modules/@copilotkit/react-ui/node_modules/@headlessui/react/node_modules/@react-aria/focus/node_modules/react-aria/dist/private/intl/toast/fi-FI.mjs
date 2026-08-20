var $32e8bbc2ee9e0249$exports = {};
$32e8bbc2ee9e0249$exports = {
    "close": `Sulje`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} ilmoitus`,
            other: ()=>`${formatter.number(args.count)} ilmoitusta`
        })}.`
};


export {$32e8bbc2ee9e0249$exports as default};
//# sourceMappingURL=fi-FI.mjs.map
