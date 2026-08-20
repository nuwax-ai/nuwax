module.exports = {
    "close": `Zamknij`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} powiadomienie`,
            few: ()=>`${formatter.number(args.count)} powiadomienia`,
            many: ()=>`${formatter.number(args.count)} powiadomie\u{144}`,
            other: ()=>`${formatter.number(args.count)} powiadomienia`
        })}.`
};


//# sourceMappingURL=pl-PL.cjs.map
