var $a43e0625847b3238$exports = {};
$a43e0625847b3238$exports = {
    "close": `Chiudi`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} notifica`,
            other: ()=>`${formatter.number(args.count)} notifiche`
        })}.`
};


export {$a43e0625847b3238$exports as default};
//# sourceMappingURL=it-IT.mjs.map
