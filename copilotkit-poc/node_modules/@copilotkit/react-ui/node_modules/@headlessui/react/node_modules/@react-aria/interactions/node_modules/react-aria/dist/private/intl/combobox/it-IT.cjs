module.exports = {
    "buttonLabel": `Mostra suggerimenti`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} opzione disponibile`,
            other: ()=>`${formatter.number(args.optionCount)} opzioni disponibili`
        })}.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Ingresso nel gruppo ${args.groupTitle}, con ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} opzione`,
                    other: ()=>`${formatter.number(args.groupCount)} opzioni`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, selezionato`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Suggerimenti`,
    "selectedAnnouncement": (args)=>`${args.optionText}, selezionato`
};


//# sourceMappingURL=it-IT.cjs.map
