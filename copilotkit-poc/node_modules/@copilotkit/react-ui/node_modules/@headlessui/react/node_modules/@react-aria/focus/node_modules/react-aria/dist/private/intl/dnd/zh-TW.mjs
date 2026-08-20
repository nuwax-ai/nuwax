var $ab510bd61e13106c$exports = {};
$ab510bd61e13106c$exports = {
    "dragDescriptionKeyboard": `\u{6309} Enter \u{9375}\u{4EE5}\u{958B}\u{59CB}\u{62D6}\u{66F3}\u{3002}`,
    "dragDescriptionKeyboardAlt": `\u{6309} Alt+Enter \u{9375}\u{4EE5}\u{958B}\u{59CB}\u{62D6}\u{66F3}\u{3002}`,
    "dragDescriptionLongPress": `\u{9577}\u{6309}\u{4EE5}\u{958B}\u{59CB}\u{62D6}\u{66F3}\u{3002}`,
    "dragDescriptionTouch": `\u{8F15}\u{9EDE}\u{5169}\u{4E0B}\u{4EE5}\u{958B}\u{59CB}\u{62D6}\u{66F3}\u{3002}`,
    "dragDescriptionVirtual": `\u{6309}\u{4E00}\u{4E0B}\u{6ED1}\u{9F20}\u{4EE5}\u{958B}\u{59CB}\u{62D6}\u{66F3}\u{3002}`,
    "dragItem": (args)=>`\u{62D6}\u{66F3}\u{300C}${args.itemText}\u{300D}`,
    "dragSelectedItems": (args, formatter)=>`\u{62D6}\u{66F3} ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} \u{500B}\u{9078}\u{5B9A}\u{9805}\u{76EE}`,
            other: ()=>`${formatter.number(args.count)} \u{500B}\u{9078}\u{5B9A}\u{9805}\u{76EE}`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`\u{6309} Enter \u{9375}\u{4EE5}\u{62D6}\u{66F3} ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} \u{500B}\u{9078}\u{5B9A}\u{9805}\u{76EE}`,
            other: ()=>`${formatter.number(args.count)} \u{500B}\u{9078}\u{5B9A}\u{9805}\u{76EE}`
        })}\u{3002}`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`\u{6309} Alt+Enter \u{9375}\u{4EE5}\u{62D6}\u{66F3} ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} \u{500B}\u{9078}\u{5B9A}\u{9805}\u{76EE}`,
            other: ()=>`${formatter.number(args.count)} \u{500B}\u{9078}\u{5B9A}\u{9805}\u{76EE}`
        })}\u{3002}`,
    "dragSelectedLongPress": (args, formatter)=>`\u{9577}\u{6309}\u{4EE5}\u{62D6}\u{66F3} ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} \u{500B}\u{9078}\u{5B9A}\u{9805}\u{76EE}`,
            other: ()=>`${formatter.number(args.count)} \u{500B}\u{9078}\u{5B9A}\u{9805}\u{76EE}`
        })}\u{3002}`,
    "dragStartedKeyboard": `\u{5DF2}\u{958B}\u{59CB}\u{62D6}\u{66F3}\u{3002}\u{6309} Tab \u{9375}\u{4EE5}\u{700F}\u{89BD}\u{81F3}\u{653E}\u{7F6E}\u{76EE}\u{6A19}\u{FF0C}\u{7136}\u{5F8C}\u{6309} Enter \u{9375}\u{4EE5}\u{653E}\u{7F6E}\u{FF0C}\u{6216}\u{6309} Escape \u{9375}\u{4EE5}\u{53D6}\u{6D88}\u{3002}`,
    "dragStartedTouch": `\u{5DF2}\u{958B}\u{59CB}\u{62D6}\u{66F3}\u{3002}\u{700F}\u{89BD}\u{81F3}\u{653E}\u{7F6E}\u{76EE}\u{6A19}\u{FF0C}\u{7136}\u{5F8C}\u{8F15}\u{9EDE}\u{5169}\u{4E0B}\u{4EE5}\u{653E}\u{7F6E}\u{3002}`,
    "dragStartedVirtual": `\u{5DF2}\u{958B}\u{59CB}\u{62D6}\u{66F3}\u{3002}\u{700F}\u{89BD}\u{81F3}\u{653E}\u{7F6E}\u{76EE}\u{6A19}\u{FF0C}\u{7136}\u{5F8C}\u{6309}\u{4E00}\u{4E0B}\u{6ED1}\u{9F20}\u{6216}\u{6309} Enter \u{9375}\u{4EE5}\u{653E}\u{7F6E}\u{3002}`,
    "dropCanceled": `\u{653E}\u{7F6E}\u{5DF2}\u{53D6}\u{6D88}\u{3002}`,
    "dropComplete": `\u{653E}\u{7F6E}\u{5DF2}\u{5B8C}\u{6210}\u{3002}`,
    "dropDescriptionKeyboard": `\u{6309} Enter \u{9375}\u{4EE5}\u{653E}\u{7F6E}\u{3002}\u{6309} Escape \u{9375}\u{4EE5}\u{53D6}\u{6D88}\u{62D6}\u{66F3}\u{3002}`,
    "dropDescriptionTouch": `\u{8F15}\u{9EDE}\u{5169}\u{4E0B}\u{4EE5}\u{653E}\u{7F6E}\u{3002}`,
    "dropDescriptionVirtual": `\u{6309}\u{4E00}\u{4E0B}\u{6ED1}\u{9F20}\u{4EE5}\u{653E}\u{7F6E}\u{3002}`,
    "dropIndicator": `\u{653E}\u{7F6E}\u{6307}\u{793A}\u{5668}`,
    "dropOnItem": (args)=>`\u{653E}\u{7F6E}\u{5728}\u{300C}${args.itemText}\u{300D}\u{4E0A}`,
    "dropOnRoot": `\u{653E}\u{7F6E}\u{5728}`,
    "endDragKeyboard": `\u{62D6}\u{66F3}\u{4E2D}\u{3002}\u{6309} Enter \u{9375}\u{4EE5}\u{53D6}\u{6D88}\u{62D6}\u{66F3}\u{3002}`,
    "endDragTouch": `\u{62D6}\u{66F3}\u{4E2D}\u{3002}\u{8F15}\u{9EDE}\u{5169}\u{4E0B}\u{4EE5}\u{53D6}\u{6D88}\u{62D6}\u{66F3}\u{3002}`,
    "endDragVirtual": `\u{62D6}\u{66F3}\u{4E2D}\u{3002}\u{6309}\u{4E00}\u{4E0B}\u{6ED1}\u{9F20}\u{4EE5}\u{53D6}\u{6D88}\u{62D6}\u{66F3}\u{3002}`,
    "insertAfter": (args)=>`\u{63D2}\u{5165}\u{81F3}\u{300C}${args.itemText}\u{300D}\u{4E4B}\u{5F8C}`,
    "insertBefore": (args)=>`\u{63D2}\u{5165}\u{81F3}\u{300C}${args.itemText}\u{300D}\u{4E4B}\u{524D}`,
    "insertBetween": (args)=>`\u{63D2}\u{5165}\u{81F3}\u{300C}${args.beforeItemText}\u{300D}\u{548C}\u{300C}${args.afterItemText}\u{300D}\u{4E4B}\u{9593}`
};


export {$ab510bd61e13106c$exports as default};
//# sourceMappingURL=zh-TW.mjs.map
