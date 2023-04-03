import { flat } from "@daybrush/utils";
import { Component } from "./base/Component";
import { ComponentProvider } from "./base/ComponentProvider";
import { Provider } from "./base/Provider";
import { CompatElement } from "./types";

export function findDOMNode(comp: Component | Node | null): Node | null {
    if (!comp || comp instanceof Node) {
        return comp as Node | null;
    }
    const providers = comp.$_p._ps;

    if (!providers.length) {
        return null;
    }
    return findDOMNode(providers[0].b);
}

export function findNodeProvider(provider: Provider<Node | Component | Element>): Provider<Node | Element> | null {
    if (!provider) {
        return;
    }
    if (provider.b && provider.b instanceof Node) {
        return provider as Provider<Node | Element>;
    }
    const providers = provider._ps;

    if (!providers.length) {
        return null;
    }
    return findNodeProvider(providers[0]);
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
