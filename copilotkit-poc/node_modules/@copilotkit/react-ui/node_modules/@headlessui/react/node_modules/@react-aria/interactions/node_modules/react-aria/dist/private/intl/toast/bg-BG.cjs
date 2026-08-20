module.exports = {
    "close": `\u{417}\u{430}\u{442}\u{432}\u{43E}\u{440}\u{438}`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} \u{438}\u{437}\u{432}\u{435}\u{441}\u{442}\u{438}\u{435}`,
            other: ()=>`${formatter.number(args.count)} \u{438}\u{437}\u{432}\u{435}\u{441}\u{442}\u{438}\u{44F}`
        })}.`
};


//# sourceMappingURL=bg-BG.cjs.map
