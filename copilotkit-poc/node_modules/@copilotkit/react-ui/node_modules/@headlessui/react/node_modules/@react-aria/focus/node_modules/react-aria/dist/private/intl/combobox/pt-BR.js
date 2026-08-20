var $324eb7618e4292dc$exports = {};
$324eb7618e4292dc$exports = {
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


export {$324eb7618e4292dc$exports as default};
//# sourceMappingURL=pt-BR.js.map
