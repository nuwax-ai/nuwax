var $7ae71cb790126b2e$exports = {};
$7ae71cb790126b2e$exports = {
    "dragItem": (args)=>`Drag ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Drag ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} selected item`,
            other: ()=>`${formatter.number(args.count)} selected items`
        })}`,
    "dragDescriptionKeyboard": `Press Enter to start dragging.`,
    "dragDescriptionKeyboardAlt": `Press Alt + Enter to start dragging.`,
    "dragDescriptionTouch": `Double tap to start dragging.`,
    "dragDescriptionVirtual": `Click to start dragging.`,
    "dragDescriptionLongPress": `Long press to start dragging.`,
    "dragSelectedKeyboard": (args, formatter)=>`Press Enter to drag ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} selected item`,
            other: ()=>`${formatter.number(args.count)} selected items`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Press Alt + Enter to drag ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} selected item`,
            other: ()=>`${formatter.number(args.count)} selected items`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Long press to drag ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} selected item`,
            other: ()=>`${formatter.number(args.count)} selected items`
        })}.`,
    "dragStartedKeyboard": `Started dragging. Press Tab to navigate to a drop target, then press Enter to drop, or press Escape to cancel.`,
    "dragStartedTouch": `Started dragging. Navigate to a drop target, then double tap to drop.`,
    "dragStartedVirtual": `Started dragging. Navigate to a drop target, then click or press Enter to drop.`,
    "endDragKeyboard": `Dragging. Press Enter to cancel drag.`,
    "endDragTouch": `Dragging. Double tap to cancel drag.`,
    "endDragVirtual": `Dragging. Click to cancel drag.`,
    "dropDescriptionKeyboard": `Press Enter to drop. Press Escape to cancel drag.`,
    "dropDescriptionTouch": `Double tap to drop.`,
    "dropDescriptionVirtual": `Click to drop.`,
    "dropCanceled": `Drop canceled.`,
    "dropComplete": `Drop complete.`,
    "dropIndicator": `drop indicator`,
    "dropOnRoot": `Drop on`,
    "dropOnItem": (args)=>`Drop on ${args.itemText}`,
    "insertBefore": (args)=>`Insert before ${args.itemText}`,
    "insertBetween": (args)=>`Insert between ${args.beforeItemText} and ${args.afterItemText}`,
    "insertAfter": (args)=>`Insert after ${args.itemText}`
};


export {$7ae71cb790126b2e$exports as default};
//# sourceMappingURL=en-US.mjs.map
