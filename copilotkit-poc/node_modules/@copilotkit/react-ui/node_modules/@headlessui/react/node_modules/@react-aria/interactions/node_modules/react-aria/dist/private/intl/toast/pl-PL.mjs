var $d8f3766a47e6ab9b$exports = {};
$d8f3766a47e6ab9b$exports = {
    "close": `Zamknij`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} powiadomienie`,
            few: ()=>`${formatter.number(args.count)} powiadomienia`,
            many: ()=>`${formatter.number(args.count)} powiadomie\u{144}`,
            other: ()=>`${formatter.number(args.count)} powiadomienia`
        })}.`
};


export {$d8f3766a47e6ab9b$exports as default};
//# sourceMappingURL=pl-PL.mjs.map
