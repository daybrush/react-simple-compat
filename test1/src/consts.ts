import { MoveableEvents, MoveableOptions } from "./types";

export const PROPERTIES: Array<keyof MoveableOptions> = [
    "draggable", "resizable", "scalable", "rotatable",
    "warpable", "pinchable", "snappable", "origin", "target", "edge",
    "throttleDrag", "throttleResize",
    "throttleScale", "throttleRotate", "keepRatio",
    "dragArea",
    "pinchThreshold",
    "snapCenter", "snapThreshold",
    "horizontalGuidelines", "verticalGuidelines", "elementGuidelines",
    "bounds",

    "className",
    "renderDirections",
    "scrollable",
    "getScrollPosition",
    "scrollContainer",
    "scrollThreshold",
    "baseDirection",
    "snapElement",
    "snapVertical",
    "snapHorizontal",
];
export const EVENTS: Array<keyof MoveableEvents> = [
    "dragStart",
    "drag",
    "dragEnd",
    "resizeStart",
    "resize",
    "resizeEnd",
    "scaleStart",
    "scale",
    "scaleEnd",
    "rotateStart",
    "rotate",
    "rotateEnd",
    "warpStart",
    "warp",
    "warpEnd",
    "pinchStart",
    "pinch",
    "pinchEnd",
    "dragGroupStart",
    "dragGroup",
    "dragGroupEnd",
    "resizeGroupStart",
    "resizeGroup",
    "resizeGroupEnd",
    "scaleGroupStart",
    "scaleGroup",
    "scaleGroupEnd",
    "rotateGroupStart",
    "rotateGroup",
    "rotateGroupEnd",
    "pinchGroupStart",
    "pinchGroup",
    "pinchGroupEnd",
    "clickGroup",

    "scroll",
    "scrollGroup",

    "renderStart",
    "render",
    "renderEnd",
    "renderGroupStart",
    "renderGroup",
    "renderGroupEnd",
];
