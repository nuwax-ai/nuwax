var $c12113928ede4b50$exports = {};
$c12113928ede4b50$exports = {
    "dragDescriptionKeyboard": `\u{5D4}\u{5E7}\u{5E9} \u{5E2}\u{5DC} Enter \u{5DB}\u{5D3}\u{5D9} \u{5DC}\u{5D4}\u{5EA}\u{5D7}\u{5D9}\u{5DC} \u{5DC}\u{5D2}\u{5E8}\u{5D5}\u{5E8}.`,
    "dragDescriptionKeyboardAlt": `\u{5D4}\u{5E7}\u{5E9} Alt + Enter \u{5DB}\u{5D3}\u{5D9} \u{5DC}\u{5D4}\u{5EA}\u{5D7}\u{5D9}\u{5DC} \u{5DC}\u{5D2}\u{5E8}\u{5D5}\u{5E8}.`,
    "dragDescriptionLongPress": `\u{5DC}\u{5D7}\u{5E5} \u{5DC}\u{5D7}\u{5D9}\u{5E6}\u{5D4} \u{5D0}\u{5E8}\u{5D5}\u{5DB}\u{5D4} \u{5DB}\u{5D3}\u{5D9} \u{5DC}\u{5D4}\u{5EA}\u{5D7}\u{5D9}\u{5DC} \u{5DC}\u{5D2}\u{5E8}\u{5D5}\u{5E8}.`,
    "dragDescriptionTouch": `\u{5D4}\u{5E7}\u{5E9} \u{5E4}\u{5E2}\u{5DE}\u{5D9}\u{5D9}\u{5DD} \u{5DB}\u{5D3}\u{5D9} \u{5DC}\u{5D4}\u{5EA}\u{5D7}\u{5D9}\u{5DC} \u{5D1}\u{5D2}\u{5E8}\u{5D9}\u{5E8}\u{5D4}.`,
    "dragDescriptionVirtual": `\u{5DC}\u{5D7}\u{5E5} \u{5DB}\u{5D3}\u{5D9} \u{5DC}\u{5D4}\u{5EA}\u{5D7}\u{5D9}\u{5DC} \u{5DC}\u{5D2}\u{5E8}\u{5D5}\u{5E8}.`,
    "dragItem": (args)=>`\u{5D2}\u{5E8}\u{5D5}\u{5E8} \u{5D0}\u{5EA} ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`\u{5D2}\u{5E8}\u{5D5}\u{5E8} ${formatter.plural(args.count, {
            one: ()=>`\u{5E4}\u{5E8}\u{5D9}\u{5D8} \u{5E0}\u{5D1}\u{5D7}\u{5E8} ${formatter.number(args.count)}`,
            other: ()=>`${formatter.number(args.count)} \u{5E4}\u{5E8}\u{5D9}\u{5D8}\u{5D9}\u{5DD} \u{5E9}\u{5E0}\u{5D1}\u{5D7}\u{5E8}\u{5D5}`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`\u{5D4}\u{5E7}\u{5E9} \u{5E2}\u{5DC} Enter \u{5DB}\u{5D3}\u{5D9} \u{5DC}\u{5D2}\u{5E8}\u{5D5}\u{5E8} ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} \u{5E4}\u{5E8}\u{5D9}\u{5D8} \u{5E9}\u{5E0}\u{5D1}\u{5D7}\u{5E8}`,
            other: ()=>`${formatter.number(args.count)} \u{5E4}\u{5E8}\u{5D9}\u{5D8}\u{5D9}\u{5DD} \u{5E9}\u{5E0}\u{5D1}\u{5D7}\u{5E8}\u{5D5}`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`\u{5D4}\u{5E7}\u{5E9} Alt + Enter \u{5DB}\u{5D3}\u{5D9} \u{5DC}\u{5D2}\u{5E8}\u{5D5}\u{5E8} ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} \u{5E4}\u{5E8}\u{5D9}\u{5D8} \u{5E9}\u{5E0}\u{5D1}\u{5D7}\u{5E8}`,
            other: ()=>`${formatter.number(args.count)} \u{5E4}\u{5E8}\u{5D9}\u{5D8}\u{5D9}\u{5DD} \u{5E9}\u{5E0}\u{5D1}\u{5D7}\u{5E8}\u{5D5}`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`\u{5DC}\u{5D7}\u{5E5} \u{5DC}\u{5D7}\u{5D9}\u{5E6}\u{5D4} \u{5D0}\u{5E8}\u{5D5}\u{5DB}\u{5D4} \u{5DB}\u{5D3}\u{5D9} \u{5DC}\u{5D2}\u{5E8}\u{5D5}\u{5E8} ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} \u{5E4}\u{5E8}\u{5D9}\u{5D8} \u{5E9}\u{5E0}\u{5D1}\u{5D7}\u{5E8}`,
            other: ()=>`${formatter.number(args.count)} \u{5E4}\u{5E8}\u{5D9}\u{5D8}\u{5D9}\u{5DD} \u{5E9}\u{5E0}\u{5D1}\u{5D7}\u{5E8}\u{5D5}`
        })}.`,
    "dragStartedKeyboard": `\u{5D4}\u{5EA}\u{5D7}\u{5DC}\u{5EA} \u{5DC}\u{5D2}\u{5E8}\u{5D5}\u{5E8}. \u{5D4}\u{5E7}\u{5E9} \u{5E2}\u{5DC} Tab \u{5DB}\u{5D3}\u{5D9} \u{5DC}\u{5E0}\u{5D5}\u{5D5}\u{5D8} \u{5DC}\u{5E0}\u{5E7}\u{5D5}\u{5D3}\u{5EA} \u{5D4}\u{5D2}\u{5E8}\u{5D9}\u{5E8}\u{5D4} \u{5D5}\u{5DC}\u{5D0}\u{5D7}\u{5E8} \u{5DE}\u{5DB}\u{5DF} \u{5D4}\u{5E7}\u{5E9} \u{5E2}\u{5DC} Enter \u{5DB}\u{5D3}\u{5D9} \u{5DC}\u{5E9}\u{5D7}\u{5E8}\u{5E8} \u{5D0}\u{5D5} \u{5E2}\u{5DC} Escape \u{5DB}\u{5D3}\u{5D9} \u{5DC}\u{5D1}\u{5D8}\u{5DC}.`,
    "dragStartedTouch": `\u{5D4}\u{5EA}\u{5D7}\u{5DC}\u{5EA} \u{5DC}\u{5D2}\u{5E8}\u{5D5}\u{5E8}. \u{5E0}\u{5D5}\u{5D5}\u{5D8} \u{5DC}\u{5E0}\u{5E7}\u{5D5}\u{5D3}\u{5EA} \u{5D4}\u{5E9}\u{5D7}\u{5E8}\u{5D5}\u{5E8} \u{5D5}\u{5DC}\u{5D0}\u{5D7}\u{5E8} \u{5DE}\u{5DB}\u{5DF} \u{5D4}\u{5E7}\u{5E9} \u{5E4}\u{5E2}\u{5DE}\u{5D9}\u{5D9}\u{5DD} \u{5DB}\u{5D3}\u{5D9} \u{5DC}\u{5E9}\u{5D7}\u{5E8}\u{5E8}.`,
    "dragStartedVirtual": `\u{5D4}\u{5EA}\u{5D7}\u{5DC}\u{5EA} \u{5DC}\u{5D2}\u{5E8}\u{5D5}\u{5E8}. \u{5E0}\u{5D5}\u{5D5}\u{5D8} \u{5DC}\u{5E0}\u{5E7}\u{5D5}\u{5D3}\u{5EA} \u{5D4}\u{5E9}\u{5D7}\u{5E8}\u{5D5}\u{5E8} \u{5D5}\u{5DC}\u{5D0}\u{5D7}\u{5E8} \u{5DE}\u{5DB}\u{5DF} \u{5DC}\u{5D7}\u{5E5} \u{5D0}\u{5D5} \u{5D4}\u{5E7}\u{5E9} \u{5E2}\u{5DC} Enter \u{5DB}\u{5D3}\u{5D9} \u{5DC}\u{5E9}\u{5D7}\u{5E8}\u{5E8}.`,
    "dropCanceled": `\u{5D4}\u{5E9}\u{5D7}\u{5E8}\u{5D5}\u{5E8} \u{5D1}\u{5D5}\u{5D8}\u{5DC}.`,
    "dropComplete": `\u{5D4}\u{5E9}\u{5D7}\u{5E8}\u{5D5}\u{5E8} \u{5D4}\u{5D5}\u{5E9}\u{5DC}\u{5DD}.`,
    "dropDescriptionKeyboard": `\u{5D4}\u{5E7}\u{5E9} \u{5E2}\u{5DC} Enter \u{5DB}\u{5D3}\u{5D9} \u{5DC}\u{5E9}\u{5D7}\u{5E8}\u{5E8}. \u{5D4}\u{5E7}\u{5E9} \u{5E2}\u{5DC} Escape \u{5DB}\u{5D3}\u{5D9} \u{5DC}\u{5D1}\u{5D8}\u{5DC} \u{5D0}\u{5EA} \u{5D4}\u{5D2}\u{5E8}\u{5D9}\u{5E8}\u{5D4}.`,
    "dropDescriptionTouch": `\u{5D4}\u{5E7}\u{5E9} \u{5E4}\u{5E2}\u{5DE}\u{5D9}\u{5D9}\u{5DD} \u{5DB}\u{5D3}\u{5D9} \u{5DC}\u{5E9}\u{5D7}\u{5E8}\u{5E8}.`,
    "dropDescriptionVirtual": `\u{5DC}\u{5D7}\u{5E5} \u{5DB}\u{5D3}\u{5D9} \u{5DC}\u{5E9}\u{5D7}\u{5E8}\u{5E8}.`,
    "dropIndicator": `\u{5DE}\u{5D7}\u{5D5}\u{5D5}\u{5DF} \u{5E9}\u{5D7}\u{5E8}\u{5D5}\u{5E8}`,
    "dropOnItem": (args)=>`\u{5E9}\u{5D7}\u{5E8}\u{5E8} \u{5E2}\u{5DC} ${args.itemText}`,
    "dropOnRoot": `\u{5E9}\u{5D7}\u{5E8}\u{5E8} \u{5E2}\u{5DC}`,
    "endDragKeyboard": `\u{5D2}\u{5D5}\u{5E8}\u{5E8}. \u{5D4}\u{5E7}\u{5E9} \u{5E2}\u{5DC} Enter \u{5DB}\u{5D3}\u{5D9} \u{5DC}\u{5D1}\u{5D8}\u{5DC} \u{5D0}\u{5EA} \u{5D4}\u{5D2}\u{5E8}\u{5D9}\u{5E8}\u{5D4}.`,
    "endDragTouch": `\u{5D2}\u{5D5}\u{5E8}\u{5E8}. \u{5D4}\u{5E7}\u{5E9} \u{5E4}\u{5E2}\u{5DE}\u{5D9}\u{5D9}\u{5DD} \u{5DB}\u{5D3}\u{5D9} \u{5DC}\u{5D1}\u{5D8}\u{5DC} \u{5D0}\u{5EA} \u{5D4}\u{5D2}\u{5E8}\u{5D9}\u{5E8}\u{5D4}.`,
    "endDragVirtual": `\u{5D2}\u{5D5}\u{5E8}\u{5E8}. \u{5DC}\u{5D7}\u{5E5} \u{5DB}\u{5D3}\u{5D9} \u{5DC}\u{5D1}\u{5D8}\u{5DC} \u{5D0}\u{5EA} \u{5D4}\u{5D2}\u{5E8}\u{5D9}\u{5E8}\u{5D4}.`,
    "insertAfter": (args)=>`\u{5D4}\u{5D5}\u{5E1}\u{5E3} \u{5D0}\u{5D7}\u{5E8}\u{5D9} ${args.itemText}`,
    "insertBefore": (args)=>`\u{5D4}\u{5D5}\u{5E1}\u{5E3} \u{5DC}\u{5E4}\u{5E0}\u{5D9} ${args.itemText}`,
    "insertBetween": (args)=>`\u{5D4}\u{5D5}\u{5E1}\u{5E3} \u{5D1}\u{5D9}\u{5DF} ${args.beforeItemText} \u{5DC}\u{5D1}\u{5D9}\u{5DF} ${args.afterItemText}`
};


export {$c12113928ede4b50$exports as default};
//# sourceMappingURL=he-IL.js.map
