module.exports = {
    "buttonLabel": `Vis forslag`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} mulighed tilg\xe6ngelig`,
            other: ()=>`${formatter.number(args.optionCount)} muligheder tilg\xe6ngelige`
        })}.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Angivet gruppe ${args.groupTitle}, med ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} mulighed`,
                    other: ()=>`${formatter.number(args.groupCount)} muligheder`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, valgt`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Forslag`,
    "selectedAnnouncement": (args)=>`${args.optionText}, valgt`
};


//# sourceMappingURL=da-DK.cjs.map
