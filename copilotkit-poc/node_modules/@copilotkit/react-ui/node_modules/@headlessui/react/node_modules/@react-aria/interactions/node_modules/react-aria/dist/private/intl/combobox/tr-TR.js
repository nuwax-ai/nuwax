var $d78c8b140ec3bd24$exports = {};
$d78c8b140ec3bd24$exports = {
    "buttonLabel": `\xd6nerileri g\xf6ster`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} se\xe7enek`,
            other: ()=>`${formatter.number(args.optionCount)} se\xe7enekler`
        })} kullan\u{131}labilir.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Girilen grup ${args.groupTitle}, ile ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} se\xe7enek`,
                    other: ()=>`${formatter.number(args.groupCount)} se\xe7enekler`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, se\xe7ildi`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `\xd6neriler`,
    "selectedAnnouncement": (args)=>`${args.optionText}, se\xe7ildi`
};


export {$d78c8b140ec3bd24$exports as default};
//# sourceMappingURL=tr-TR.js.map
