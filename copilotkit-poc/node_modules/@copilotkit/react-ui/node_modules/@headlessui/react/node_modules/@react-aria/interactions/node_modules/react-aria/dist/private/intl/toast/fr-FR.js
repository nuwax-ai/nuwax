var $20b16c3635e5f96a$exports = {};
$20b16c3635e5f96a$exports = {
    "close": `Fermer`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} notification`,
            other: ()=>`${formatter.number(args.count)} notifications`
        })}.`
};


export {$20b16c3635e5f96a$exports as default};
//# sourceMappingURL=fr-FR.js.map
