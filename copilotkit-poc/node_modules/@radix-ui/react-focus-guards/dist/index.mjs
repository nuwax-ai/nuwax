"use client";

// src/focus-guards.tsx
import * as React from "react";
var count = 0;
var guards = null;
function FocusGuards(props) {
  useFocusGuards();
  return props.children;
}
function useFocusGuards() {
  React.useEffect(() => {
    if (!guards) {
      guards = { start: createFocusGuard(), end: createFocusGuard() };
    }
    const { start, end } = guards;
    if (document.body.firstElementChild !== start) {
      document.body.insertAdjacentElement("afterbegin", start);
    }
    if (document.body.lastElementChild !== end) {
      document.body.insertAdjacentElement("beforeend", end);
    }
    count++;
    return () => {
      if (count === 1) {
        guards?.start.remove();
        guards?.end.remove();
        guards = null;
      }
      count = Math.max(0, count - 1);
    };
  }, []);
}
function createFocusGuard() {
  const element = document.createElement("span");
  element.setAttribute("data-radix-focus-guard", "");
  element.tabIndex = 0;
  element.style.outline = "none";
  element.style.opacity = "0";
  element.style.position = "fixed";
  element.style.pointerEvents = "none";
  return element;
}
export {
  FocusGuards,
  FocusGuards as Root,
  useFocusGuards
};
//# sourceMappingURL=index.mjs.map
