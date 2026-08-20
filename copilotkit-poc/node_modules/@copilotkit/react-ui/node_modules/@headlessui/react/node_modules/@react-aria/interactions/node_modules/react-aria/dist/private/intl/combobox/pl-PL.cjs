module.exports = {
    "buttonLabel": `Wy\u{15B}wietlaj sugestie`,
    "countAnnouncement": (args, formatter)=>`dost\u{119}pna/dost\u{119}pne(-nych) ${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} opcja`,
            other: ()=>`${formatter.number(args.optionCount)} opcje(-i)`
        })}.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Do\u{142}\u{105}czono do grupy ${args.groupTitle}, z ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} opcj\u{105}`,
                    other: ()=>`${formatter.number(args.groupCount)} opcjami`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, wybrano`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Sugestie`,
    "selectedAnnouncement": (args)=>`${args.optionText}, wybrano`
};


//# sourceMappingURL=pl-PL.cjs.map
