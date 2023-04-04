import { decamelize, getEntries, isFunction, isNumber, isString } from "@daybrush/utils";
import { Component } from "./base/Component";
import { createComponent } from "./base/ComponentProvider";
import { setCurrentInstance } from "./base/Provider";
import { HooksProvider } from "./hooks/hooks";
import { CompatElement, Context } from "./types";

function _renderToString(node: CompatElement | string | null, parentContexts: Record<string, Component>, self: true): {
    tagName: string;
    attrs: Record<string, any>;
    children: string;
}
function _renderToString(node: CompatElement | string | null, parentContexts: Record<string, Component>, self?: boolean): string;
function _renderToString(node: CompatElement | string | null, parentContexts: Record<string, Component>, self?: boolean): any {
    if (node == null) {
        return "";
    }
    if (isString(node) || isNumber(node) || isFunction(node)) {
        return node;
    }
    const { type, props } = node;

    if (isString(type)) {
        const stringProps: Record<string, string> = {};

        getEntries(props).forEach(([name, value]) => {
            if (name === "style") {
                stringProps[name] = getEntries(value).map(([styleName, styleValue]) => {
                    return `${decamelize(styleName)}: ${styleValue};`;
                }).join("");
            } else if (name === "children") {
                return;
            } else if (!name.match(/^on[^a-z]/g)) {
                stringProps[name] = `${value}`;
            }
        });

        const children = props.children.map(child => {
            return _renderToString(child, parentContexts);
        }).join("");
        if (self) {
            return {
                tagName: type,
                props: stringProps,
                children,
            };
        }
        const strings: string[] = [
            type,
            ...getEntries(stringProps).map(([name, value]) => `${name}="${value.replace(/"/g, `\\"`)}"`),
        ];
        return `<${strings.join(" ")}>${children}</${type}>`;
    } else if (isFunction(type)) {
        const contextType: Context = (type as any).contextType;
        const provider: HooksProvider = {
            b: null,
            _hs: [],
            _usefs: [],
            _uefs: [],
            _defs: [],
            _cs: parentContexts,
        };
        setCurrentInstance(provider);
        const contextValue = contextType?.get(provider);
        const base = createComponent(type, props, contextValue, {})
        const nextContexts = { ...parentContexts, ...base.$_cs };

        provider.b = base;
        return _renderToString(base.render(), nextContexts, self);
    }
    return "";
}

export function renderToString(node: CompatElement | string) {
    return _renderToString(node, {});
}
export function renderSelfToString(node: CompatElement) {
    return _renderToString(node, {}, true);
}
