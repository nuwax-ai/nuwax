import {isWebKit as $2add3ce32c6007eb$export$78551043582a6a98} from "../utils/platform.mjs";
import {nodeContains as $23f2114a1b82827e$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.mjs";
import {clamp as $c49fX$clamp} from "react-stately/private/utils/number";

/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 


const $954926fb6168ae2a$var$AXIS = {
    top: 'top',
    bottom: 'top',
    left: 'left',
    right: 'left'
};
const $954926fb6168ae2a$var$FLIPPED_DIRECTION = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left'
};
const $954926fb6168ae2a$var$CROSS_AXIS = {
    top: 'left',
    left: 'top'
};
const $954926fb6168ae2a$var$AXIS_SIZE = {
    top: 'height',
    left: 'width'
};
const $954926fb6168ae2a$var$TOTAL_SIZE = {
    width: 'totalWidth',
    height: 'totalHeight'
};
const $954926fb6168ae2a$var$PARSED_PLACEMENT_CACHE = {};
let $954926fb6168ae2a$var$getVisualViewport = ()=>typeof document !== 'undefined' ? window.visualViewport : null;
function $954926fb6168ae2a$var$getContainerDimensions(containerNode, visualViewport) {
    let width = 0, height = 0, totalWidth = 0, totalHeight = 0, top = 0, left = 0;
    let scroll = {};
    let isPinchZoomedIn = (visualViewport?.scale ?? 1) > 1;
    // In the case where the container is `html` or `body` and the container doesn't have something like `position: relative`,
    // then position absolute will be positioned relative to the viewport, also known as the `initial containing block`.
    // That's why we use the visual viewport instead.
    if (containerNode.tagName === 'BODY' || containerNode.tagName === 'HTML') {
        let documentElement = document.documentElement;
        totalWidth = documentElement.clientWidth;
        totalHeight = documentElement.clientHeight;
        width = visualViewport?.width ?? totalWidth;
        height = visualViewport?.height ?? totalHeight;
        scroll.top = documentElement.scrollTop || containerNode.scrollTop;
        scroll.left = documentElement.scrollLeft || containerNode.scrollLeft;
        // The goal of the below is to get a top/left value that represents the top/left of the visual viewport with
        // respect to the layout viewport origin. This combined with the scrollTop/scrollLeft will allow us to calculate
        // coordinates/values with respect to the visual viewport or with respect to the layout viewport.
        if (visualViewport) {
            top = visualViewport.offsetTop;
            left = visualViewport.offsetLeft;
        }
    } else {
        ({ width: width, height: height, top: top, left: left } = $954926fb6168ae2a$var$getOffset(containerNode, false));
        scroll.top = containerNode.scrollTop;
        scroll.left = containerNode.scrollLeft;
        totalWidth = width;
        totalHeight = height;
    }
    if ((0, $2add3ce32c6007eb$export$78551043582a6a98)() && (containerNode.tagName === 'BODY' || containerNode.tagName === 'HTML') && isPinchZoomedIn) {
        // Safari will report a non-zero scrollTop/Left for the non-scrolling body/HTML element when pinch zoomed in unlike other browsers.
        // Set to zero for parity calculations so we get consistent positioning of overlays across all browsers.
        // Also switch to visualViewport.pageTop/pageLeft so that we still accomodate for scroll positioning for body/HTML elements that are actually scrollable
        // before pinch zoom happens
        scroll.top = 0;
        scroll.left = 0;
        top = visualViewport?.pageTop ?? 0;
        left = visualViewport?.pageLeft ?? 0;
    }
    return {
        width: width,
        height: height,
        totalWidth: totalWidth,
        totalHeight: totalHeight,
        scroll: scroll,
        top: top,
        left: left
    };
}
function $954926fb6168ae2a$var$getScroll(node) {
    return {
        top: node.scrollTop,
        left: node.scrollLeft,
        width: node.scrollWidth,
        height: node.scrollHeight
    };
}
// Determines the amount of space required when moving the overlay to ensure it remains in the boundary
function $954926fb6168ae2a$var$getDelta(axis, offset, size, // The dimensions of the boundary element that the popover is
// positioned within (most of the time this is the <body>).
boundaryDimensions, // The dimensions of the containing block element that the popover is
// positioned relative to (e.g. parent with position: relative).
// Usually this is the same as the boundary element, but if the popover
// is portaled somewhere other than the body and has an ancestor with
// position: relative/absolute, it will be different.
containerDimensions, padding, containerOffsetWithBoundary) {
    let containerScroll = containerDimensions.scroll[axis] ?? 0;
    // The height/width of the boundary. Matches the axis along which we are adjusting the overlay position
    let boundarySize = boundaryDimensions[$954926fb6168ae2a$var$AXIS_SIZE[axis]];
    // Calculate the edges of the boundary (accomodating for the boundary padding) and the edges of the overlay.
    // Note that these values are with respect to the visual viewport (aka 0,0 is the top left of the viewport)
    let boundaryStartEdge = containerOffsetWithBoundary[axis] + boundaryDimensions.scroll[$954926fb6168ae2a$var$AXIS[axis]] + padding;
    let boundaryEndEdge = containerOffsetWithBoundary[axis] + boundaryDimensions.scroll[$954926fb6168ae2a$var$AXIS[axis]] + boundarySize - padding;
    // transformed value of the left edge of the overlay
    let startEdgeOffset = offset - containerScroll + boundaryDimensions.scroll[$954926fb6168ae2a$var$AXIS[axis]] + containerOffsetWithBoundary[axis] - boundaryDimensions[$954926fb6168ae2a$var$AXIS[axis]];
    // transformed value of the right edge of the overlay
    let endEdgeOffset = offset - containerScroll + size + boundaryDimensions.scroll[$954926fb6168ae2a$var$AXIS[axis]] + containerOffsetWithBoundary[axis] - boundaryDimensions[$954926fb6168ae2a$var$AXIS[axis]];
    // If any of the overlay edges falls outside of the boundary, shift the overlay the required amount to align one of the overlay's
    // edges with the closest boundary edge.
    if (startEdgeOffset < boundaryStartEdge) return boundaryStartEdge - startEdgeOffset;
    else if (endEdgeOffset > boundaryEndEdge) return Math.max(boundaryEndEdge - endEdgeOffset, boundaryStartEdge - startEdgeOffset);
    else return 0;
}
function $954926fb6168ae2a$var$getMargins(node) {
    let style = window.getComputedStyle(node);
    return {
        top: parseInt(style.marginTop, 10) || 0,
        bottom: parseInt(style.marginBottom, 10) || 0,
        left: parseInt(style.marginLeft, 10) || 0,
        right: parseInt(style.marginRight, 10) || 0
    };
}
function $954926fb6168ae2a$var$parsePlacement(input) {
    if ($954926fb6168ae2a$var$PARSED_PLACEMENT_CACHE[input]) return $954926fb6168ae2a$var$PARSED_PLACEMENT_CACHE[input];
    let [placement, crossPlacement] = input.split(' ');
    let axis = $954926fb6168ae2a$var$AXIS[placement] || 'right';
    let crossAxis = $954926fb6168ae2a$var$CROSS_AXIS[axis];
    if (!$954926fb6168ae2a$var$AXIS[crossPlacement]) crossPlacement = 'center';
    let size = $954926fb6168ae2a$var$AXIS_SIZE[axis];
    let crossSize = $954926fb6168ae2a$var$AXIS_SIZE[crossAxis];
    $954926fb6168ae2a$var$PARSED_PLACEMENT_CACHE[input] = {
        placement: placement,
        crossPlacement: crossPlacement,
        axis: axis,
        crossAxis: crossAxis,
        size: size,
        crossSize: crossSize
    };
    return $954926fb6168ae2a$var$PARSED_PLACEMENT_CACHE[input];
}
function $954926fb6168ae2a$var$computePosition(childOffset, boundaryDimensions, overlaySize, placementInfo, offset, crossOffset, containerOffsetWithBoundary, isContainerPositioned, arrowSize, arrowBoundaryOffset, containerDimensions) {
    let { placement: placement, crossPlacement: crossPlacement, axis: axis, crossAxis: crossAxis, size: size, crossSize: crossSize } = placementInfo;
    let position = {};
    // button position
    position[crossAxis] = childOffset[crossAxis] ?? 0;
    if (crossPlacement === 'center') //  + (button size / 2) - (overlay size / 2)
    // at this point the overlay center should match the button center
    position[crossAxis] += ((childOffset[crossSize] ?? 0) - (overlaySize[crossSize] ?? 0)) / 2;
    else if (crossPlacement !== crossAxis) //  + (button size) - (overlay size)
    // at this point the overlay bottom should match the button bottom
    position[crossAxis] += (childOffset[crossSize] ?? 0) - (overlaySize[crossSize] ?? 0);
     /* else {
    the overlay top should match the button top
  } */ 
    position[crossAxis] += crossOffset;
    // overlay top or left overlapping arrow with button bottom or right
    const minPosition = childOffset[crossAxis] - overlaySize[crossSize] + arrowSize + arrowBoundaryOffset;
    // overlay bottom or right overlapping arrow with button top or left
    const maxPosition = childOffset[crossAxis] + childOffset[crossSize] - arrowSize - arrowBoundaryOffset;
    position[crossAxis] = (0, $c49fX$clamp)(position[crossAxis], minPosition, maxPosition);
    // Floor these so the position isn't placed on a partial pixel, only whole pixels. Shouldn't matter if it was floored or ceiled, so chose one.
    if (placement === axis) {
        // If the container is positioned (non-static), then we use the container's actual
        // height, as `bottom` will be relative to this height.  But if the container is static,
        // then it can only be the `document.body`, and `bottom` will be relative to _its_
        // container.
        let containerHeight = isContainerPositioned ? containerDimensions[size] : containerDimensions[$954926fb6168ae2a$var$TOTAL_SIZE[size]];
        position[$954926fb6168ae2a$var$FLIPPED_DIRECTION[axis]] = Math.floor(containerHeight - childOffset[axis] + offset);
    } else position[axis] = Math.floor(childOffset[axis] + childOffset[size] + offset);
    return position;
}
function $954926fb6168ae2a$var$getMaxHeight(position, boundaryDimensions, containerOffsetWithBoundary, isContainerPositioned, margins, padding, overlayHeight, heightGrowthDirection, containerDimensions, isContainerDescendentOfBoundary, visualViewport) {
    // For cases where position is set via "bottom" instead of "top", we need to calculate the true overlay top
    // with respect to the container.
    let overlayTop = (position.top != null ? position.top : containerDimensions[$954926fb6168ae2a$var$TOTAL_SIZE.height] - (position.bottom ?? 0) - overlayHeight) - (containerDimensions.scroll.top ?? 0);
    // calculate the dimentions of the "boundingRect" which is most restrictive top/bottom of the boundaryRect and the visual view port
    let boundaryToContainerTransformOffset = isContainerDescendentOfBoundary ? containerOffsetWithBoundary.top : 0;
    let boundingRect = {
        // This should be boundary top in container coord system vs viewport top in container coord system
        // For the viewport top, there are several cases
        // 1. pinchzoom case where we want the viewports offset top as top here
        // 2. case where container is offset from the boundary and is contained by the boundary. In this case the top we want here is NOT 0, we want to take boundary's top even though is is a negative number OR the visual viewport, whichever is more restrictive
        top: Math.max(boundaryDimensions.top + boundaryToContainerTransformOffset, (visualViewport?.offsetTop ?? boundaryDimensions.top) + boundaryToContainerTransformOffset),
        bottom: Math.min(boundaryDimensions.top + boundaryDimensions.height + boundaryToContainerTransformOffset, (visualViewport?.offsetTop ?? 0) + (visualViewport?.height ?? 0))
    };
    let maxHeight = heightGrowthDirection !== 'top' ? Math.max(0, boundingRect.bottom - // this is the bottom of the boundary
    overlayTop - // this is the top of the overlay
    ((margins.top ?? 0) + (margins.bottom ?? 0) + padding // save additional space for margin and padding
    )) : Math.max(0, overlayTop + overlayHeight - // this is the bottom of the overlay
    boundingRect.top - // this is the top of the boundary
    ((margins.top ?? 0) + (margins.bottom ?? 0) + padding // save additional space for margin and padding
    ));
    return maxHeight;
}
function $954926fb6168ae2a$var$getAvailableSpace(boundaryDimensions, containerOffsetWithBoundary, childOffset, margins, padding, placementInfo, containerDimensions, isContainerDescendentOfBoundary) {
    let { placement: placement, axis: axis, size: size } = placementInfo;
    if (placement === axis) return Math.max(0, childOffset[axis] - // trigger start
    (containerDimensions.scroll[axis] ?? 0) - // transform trigger position to be with respect to viewport 0,0
    (boundaryDimensions[axis] + (isContainerDescendentOfBoundary ? containerOffsetWithBoundary[axis] : 0)) - // boundary start
    (margins[axis] ?? 0) - // margins usually for arrows or other decorations
    margins[$954926fb6168ae2a$var$FLIPPED_DIRECTION[axis]] - padding); // padding between overlay and boundary
    return Math.max(0, boundaryDimensions[size] + boundaryDimensions[axis] + (isContainerDescendentOfBoundary ? containerOffsetWithBoundary[axis] : 0) - childOffset[axis] - childOffset[size] + (containerDimensions.scroll[axis] ?? 0) - (margins[axis] ?? 0) - margins[$954926fb6168ae2a$var$FLIPPED_DIRECTION[axis]] - padding);
}
function $954926fb6168ae2a$export$6839422d1f33cee9(placementInput, childOffset, overlaySize, scrollSize, margins, padding, flip, boundaryDimensions, containerDimensions, containerOffsetWithBoundary, offset, crossOffset, isContainerPositioned, userSetMaxHeight, arrowSize, arrowBoundaryOffset, isContainerDescendentOfBoundary, visualViewport) {
    let placementInfo = $954926fb6168ae2a$var$parsePlacement(placementInput);
    let { size: size, crossAxis: crossAxis, crossSize: crossSize, placement: placement, crossPlacement: crossPlacement } = placementInfo;
    let position = $954926fb6168ae2a$var$computePosition(childOffset, boundaryDimensions, overlaySize, placementInfo, offset, crossOffset, containerOffsetWithBoundary, isContainerPositioned, arrowSize, arrowBoundaryOffset, containerDimensions);
    let normalizedOffset = offset;
    let space = $954926fb6168ae2a$var$getAvailableSpace(boundaryDimensions, containerOffsetWithBoundary, childOffset, margins, padding + offset, placementInfo, containerDimensions, isContainerDescendentOfBoundary);
    // Check if the scroll size of the overlay is greater than the available space to determine if we need to flip
    if (flip && overlaySize[size] > space) {
        let flippedPlacementInfo = $954926fb6168ae2a$var$parsePlacement(`${$954926fb6168ae2a$var$FLIPPED_DIRECTION[placement]} ${crossPlacement}`);
        let flippedPosition = $954926fb6168ae2a$var$computePosition(childOffset, boundaryDimensions, overlaySize, flippedPlacementInfo, offset, crossOffset, containerOffsetWithBoundary, isContainerPositioned, arrowSize, arrowBoundaryOffset, containerDimensions);
        let flippedSpace = $954926fb6168ae2a$var$getAvailableSpace(boundaryDimensions, containerOffsetWithBoundary, childOffset, margins, padding + offset, flippedPlacementInfo, containerDimensions, isContainerDescendentOfBoundary);
        // If the available space for the flipped position is greater than the original available space, flip.
        if (flippedSpace > space) {
            placementInfo = flippedPlacementInfo;
            position = flippedPosition;
            normalizedOffset = offset;
        }
    }
    // Determine the direction the height of the overlay can grow so that we can choose how to calculate the max height
    let heightGrowthDirection = 'bottom';
    if (placementInfo.axis === 'top') {
        if (placementInfo.placement === 'top') heightGrowthDirection = 'top';
        else if (placementInfo.placement === 'bottom') heightGrowthDirection = 'bottom';
    } else if (placementInfo.crossAxis === 'top') {
        if (placementInfo.crossPlacement === 'top') heightGrowthDirection = 'bottom';
        else if (placementInfo.crossPlacement === 'bottom') heightGrowthDirection = 'top';
    }
    let delta = $954926fb6168ae2a$var$getDelta(crossAxis, position[crossAxis], overlaySize[crossSize], boundaryDimensions, containerDimensions, padding, containerOffsetWithBoundary);
    position[crossAxis] += delta;
    let maxHeight = $954926fb6168ae2a$var$getMaxHeight(position, boundaryDimensions, containerOffsetWithBoundary, isContainerPositioned, margins, padding, overlaySize.height, heightGrowthDirection, containerDimensions, isContainerDescendentOfBoundary, visualViewport);
    if (userSetMaxHeight && userSetMaxHeight < maxHeight) maxHeight = userSetMaxHeight;
    overlaySize.height = Math.min(overlaySize.height, maxHeight);
    position = $954926fb6168ae2a$var$computePosition(childOffset, boundaryDimensions, overlaySize, placementInfo, normalizedOffset, crossOffset, containerOffsetWithBoundary, isContainerPositioned, arrowSize, arrowBoundaryOffset, containerDimensions);
    delta = $954926fb6168ae2a$var$getDelta(crossAxis, position[crossAxis], overlaySize[crossSize], boundaryDimensions, containerDimensions, padding, containerOffsetWithBoundary);
    position[crossAxis] += delta;
    let arrowPosition = {};
    // All values are transformed so that 0 is at the top/left of the overlay depending on the orientation
    // Prefer the arrow being in the center of the trigger/overlay anchor element
    // childOffset[crossAxis] + .5 * childOffset[crossSize] = absolute position with respect to the trigger's coordinate system that would place the arrow in the center of the trigger
    // position[crossAxis] - margins[AXIS[crossAxis]] = value use to transform the position to a value with respect to the overlay's coordinate system. A child element's (aka arrow) position absolute's "0"
    // is positioned after the margin of its parent (aka overlay) so we need to subtract it to get the proper coordinate transform
    let origin = childOffset[crossAxis] - position[crossAxis] - margins[$954926fb6168ae2a$var$AXIS[crossAxis]];
    let preferredArrowPosition = origin + 0.5 * childOffset[crossSize];
    // Min/Max position limits for the arrow with respect to the overlay
    const arrowMinPosition = arrowSize / 2 + arrowBoundaryOffset;
    // overlaySize[crossSize] - margins = true size of the overlay
    const overlayMargin = $954926fb6168ae2a$var$AXIS[crossAxis] === 'left' ? (margins.left ?? 0) + (margins.right ?? 0) : (margins.top ?? 0) + (margins.bottom ?? 0);
    const arrowMaxPosition = overlaySize[crossSize] - overlayMargin - arrowSize / 2 - arrowBoundaryOffset;
    // Min/Max position limits for the arrow with respect to the trigger/overlay anchor element
    // Same margin accomodation done here as well as for the preferredArrowPosition
    const arrowOverlappingChildMinEdge = childOffset[crossAxis] + arrowSize / 2 - (position[crossAxis] + margins[$954926fb6168ae2a$var$AXIS[crossAxis]]);
    const arrowOverlappingChildMaxEdge = childOffset[crossAxis] + childOffset[crossSize] - arrowSize / 2 - (position[crossAxis] + margins[$954926fb6168ae2a$var$AXIS[crossAxis]]);
    // Clamp the arrow positioning so that it always is within the bounds of the anchor and the overlay
    const arrowPositionOverlappingChild = (0, $c49fX$clamp)(preferredArrowPosition, arrowOverlappingChildMinEdge, arrowOverlappingChildMaxEdge);
    arrowPosition[crossAxis] = (0, $c49fX$clamp)(arrowPositionOverlappingChild, arrowMinPosition, arrowMaxPosition);
    // If there is an arrow, use that as the origin so that animations are smooth.
    // Otherwise use the target edge.
    ({ placement: placement, crossPlacement: crossPlacement } = placementInfo);
    if (arrowSize) origin = arrowPosition[crossAxis];
    else if (crossPlacement === 'right') origin += childOffset[crossSize];
    else if (crossPlacement === 'center') origin += childOffset[crossSize] / 2;
    let crossOrigin = placement === 'left' || placement === 'top' ? overlaySize[size] : 0;
    let triggerAnchorPoint = {
        x: placement === 'top' || placement === 'bottom' ? origin : crossOrigin,
        y: placement === 'left' || placement === 'right' ? origin : crossOrigin
    };
    return {
        position: position,
        maxHeight: maxHeight,
        arrowOffsetLeft: arrowPosition.left,
        arrowOffsetTop: arrowPosition.top,
        placement: placement,
        triggerAnchorPoint: triggerAnchorPoint
    };
}
function $954926fb6168ae2a$export$b3ceb0cbf1056d98(opts) {
    let { placement: placement, targetNode: targetNode, overlayNode: overlayNode, scrollNode: scrollNode, padding: padding, shouldFlip: shouldFlip, boundaryElement: boundaryElement, offset: offset, crossOffset: crossOffset, maxHeight: maxHeight, arrowSize: arrowSize = 0, arrowBoundaryOffset: arrowBoundaryOffset = 0 } = opts;
    let visualViewport = $954926fb6168ae2a$var$getVisualViewport();
    let container = overlayNode instanceof HTMLElement ? $954926fb6168ae2a$var$getContainingBlock(overlayNode) : document.documentElement;
    let isViewportContainer = container === document.documentElement;
    const containerPositionStyle = window.getComputedStyle(container).position;
    let isContainerPositioned = !!containerPositionStyle && containerPositionStyle !== 'static';
    let childOffset = isViewportContainer ? $954926fb6168ae2a$var$getOffset(targetNode, false) : $954926fb6168ae2a$var$getPosition(targetNode, container, false);
    if (!isViewportContainer) {
        let { marginTop: marginTop, marginLeft: marginLeft } = window.getComputedStyle(targetNode);
        childOffset.top += parseInt(marginTop, 10) || 0;
        childOffset.left += parseInt(marginLeft, 10) || 0;
    }
    let overlaySize = $954926fb6168ae2a$var$getOffset(overlayNode, true);
    let margins = $954926fb6168ae2a$var$getMargins(overlayNode);
    overlaySize.width += (margins.left ?? 0) + (margins.right ?? 0);
    overlaySize.height += (margins.top ?? 0) + (margins.bottom ?? 0);
    let scrollSize = $954926fb6168ae2a$var$getScroll(scrollNode);
    // Note that due to logic inside getContainerDimensions, for cases where the boundary element is the body, we will return
    // a height/width that matches the visual viewport size rather than the body's height/width (aka for zoom it will be zoom adjusted size)
    // and a top/left that is adjusted as well (will return the top/left of the zoomed in viewport, or 0,0 for a non-zoomed body)
    // Otherwise this returns the height/width of a arbitrary boundary element, and its top/left with respect to the viewport (NOTE THIS MEANS IT DOESNT INCLUDE SCROLL)
    let boundaryDimensions = $954926fb6168ae2a$var$getContainerDimensions(boundaryElement, visualViewport);
    let containerDimensions = $954926fb6168ae2a$var$getContainerDimensions(container, visualViewport);
    // There are several difference cases of how to calculate the containerOffsetWithBoundary:
    // - boundaryElement is body or HTML and the container is an arbitrary element in the boundary (aka submenu with parent menu as container in v3)
    // - boundaryElement and container are both body or HTML element (aka standard popover case)
    // - boundaryElement is customized by the user. Container can also be arbitrary (either body/HTML or some other element)
    // containerOffsetWithBoundary should always return a value that is the boundary's coordinate offset with respect to the container coord system (container is 0, 0)
    let containerOffsetWithBoundary;
    if ((boundaryElement.tagName === 'BODY' || boundaryElement.tagName === 'HTML') && !isViewportContainer) {
        // Use getRect instead of getOffset because boundaryDimensions for BODY/HTML is in viewport coordinate space,
        // not document coordinate space
        let containerRect = $954926fb6168ae2a$export$4b834cebd9e5cebe(container, false);
        // the offset should be negative because if container is at viewport position x,y, then viewport top (aka 0)
        // is at position -x,y in container-relative coordinates
        containerOffsetWithBoundary = {
            top: -(containerRect.top - boundaryDimensions.top),
            left: -(containerRect.left - boundaryDimensions.left),
            width: 0,
            height: 0
        };
    } else if ((boundaryElement.tagName === 'BODY' || boundaryElement.tagName === 'HTML') && isViewportContainer) // both are the same viewport container, no offset needed
    containerOffsetWithBoundary = {
        top: 0,
        left: 0,
        width: 0,
        height: 0
    };
    else // This returns the boundary's coordinate with respect to the container. This case captures cases such as when you provide a custom boundary
    // like in ScrollingBoundaryContainerExample in Popover.stories.
    containerOffsetWithBoundary = $954926fb6168ae2a$var$getPosition(boundaryElement, container, false);
    let isContainerDescendentOfBoundary = (0, $23f2114a1b82827e$export$4282f70798064fe0)(boundaryElement, container);
    return $954926fb6168ae2a$export$6839422d1f33cee9(placement, childOffset, overlaySize, scrollSize, margins, padding, shouldFlip, boundaryDimensions, containerDimensions, containerOffsetWithBoundary, offset, crossOffset, isContainerPositioned, maxHeight, arrowSize, arrowBoundaryOffset, isContainerDescendentOfBoundary, visualViewport);
}
function $954926fb6168ae2a$export$4b834cebd9e5cebe(node, ignoreScale) {
    let { top: top, left: left, width: width, height: height } = node.getBoundingClientRect();
    // Use offsetWidth and offsetHeight if this is an HTML element, so that
    // the size is not affected by scale transforms.
    if (ignoreScale && node instanceof node.ownerDocument.defaultView.HTMLElement) {
        width = node.offsetWidth;
        height = node.offsetHeight;
    }
    return {
        top: top,
        left: left,
        width: width,
        height: height
    };
}
function $954926fb6168ae2a$var$getOffset(node, ignoreScale) {
    let { top: top, left: left, width: width, height: height } = $954926fb6168ae2a$export$4b834cebd9e5cebe(node, ignoreScale);
    let { scrollTop: scrollTop, scrollLeft: scrollLeft, clientTop: clientTop, clientLeft: clientLeft } = document.documentElement;
    return {
        top: top + scrollTop - clientTop,
        left: left + scrollLeft - clientLeft,
        width: width,
        height: height
    };
}
function $954926fb6168ae2a$var$getPosition(node, parent, ignoreScale) {
    let style = window.getComputedStyle(node);
    let offset;
    if (style.position === 'fixed') offset = $954926fb6168ae2a$export$4b834cebd9e5cebe(node, ignoreScale);
    else {
        offset = $954926fb6168ae2a$var$getOffset(node, ignoreScale);
        let parentOffset = $954926fb6168ae2a$var$getOffset(parent, ignoreScale);
        let parentStyle = window.getComputedStyle(parent);
        parentOffset.top += (parseInt(parentStyle.borderTopWidth, 10) || 0) - parent.scrollTop;
        parentOffset.left += (parseInt(parentStyle.borderLeftWidth, 10) || 0) - parent.scrollLeft;
        offset.top -= parentOffset.top;
        offset.left -= parentOffset.left;
    }
    offset.top -= parseInt(style.marginTop, 10) || 0;
    offset.left -= parseInt(style.marginLeft, 10) || 0;
    return offset;
}
// Returns the containing block of an element, which is the element that
// this element will be positioned relative to.
// https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block
function $954926fb6168ae2a$var$getContainingBlock(node) {
    // The offsetParent of an element in most cases equals the containing block.
    // https://w3c.github.io/csswg-drafts/cssom-view/#dom-htmlelement-offsetparent
    let offsetParent = node.offsetParent;
    // The offsetParent algorithm terminates at the document body,
    // even if the body is not a containing block. Double check that
    // and use the documentElement if so.
    if (offsetParent && offsetParent === document.body && window.getComputedStyle(offsetParent).position === 'static' && !$954926fb6168ae2a$var$isContainingBlock(offsetParent)) offsetParent = document.documentElement;
    // TODO(later): handle table elements?
    // The offsetParent can be null if the element has position: fixed, or a few other cases.
    // We have to walk up the tree manually in this case because fixed positioned elements
    // are still positioned relative to their containing block, which is not always the viewport.
    if (offsetParent == null) {
        offsetParent = node.parentElement;
        while(offsetParent && !$954926fb6168ae2a$var$isContainingBlock(offsetParent))offsetParent = offsetParent.parentElement;
    }
    // Fall back to the viewport.
    return offsetParent || document.documentElement;
}
// https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block
function $954926fb6168ae2a$var$isContainingBlock(node) {
    let style = window.getComputedStyle(node);
    return style.transform !== 'none' || /transform|perspective/.test(style.willChange) || style.filter !== 'none' || style.contain === 'paint' || 'backdropFilter' in style && style.backdropFilter !== 'none' || 'WebkitBackdropFilter' in style && style.WebkitBackdropFilter !== 'none';
}


export {$954926fb6168ae2a$export$6839422d1f33cee9 as calculatePositionInternal, $954926fb6168ae2a$export$b3ceb0cbf1056d98 as calculatePosition, $954926fb6168ae2a$export$4b834cebd9e5cebe as getRect};
//# sourceMappingURL=calculatePosition.mjs.map
