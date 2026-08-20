var $04d09c082f380fd0$exports = {};
$04d09c082f380fd0$exports = {
    "close": `Kapat`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} bildirim`,
            other: ()=>`${formatter.number(args.count)} bildirim`
        })}.`
};


export {$04d09c082f380fd0$exports as default};
//# sourceMappingURL=tr-TR.mjs.map
