var $e46f9228945582bb$exports = {};
$e46f9228945582bb$exports = {
    "close": `Schlie\xdfen`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} Benachrichtigung`,
            other: ()=>`${formatter.number(args.count)} Benachrichtigungen`
        })}.`
};


export {$e46f9228945582bb$exports as default};
//# sourceMappingURL=de-DE.js.map
