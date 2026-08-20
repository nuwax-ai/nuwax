var $880772aaec27ba7d$exports = {};
$880772aaec27ba7d$exports = {
    "close": `Kapat`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} bildirim`,
            other: ()=>`${formatter.number(args.count)} bildirim`
        })}.`
};


export {$880772aaec27ba7d$exports as default};
//# sourceMappingURL=tr-TR.js.map
