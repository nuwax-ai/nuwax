module.exports = {
    "buttonLabel": `Mostrar sugest\xf5es`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} op\xe7\xe3o`,
            other: ()=>`${formatter.number(args.optionCount)} op\xe7\xf5es`
        })} dispon\xedvel.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Grupo inserido ${args.groupTitle}, com ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} op\xe7\xe3o`,
                    other: ()=>`${formatter.number(args.groupCount)} op\xe7\xf5es`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, selecionado`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Sugest\xf5es`,
    "selectedAnnouncement": (args)=>`${args.optionText}, selecionado`
};


//# sourceMappingURL=pt-BR.cjs.map
