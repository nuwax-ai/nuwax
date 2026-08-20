module.exports = {
    "buttonLabel": `Prika\u{17E}i predloge`,
    "countAnnouncement": (args, formatter)=>`Na voljo je ${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} opcija`,
            other: ()=>`${formatter.number(args.optionCount)} opcije`
        })}.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Vnesena skupina ${args.groupTitle}, z ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} opcija`,
                    other: ()=>`${formatter.number(args.groupCount)} opcije`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, izbrano`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Predlogi`,
    "selectedAnnouncement": (args)=>`${args.optionText}, izbrano`
};


//# sourceMappingURL=sl-SI.cjs.map
