var $04d4b254da39a220$exports = {};
$04d4b254da39a220$exports = {
    "buttonLabel": `Suggesties weergeven`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} optie`,
            other: ()=>`${formatter.number(args.optionCount)} opties`
        })} beschikbaar.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Groep ${args.groupTitle} ingevoerd met ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} optie`,
                    other: ()=>`${formatter.number(args.groupCount)} opties`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, geselecteerd`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Suggesties`,
    "selectedAnnouncement": (args)=>`${args.optionText}, geselecteerd`
};


export {$04d4b254da39a220$exports as default};
//# sourceMappingURL=nl-NL.mjs.map
