module.exports = {
    "close": `Bez\xe1r\xe1s`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} \xe9rtes\xedt\xe9s`,
            other: ()=>`${formatter.number(args.count)} \xe9rtes\xedt\xe9s`
        })}.`
};


//# sourceMappingURL=hu-HU.cjs.map
