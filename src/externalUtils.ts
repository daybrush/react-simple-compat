import { flat } from "@daybrush/utils";
import { Component } from "./base/Component";
import { CompatElement } from "./types";

export function findDOMNode(comp: Component | Node | null): Node | null {
    if (!comp || comp instanceof Node) {
        return comp as Node | null;
    }
    const providers = comp.$_p._ps;

    if (!providers.length) {
        return null;
    }
    return findDOMNode(providers[0].base);
}


export function createElement(
    type: any,
    props: any,
    ...children: any[]
): CompatElement {
    const { key, ref, ...otherProps } = props || {};

    return {
        type,
        key,
        ref,
        props: { ...otherProps, children: flat(children).filter(child => child != null && child !== false) },
    };
}
