var $1906894d3e5406da$exports = {};
$1906894d3e5406da$exports = {
    "dragDescriptionKeyboard": `\u{B4DC}\u{B798}\u{ADF8}\u{B97C} \u{C2DC}\u{C791}\u{D558}\u{B824}\u{BA74} Enter\u{B97C} \u{B204}\u{B974}\u{C138}\u{C694}.`,
    "dragDescriptionKeyboardAlt": `\u{B4DC}\u{B798}\u{ADF8}\u{B97C} \u{C2DC}\u{C791}\u{D558}\u{B824}\u{BA74} Alt + Enter\u{B97C} \u{B204}\u{B974}\u{C2ED}\u{C2DC}\u{C624}.`,
    "dragDescriptionLongPress": `\u{B4DC}\u{B798}\u{ADF8}\u{B97C} \u{C2DC}\u{C791}\u{D558}\u{B824}\u{BA74} \u{AE38}\u{AC8C} \u{B204}\u{B974}\u{C2ED}\u{C2DC}\u{C624}.`,
    "dragDescriptionTouch": `\u{B4DC}\u{B798}\u{ADF8}\u{B97C} \u{C2DC}\u{C791}\u{D558}\u{B824}\u{BA74} \u{B354}\u{BE14} \u{D0ED}\u{D558}\u{C138}\u{C694}.`,
    "dragDescriptionVirtual": `\u{B4DC}\u{B798}\u{ADF8}\u{B97C} \u{C2DC}\u{C791}\u{D558}\u{B824}\u{BA74} \u{D074}\u{B9AD}\u{D558}\u{C138}\u{C694}.`,
    "dragItem": (args)=>`${args.itemText} \u{B4DC}\u{B798}\u{ADF8}`,
    "dragSelectedItems": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)}\u{AC1C} \u{C120}\u{D0DD} \u{D56D}\u{BAA9}`,
            other: ()=>`${formatter.number(args.count)}\u{AC1C} \u{C120}\u{D0DD} \u{D56D}\u{BAA9}`
        })} \u{B4DC}\u{B798}\u{ADF8}`,
    "dragSelectedKeyboard": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)}\u{AC1C} \u{C120}\u{D0DD} \u{D56D}\u{BAA9}`,
            other: ()=>`${formatter.number(args.count)}\u{AC1C} \u{C120}\u{D0DD} \u{D56D}\u{BAA9}`
        })}\u{C744} \u{B4DC}\u{B798}\u{ADF8}\u{D558}\u{B824}\u{BA74} Enter\u{B97C} \u{B204}\u{B974}\u{C2ED}\u{C2DC}\u{C624}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)}\u{AC1C} \u{C120}\u{D0DD} \u{D56D}\u{BAA9}`,
            other: ()=>`${formatter.number(args.count)}\u{AC1C} \u{C120}\u{D0DD} \u{D56D}\u{BAA9}`
        })}\u{C744} \u{B4DC}\u{B798}\u{ADF8}\u{D558}\u{B824}\u{BA74} Alt + Enter\u{B97C} \u{B204}\u{B974}\u{C2ED}\u{C2DC}\u{C624}.`,
    "dragSelectedLongPress": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)}\u{AC1C} \u{C120}\u{D0DD} \u{D56D}\u{BAA9}`,
            other: ()=>`${formatter.number(args.count)}\u{AC1C} \u{C120}\u{D0DD} \u{D56D}\u{BAA9}`
        })}\u{C744} \u{B4DC}\u{B798}\u{ADF8}\u{D558}\u{B824}\u{BA74} \u{AE38}\u{AC8C} \u{B204}\u{B974}\u{C2ED}\u{C2DC}\u{C624}.`,
    "dragStartedKeyboard": `\u{B4DC}\u{B798}\u{ADF8}\u{AC00} \u{C2DC}\u{C791}\u{B418}\u{C5C8}\u{C2B5}\u{B2C8}\u{B2E4}. Tab\u{C744} \u{B20C}\u{B7EC} \u{B4DC}\u{B86D} \u{B300}\u{C0C1}\u{C73C}\u{B85C} \u{C774}\u{B3D9}\u{D55C} \u{B2E4}\u{C74C} Enter\u{B97C} \u{B20C}\u{B7EC} \u{B4DC}\u{B86D}\u{D558}\u{AC70}\u{B098} Esc\u{B97C} \u{B20C}\u{B7EC} \u{CDE8}\u{C18C}\u{D558}\u{C138}\u{C694}.`,
    "dragStartedTouch": `\u{B4DC}\u{B798}\u{ADF8}\u{AC00} \u{C2DC}\u{C791}\u{B418}\u{C5C8}\u{C2B5}\u{B2C8}\u{B2E4}. \u{B4DC}\u{B86D} \u{B300}\u{C0C1}\u{C73C}\u{B85C} \u{C774}\u{B3D9}\u{D55C} \u{B2E4}\u{C74C} \u{B354}\u{BE14} \u{D0ED}\u{D558}\u{C5EC} \u{B4DC}\u{B86D}\u{D558}\u{C138}\u{C694}.`,
    "dragStartedVirtual": `\u{B4DC}\u{B798}\u{ADF8}\u{AC00} \u{C2DC}\u{C791}\u{B418}\u{C5C8}\u{C2B5}\u{B2C8}\u{B2E4}. \u{B4DC}\u{B86D} \u{B300}\u{C0C1}\u{C73C}\u{B85C} \u{C774}\u{B3D9}\u{D55C} \u{B2E4}\u{C74C} \u{D074}\u{B9AD}\u{D558}\u{AC70}\u{B098} Enter\u{B97C} \u{B20C}\u{B7EC} \u{B4DC}\u{B86D}\u{D558}\u{C138}\u{C694}.`,
    "dropCanceled": `\u{B4DC}\u{B86D}\u{C774} \u{CDE8}\u{C18C}\u{B418}\u{C5C8}\u{C2B5}\u{B2C8}\u{B2E4}.`,
    "dropComplete": `\u{B4DC}\u{B86D}\u{C774} \u{C644}\u{B8CC}\u{B418}\u{C5C8}\u{C2B5}\u{B2C8}\u{B2E4}.`,
    "dropDescriptionKeyboard": `\u{B4DC}\u{B86D}\u{D558}\u{B824}\u{BA74} Enter\u{B97C} \u{B204}\u{B974}\u{C138}\u{C694}. \u{B4DC}\u{B798}\u{ADF8}\u{B97C} \u{CDE8}\u{C18C}\u{D558}\u{B824}\u{BA74} Esc\u{B97C} \u{B204}\u{B974}\u{C138}\u{C694}.`,
    "dropDescriptionTouch": `\u{B354}\u{BE14} \u{D0ED}\u{D558}\u{C5EC} \u{B4DC}\u{B86D}\u{D558}\u{C138}\u{C694}.`,
    "dropDescriptionVirtual": `\u{B4DC}\u{B86D}\u{D558}\u{B824}\u{BA74} \u{D074}\u{B9AD}\u{D558}\u{C138}\u{C694}.`,
    "dropIndicator": `\u{B4DC}\u{B86D} \u{D45C}\u{C2DC}\u{AE30}`,
    "dropOnItem": (args)=>`${args.itemText}\u{C5D0} \u{B4DC}\u{B86D}`,
    "dropOnRoot": `\u{B4DC}\u{B86D} \u{B300}\u{C0C1}`,
    "endDragKeyboard": `\u{B4DC}\u{B798}\u{ADF8} \u{C911}\u{C785}\u{B2C8}\u{B2E4}. \u{B4DC}\u{B798}\u{ADF8}\u{B97C} \u{CDE8}\u{C18C}\u{D558}\u{B824}\u{BA74} Enter\u{B97C} \u{B204}\u{B974}\u{C138}\u{C694}.`,
    "endDragTouch": `\u{B4DC}\u{B798}\u{ADF8} \u{C911}\u{C785}\u{B2C8}\u{B2E4}. \u{B4DC}\u{B798}\u{ADF8}\u{B97C} \u{CDE8}\u{C18C}\u{D558}\u{B824}\u{BA74} \u{B354}\u{BE14} \u{D0ED}\u{D558}\u{C138}\u{C694}.`,
    "endDragVirtual": `\u{B4DC}\u{B798}\u{ADF8} \u{C911}\u{C785}\u{B2C8}\u{B2E4}. \u{B4DC}\u{B798}\u{ADF8}\u{B97C} \u{CDE8}\u{C18C}\u{D558}\u{B824}\u{BA74} \u{D074}\u{B9AD}\u{D558}\u{C138}\u{C694}.`,
    "insertAfter": (args)=>`${args.itemText} \u{C774}\u{D6C4}\u{C5D0} \u{C0BD}\u{C785}`,
    "insertBefore": (args)=>`${args.itemText} \u{C774}\u{C804}\u{C5D0} \u{C0BD}\u{C785}`,
    "insertBetween": (args)=>`${args.beforeItemText} \u{BC0F} ${args.afterItemText} \u{C0AC}\u{C774}\u{C5D0} \u{C0BD}\u{C785}`
};


export {$1906894d3e5406da$exports as default};
//# sourceMappingURL=ko-KR.mjs.map
