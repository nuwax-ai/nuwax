module.exports = {
    "close": `Chiudi`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} notifica`,
            other: ()=>`${formatter.number(args.count)} notifiche`
        })}.`
};


//# sourceMappingURL=it-IT.cjs.map
