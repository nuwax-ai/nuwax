var $d5d67247e4ef589b$exports = {};
$d5d67247e4ef589b$exports = {
    "close": `Fermer`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} notification`,
            other: ()=>`${formatter.number(args.count)} notifications`
        })}.`
};


export {$d5d67247e4ef589b$exports as default};
//# sourceMappingURL=fr-FR.mjs.map
