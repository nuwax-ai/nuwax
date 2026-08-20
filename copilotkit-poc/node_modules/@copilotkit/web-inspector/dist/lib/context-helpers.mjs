//#region src/lib/context-helpers.ts
function updateSizeFromElement(state, element, fallback) {
	const rect = element.getBoundingClientRect();
	state.size = {
		width: rect.width || fallback.width,
		height: rect.height || fallback.height
	};
}
function clampSize(size, viewport, edgeMargin, minWidth, minHeight) {
	const maxWidth = Math.max(minWidth, viewport.width - edgeMargin * 2);
	const maxHeight = Math.max(minHeight, viewport.height - edgeMargin * 2);
	return {
		width: clamp(size.width, minWidth, maxWidth),
		height: clamp(size.height, minHeight, maxHeight)
	};
}
function constrainToViewport(state, position, viewport, edgeMargin) {
	const maxX = Math.max(edgeMargin, viewport.width - state.size.width - edgeMargin);
	const maxY = Math.max(edgeMargin, viewport.height - state.size.height - edgeMargin);
	return {
		x: clamp(position.x, edgeMargin, maxX),
		y: clamp(position.y, edgeMargin, maxY)
	};
}
function keepPositionWithinViewport(state, viewport, edgeMargin) {
	state.position = constrainToViewport(state, state.position, viewport, edgeMargin);
}
function centerContext(state, viewport, edgeMargin) {
	state.position = constrainToViewport(state, {
		x: Math.round((viewport.width - state.size.width) / 2),
		y: Math.round((viewport.height - state.size.height) / 2)
	}, viewport, edgeMargin);
	updateAnchorFromPosition(state, viewport, edgeMargin);
	return state.position;
}
function updateAnchorFromPosition(state, viewport, edgeMargin) {
	const centerX = state.position.x + state.size.width / 2;
	const centerY = state.position.y + state.size.height / 2;
	const horizontal = centerX < viewport.width / 2 ? "left" : "right";
	const vertical = centerY < viewport.height / 2 ? "top" : "bottom";
	state.anchor = {
		horizontal,
		vertical
	};
	const maxHorizontalOffset = Math.max(edgeMargin, viewport.width - state.size.width - edgeMargin);
	const maxVerticalOffset = Math.max(edgeMargin, viewport.height - state.size.height - edgeMargin);
	state.anchorOffset = {
		x: horizontal === "left" ? clamp(state.position.x, edgeMargin, maxHorizontalOffset) : clamp(viewport.width - state.position.x - state.size.width, edgeMargin, maxHorizontalOffset),
		y: vertical === "top" ? clamp(state.position.y, edgeMargin, maxVerticalOffset) : clamp(viewport.height - state.position.y - state.size.height, edgeMargin, maxVerticalOffset)
	};
}
function applyAnchorPosition(state, viewport, edgeMargin) {
	const maxHorizontalOffset = Math.max(edgeMargin, viewport.width - state.size.width - edgeMargin);
	const maxVerticalOffset = Math.max(edgeMargin, viewport.height - state.size.height - edgeMargin);
	const horizontalOffset = clamp(state.anchorOffset.x, edgeMargin, maxHorizontalOffset);
	const verticalOffset = clamp(state.anchorOffset.y, edgeMargin, maxVerticalOffset);
	const x = state.anchor.horizontal === "left" ? horizontalOffset : viewport.width - state.size.width - horizontalOffset;
	const y = state.anchor.vertical === "top" ? verticalOffset : viewport.height - state.size.height - verticalOffset;
	state.anchorOffset = {
		x: horizontalOffset,
		y: verticalOffset
	};
	state.position = constrainToViewport(state, {
		x,
		y
	}, viewport, edgeMargin);
	return state.position;
}
function clamp(value, min, max) {
	return Math.min(Math.max(min, value), max);
}

//#endregion
export { applyAnchorPosition, centerContext, clampSize, constrainToViewport, keepPositionWithinViewport, updateAnchorFromPosition, updateSizeFromElement };
//# sourceMappingURL=context-helpers.mjs.map