module.exports = {
    "close": `\u{417}\u{430}\u{43A}\u{440}\u{44B}\u{442}\u{44C}`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} \u{443}\u{432}\u{435}\u{434}\u{43E}\u{43C}\u{43B}\u{435}\u{43D}\u{438}\u{435}`,
            other: ()=>`${formatter.number(args.count)} \u{443}\u{432}\u{435}\u{434}\u{43E}\u{43C}\u{43B}\u{435}\u{43D}\u{438}\u{44F}`
        })}.`
};


//# sourceMappingURL=ru-RU.cjs.map
