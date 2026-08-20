var $066f8d2af3654af5$exports = {};
$066f8d2af3654af5$exports = {
    "close": `Schlie\xdfen`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} Benachrichtigung`,
            other: ()=>`${formatter.number(args.count)} Benachrichtigungen`
        })}.`
};


export {$066f8d2af3654af5$exports as default};
//# sourceMappingURL=de-DE.mjs.map
