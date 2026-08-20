var $1f85e79fe8042cb6$exports = {};
$1f85e79fe8042cb6$exports = {
    "close": `Sluiten`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} melding`,
            other: ()=>`${formatter.number(args.count)} meldingen`
        })}.`
};


export {$1f85e79fe8042cb6$exports as default};
//# sourceMappingURL=nl-NL.js.map
