var $7fba0ba4d825a778$exports = {};
$7fba0ba4d825a778$exports = {
    "close": `Lukk`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} varsling`,
            other: ()=>`${formatter.number(args.count)} varsler`
        })}.`
};


export {$7fba0ba4d825a778$exports as default};
//# sourceMappingURL=nb-NO.js.map
