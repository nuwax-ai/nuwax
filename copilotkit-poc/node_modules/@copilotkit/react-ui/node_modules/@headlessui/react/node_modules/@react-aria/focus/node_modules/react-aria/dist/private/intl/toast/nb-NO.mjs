var $9f456ba1a43de04c$exports = {};
$9f456ba1a43de04c$exports = {
    "close": `Lukk`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} varsling`,
            other: ()=>`${formatter.number(args.count)} varsler`
        })}.`
};


export {$9f456ba1a43de04c$exports as default};
//# sourceMappingURL=nb-NO.mjs.map
