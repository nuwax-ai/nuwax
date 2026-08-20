var $6696aa30d131c66b$exports = {};
$6696aa30d131c66b$exports = {
    "close": `Zatvori`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} obavijest`,
            other: ()=>`${formatter.number(args.count)} obavijesti`
        })}.`
};


export {$6696aa30d131c66b$exports as default};
//# sourceMappingURL=hr-HR.mjs.map
