var $8a4e7bb0d7414172$exports = {};
$8a4e7bb0d7414172$exports = {
    "buttonLabel": `Vis forslag`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} alternativ`,
            other: ()=>`${formatter.number(args.optionCount)} alternativer`
        })} finnes.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Angitt gruppe ${args.groupTitle}, med ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} alternativ`,
                    other: ()=>`${formatter.number(args.groupCount)} alternativer`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, valgt`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Forslag`,
    "selectedAnnouncement": (args)=>`${args.optionText}, valgt`
};


export {$8a4e7bb0d7414172$exports as default};
//# sourceMappingURL=nb-NO.mjs.map
