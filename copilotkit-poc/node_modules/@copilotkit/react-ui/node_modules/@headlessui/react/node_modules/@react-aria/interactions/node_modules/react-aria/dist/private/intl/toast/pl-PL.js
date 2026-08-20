var $4a9e802dbd8ddf52$exports = {};
$4a9e802dbd8ddf52$exports = {
    "close": `Zamknij`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} powiadomienie`,
            few: ()=>`${formatter.number(args.count)} powiadomienia`,
            many: ()=>`${formatter.number(args.count)} powiadomie\u{144}`,
            other: ()=>`${formatter.number(args.count)} powiadomienia`
        })}.`
};


export {$4a9e802dbd8ddf52$exports as default};
//# sourceMappingURL=pl-PL.js.map
