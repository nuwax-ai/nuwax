var $6b425f026d6a87ed$exports = {};
$6b425f026d6a87ed$exports = {
    "close": `Zatvori`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} obavijest`,
            other: ()=>`${formatter.number(args.count)} obavijesti`
        })}.`
};


export {$6b425f026d6a87ed$exports as default};
//# sourceMappingURL=hr-HR.js.map
