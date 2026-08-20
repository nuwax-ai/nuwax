var $d84e3ed61b9b8a27$exports = {};
$d84e3ed61b9b8a27$exports = {
    "close": `Sluiten`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} melding`,
            other: ()=>`${formatter.number(args.count)} meldingen`
        })}.`
};


export {$d84e3ed61b9b8a27$exports as default};
//# sourceMappingURL=nl-NL.mjs.map
