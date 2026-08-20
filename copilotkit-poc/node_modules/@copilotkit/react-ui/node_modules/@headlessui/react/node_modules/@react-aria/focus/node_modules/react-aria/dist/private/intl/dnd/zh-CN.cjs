module.exports = {
    "dragDescriptionKeyboard": `\u{6309} Enter \u{5F00}\u{59CB}\u{62D6}\u{52A8}\u{3002}`,
    "dragDescriptionKeyboardAlt": `\u{6309} Alt + Enter \u{5F00}\u{59CB}\u{62D6}\u{52A8}\u{3002}`,
    "dragDescriptionLongPress": `\u{957F}\u{6309}\u{4EE5}\u{5F00}\u{59CB}\u{62D6}\u{52A8}\u{3002}`,
    "dragDescriptionTouch": `\u{53CC}\u{51FB}\u{5F00}\u{59CB}\u{62D6}\u{52A8}\u{3002}`,
    "dragDescriptionVirtual": `\u{5355}\u{51FB}\u{5F00}\u{59CB}\u{62D6}\u{52A8}\u{3002}`,
    "dragItem": (args)=>`\u{62D6}\u{52A8} ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`\u{62D6}\u{52A8} ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} \u{9009}\u{4E2D}\u{9879}\u{76EE}`,
            other: ()=>`${formatter.number(args.count)} \u{9009}\u{4E2D}\u{9879}\u{76EE}`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`\u{6309} Enter \u{4EE5}\u{62D6}\u{52A8} ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} \u{4E2A}\u{9009}\u{5B9A}\u{9879}`,
            other: ()=>`${formatter.number(args.count)} \u{4E2A}\u{9009}\u{5B9A}\u{9879}`
        })}\u{3002}`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`\u{6309} Alt + Enter \u{4EE5}\u{62D6}\u{52A8} ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} \u{4E2A}\u{9009}\u{5B9A}\u{9879}`,
            other: ()=>`${formatter.number(args.count)} \u{4E2A}\u{9009}\u{5B9A}\u{9879}`
        })}\u{3002}`,
    "dragSelectedLongPress": (args, formatter)=>`\u{957F}\u{6309}\u{4EE5}\u{62D6}\u{52A8} ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} \u{4E2A}\u{9009}\u{5B9A}\u{9879}`,
            other: ()=>`${formatter.number(args.count)} \u{4E2A}\u{9009}\u{5B9A}\u{9879}`
        })}\u{3002}`,
    "dragStartedKeyboard": `\u{5DF2}\u{5F00}\u{59CB}\u{62D6}\u{52A8}\u{3002}\u{6309} Tab \u{5BFC}\u{822A}\u{5230}\u{653E}\u{7F6E}\u{76EE}\u{6807}\u{FF0C}\u{7136}\u{540E}\u{6309} Enter \u{653E}\u{7F6E}\u{6216}\u{6309} Escape \u{53D6}\u{6D88}\u{3002}`,
    "dragStartedTouch": `\u{5DF2}\u{5F00}\u{59CB}\u{62D6}\u{52A8}\u{3002}\u{5BFC}\u{822A}\u{5230}\u{653E}\u{7F6E}\u{76EE}\u{6807}\u{FF0C}\u{7136}\u{540E}\u{53CC}\u{51FB}\u{653E}\u{7F6E}\u{3002}`,
    "dragStartedVirtual": `\u{5DF2}\u{5F00}\u{59CB}\u{62D6}\u{52A8}\u{3002}\u{5BFC}\u{822A}\u{5230}\u{653E}\u{7F6E}\u{76EE}\u{6807}\u{FF0C}\u{7136}\u{540E}\u{5355}\u{51FB}\u{6216}\u{6309} Enter \u{653E}\u{7F6E}\u{3002}`,
    "dropCanceled": `\u{653E}\u{7F6E}\u{5DF2}\u{53D6}\u{6D88}\u{3002}`,
    "dropComplete": `\u{653E}\u{7F6E}\u{5DF2}\u{5B8C}\u{6210}\u{3002}`,
    "dropDescriptionKeyboard": `\u{6309} Enter \u{653E}\u{7F6E}\u{3002}\u{6309} Escape \u{53D6}\u{6D88}\u{62D6}\u{52A8}\u{3002}`,
    "dropDescriptionTouch": `\u{53CC}\u{51FB}\u{653E}\u{7F6E}\u{3002}`,
    "dropDescriptionVirtual": `\u{5355}\u{51FB}\u{653E}\u{7F6E}\u{3002}`,
    "dropIndicator": `\u{653E}\u{7F6E}\u{6807}\u{8BB0}`,
    "dropOnItem": (args)=>`\u{653E}\u{7F6E}\u{4E8E} ${args.itemText}`,
    "dropOnRoot": `\u{653E}\u{7F6E}\u{4E8E}`,
    "endDragKeyboard": `\u{6B63}\u{5728}\u{62D6}\u{52A8}\u{3002}\u{6309} Enter \u{53D6}\u{6D88}\u{62D6}\u{52A8}\u{3002}`,
    "endDragTouch": `\u{6B63}\u{5728}\u{62D6}\u{52A8}\u{3002}\u{53CC}\u{51FB}\u{53D6}\u{6D88}\u{62D6}\u{52A8}\u{3002}`,
    "endDragVirtual": `\u{6B63}\u{5728}\u{62D6}\u{52A8}\u{3002}\u{5355}\u{51FB}\u{53D6}\u{6D88}\u{62D6}\u{52A8}\u{3002}`,
    "insertAfter": (args)=>`\u{63D2}\u{5165}\u{5230} ${args.itemText} \u{4E4B}\u{540E}`,
    "insertBefore": (args)=>`\u{63D2}\u{5165}\u{5230} ${args.itemText} \u{4E4B}\u{524D}`,
    "insertBetween": (args)=>`\u{63D2}\u{5165}\u{5230} ${args.beforeItemText} \u{548C} ${args.afterItemText} \u{4E4B}\u{95F4}`
};


//# sourceMappingURL=zh-CN.cjs.map
