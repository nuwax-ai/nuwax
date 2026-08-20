var $327cf20ee73899b7$exports = {};
$327cf20ee73899b7$exports = {
    "close": `Sulje`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} ilmoitus`,
            other: ()=>`${formatter.number(args.count)} ilmoitusta`
        })}.`
};


export {$327cf20ee73899b7$exports as default};
//# sourceMappingURL=fi-FI.js.map
