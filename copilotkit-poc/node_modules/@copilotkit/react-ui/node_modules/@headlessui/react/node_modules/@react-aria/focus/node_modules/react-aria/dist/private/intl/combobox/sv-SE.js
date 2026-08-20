var $d5fd1583a7f2316c$exports = {};
$d5fd1583a7f2316c$exports = {
    "buttonLabel": `Visa f\xf6rslag`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} alternativ`,
            other: ()=>`${formatter.number(args.optionCount)} alternativ`
        })} tillg\xe4ngliga.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Ingick i gruppen ${args.groupTitle} med ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} alternativ`,
                    other: ()=>`${formatter.number(args.groupCount)} alternativ`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, valda`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `F\xf6rslag`,
    "selectedAnnouncement": (args)=>`${args.optionText}, valda`
};


export {$d5fd1583a7f2316c$exports as default};
//# sourceMappingURL=sv-SE.js.map
