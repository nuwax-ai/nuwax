var $22032ee367d0c23f$exports = {};
$22032ee367d0c23f$exports = {
    "close": `Chiudi`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} notifica`,
            other: ()=>`${formatter.number(args.count)} notifiche`
        })}.`
};


export {$22032ee367d0c23f$exports as default};
//# sourceMappingURL=it-IT.js.map
