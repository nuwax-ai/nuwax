var $3c1f280212fbe3e1$exports = {};
$3c1f280212fbe3e1$exports = {
    "buttonLabel": `Empfehlungen anzeigen`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} Option`,
            other: ()=>`${formatter.number(args.optionCount)} Optionen`
        })} verf\xfcgbar.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Eingetretene Gruppe ${args.groupTitle}, mit ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} Option`,
                    other: ()=>`${formatter.number(args.groupCount)} Optionen`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, ausgew\xe4hlt`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Empfehlungen`,
    "selectedAnnouncement": (args)=>`${args.optionText}, ausgew\xe4hlt`
};


export {$3c1f280212fbe3e1$exports as default};
//# sourceMappingURL=de-DE.mjs.map
