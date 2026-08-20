var $84b9a0dfd5fd7f14$exports = {};
$84b9a0dfd5fd7f14$exports = {
    "dragDescriptionKeyboard": `Enter \u{30AD}\u{30FC}\u{3092}\u{62BC}\u{3057}\u{3066}\u{30C9}\u{30E9}\u{30C3}\u{30B0}\u{3092}\u{958B}\u{59CB}\u{3057}\u{3066}\u{304F}\u{3060}\u{3055}\u{3044}\u{3002}`,
    "dragDescriptionKeyboardAlt": `Alt+Enter \u{30AD}\u{30FC}\u{3092}\u{62BC}\u{3057}\u{3066}\u{30C9}\u{30E9}\u{30C3}\u{30B0}\u{3092}\u{958B}\u{59CB}\u{3057}\u{307E}\u{3059}\u{3002}`,
    "dragDescriptionLongPress": `\u{9577}\u{62BC}\u{3057}\u{3057}\u{3066}\u{30C9}\u{30E9}\u{30C3}\u{30B0}\u{3092}\u{958B}\u{59CB}\u{3057}\u{307E}\u{3059}\u{3002}`,
    "dragDescriptionTouch": `\u{30C0}\u{30D6}\u{30EB}\u{30BF}\u{30C3}\u{30D7}\u{3057}\u{3066}\u{30C9}\u{30E9}\u{30C3}\u{30B0}\u{3092}\u{958B}\u{59CB}\u{3057}\u{307E}\u{3059}\u{3002}`,
    "dragDescriptionVirtual": `\u{30AF}\u{30EA}\u{30C3}\u{30AF}\u{3057}\u{3066}\u{30C9}\u{30E9}\u{30C3}\u{30B0}\u{3092}\u{958B}\u{59CB}\u{3057}\u{307E}\u{3059}\u{3002}`,
    "dragItem": (args)=>`${args.itemText} \u{3092}\u{30C9}\u{30E9}\u{30C3}\u{30B0}`,
    "dragSelectedItems": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} \u{500B}\u{306E}\u{9078}\u{629E}\u{9805}\u{76EE}`,
            other: ()=>`${formatter.number(args.count)} \u{500B}\u{306E}\u{9078}\u{629E}\u{9805}\u{76EE}`
        })} \u{3092}\u{30C9}\u{30E9}\u{30C3}\u{30B0}`,
    "dragSelectedKeyboard": (args, formatter)=>`Enter \u{30AD}\u{30FC}\u{3092}\u{62BC}\u{3057}\u{3066}\u{3001}${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} \u{9078}\u{629E}\u{3057}\u{305F}\u{9805}\u{76EE}`,
            other: ()=>`${formatter.number(args.count)} \u{9078}\u{629E}\u{3057}\u{305F}\u{9805}\u{76EE}`
        })}\u{3092}\u{30C9}\u{30E9}\u{30C3}\u{30B0}\u{3057}\u{307E}\u{3059}\u{3002}`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Alt+Enter \u{30AD}\u{30FC}\u{3092}\u{62BC}\u{3057}\u{3066}\u{3001}${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} \u{9078}\u{629E}\u{3057}\u{305F}\u{9805}\u{76EE}`,
            other: ()=>`${formatter.number(args.count)} \u{9078}\u{629E}\u{3057}\u{305F}\u{9805}\u{76EE}`
        })}\u{3092}\u{30C9}\u{30E9}\u{30C3}\u{30B0}\u{3057}\u{307E}\u{3059}\u{3002}`,
    "dragSelectedLongPress": (args, formatter)=>`\u{9577}\u{62BC}\u{3057}\u{3057}\u{3066}\u{3001}${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} \u{9078}\u{629E}\u{3057}\u{305F}\u{9805}\u{76EE}`,
            other: ()=>`${formatter.number(args.count)} \u{9078}\u{629E}\u{3057}\u{305F}\u{9805}\u{76EE}`
        })}\u{3092}\u{30C9}\u{30E9}\u{30C3}\u{30B0}\u{3057}\u{307E}\u{3059}\u{3002}`,
    "dragStartedKeyboard": `\u{30C9}\u{30E9}\u{30C3}\u{30B0}\u{3092}\u{958B}\u{59CB}\u{3057}\u{307E}\u{3059}\u{3002}Tab \u{30AD}\u{30FC}\u{3092}\u{62BC}\u{3057}\u{3066}\u{30C9}\u{30ED}\u{30C3}\u{30D7}\u{30BF}\u{30FC}\u{30B2}\u{30C3}\u{30C8}\u{306B}\u{3044}\u{3069}\u{3046}\u{3057}\u{3001}Enter \u{30AD}\u{30FC}\u{3092}\u{62BC}\u{3057}\u{3066}\u{30C9}\u{30ED}\u{30C3}\u{30D7}\u{3059}\u{308B}\u{304B}\u{3001}Esc \u{30AD}\u{30FC}\u{3092}\u{62BC}\u{3057}\u{3066}\u{30AD}\u{30E3}\u{30F3}\u{30BB}\u{30EB}\u{3057}\u{307E}\u{3059}\u{3002}`,
    "dragStartedTouch": `\u{30C9}\u{30E9}\u{30C3}\u{30B0}\u{3092}\u{958B}\u{59CB}\u{3057}\u{307E}\u{3057}\u{305F}\u{3002}\u{30C9}\u{30ED}\u{30C3}\u{30D7}\u{306E}\u{30BF}\u{30FC}\u{30B2}\u{30C3}\u{30C8}\u{306B}\u{79FB}\u{52D5}\u{3057}\u{3001}\u{30C0}\u{30D6}\u{30EB}\u{30BF}\u{30C3}\u{30D7}\u{3057}\u{3066}\u{30C9}\u{30ED}\u{30C3}\u{30D7}\u{3057}\u{307E}\u{3059}\u{3002}`,
    "dragStartedVirtual": `\u{30C9}\u{30E9}\u{30C3}\u{30B0}\u{3092}\u{958B}\u{59CB}\u{3057}\u{307E}\u{3057}\u{305F}\u{3002}\u{30C9}\u{30ED}\u{30C3}\u{30D7}\u{306E}\u{30BF}\u{30FC}\u{30B2}\u{30C3}\u{30C8}\u{306B}\u{79FB}\u{52D5}\u{3057}\u{3001}\u{30AF}\u{30EA}\u{30C3}\u{30AF}\u{307E}\u{305F}\u{306F} Enter \u{30AD}\u{30FC}\u{3092}\u{62BC}\u{3057}\u{3066}\u{30C9}\u{30ED}\u{30C3}\u{30D7}\u{3057}\u{307E}\u{3059}\u{3002}`,
    "dropCanceled": `\u{30C9}\u{30ED}\u{30C3}\u{30D7}\u{304C}\u{30AD}\u{30E3}\u{30F3}\u{30BB}\u{30EB}\u{3055}\u{308C}\u{307E}\u{3057}\u{305F}\u{3002}`,
    "dropComplete": `\u{30C9}\u{30ED}\u{30C3}\u{30D7}\u{304C}\u{5B8C}\u{4E86}\u{3057}\u{307E}\u{3057}\u{305F}\u{3002}`,
    "dropDescriptionKeyboard": `Enter \u{30AD}\u{30FC}\u{3092}\u{62BC}\u{3057}\u{3066}\u{30C9}\u{30ED}\u{30C3}\u{30D7}\u{3057}\u{307E}\u{3059}\u{3002}Esc \u{30AD}\u{30FC}\u{3092}\u{62BC}\u{3057}\u{3066}\u{30C9}\u{30E9}\u{30C3}\u{30B0}\u{3092}\u{30AD}\u{30E3}\u{30F3}\u{30BB}\u{30EB}\u{3057}\u{307E}\u{3059}\u{3002}`,
    "dropDescriptionTouch": `\u{30C0}\u{30D6}\u{30EB}\u{30BF}\u{30C3}\u{30D7}\u{3057}\u{3066}\u{30C9}\u{30ED}\u{30C3}\u{30D7}\u{3057}\u{307E}\u{3059}\u{3002}`,
    "dropDescriptionVirtual": `\u{30AF}\u{30EA}\u{30C3}\u{30AF}\u{3057}\u{3066}\u{30C9}\u{30ED}\u{30C3}\u{30D7}\u{3057}\u{307E}\u{3059}\u{3002}`,
    "dropIndicator": `\u{30C9}\u{30ED}\u{30C3}\u{30D7}\u{30A4}\u{30F3}\u{30B8}\u{30B1}\u{30FC}\u{30BF}\u{30FC}`,
    "dropOnItem": (args)=>`${args.itemText} \u{306B}\u{30C9}\u{30ED}\u{30C3}\u{30D7}`,
    "dropOnRoot": `\u{30C9}\u{30ED}\u{30C3}\u{30D7}\u{5834}\u{6240}`,
    "endDragKeyboard": `\u{30C9}\u{30E9}\u{30C3}\u{30B0}\u{3057}\u{3066}\u{3044}\u{307E}\u{3059}\u{3002}Enter \u{30AD}\u{30FC}\u{3092}\u{62BC}\u{3057}\u{3066}\u{30C9}\u{30E9}\u{30C3}\u{30B0}\u{3092}\u{30AD}\u{30E3}\u{30F3}\u{30BB}\u{30EB}\u{3057}\u{307E}\u{3059}\u{3002}`,
    "endDragTouch": `\u{30C9}\u{30E9}\u{30C3}\u{30B0}\u{3057}\u{3066}\u{3044}\u{307E}\u{3059}\u{3002}\u{30C0}\u{30D6}\u{30EB}\u{30BF}\u{30C3}\u{30D7}\u{3057}\u{3066}\u{30C9}\u{30E9}\u{30C3}\u{30B0}\u{3092}\u{30AD}\u{30E3}\u{30F3}\u{30BB}\u{30EB}\u{3057}\u{307E}\u{3059}\u{3002}`,
    "endDragVirtual": `\u{30C9}\u{30E9}\u{30C3}\u{30B0}\u{3057}\u{3066}\u{3044}\u{307E}\u{3059}\u{3002}\u{30AF}\u{30EA}\u{30C3}\u{30AF}\u{3057}\u{3066}\u{30C9}\u{30E9}\u{30C3}\u{30B0}\u{3092}\u{30AD}\u{30E3}\u{30F3}\u{30BB}\u{30EB}\u{3057}\u{307E}\u{3059}\u{3002}`,
    "insertAfter": (args)=>`${args.itemText} \u{306E}\u{5F8C}\u{306B}\u{633F}\u{5165}`,
    "insertBefore": (args)=>`${args.itemText} \u{306E}\u{524D}\u{306B}\u{633F}\u{5165}`,
    "insertBetween": (args)=>`${args.beforeItemText} \u{3068} ${args.afterItemText} \u{306E}\u{9593}\u{306B}\u{633F}\u{5165}`
};


export {$84b9a0dfd5fd7f14$exports as default};
//# sourceMappingURL=ja-JP.mjs.map
