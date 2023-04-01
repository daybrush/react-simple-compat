import { isString, isNumber } from "@daybrush/utils";
import { diff } from "@egjs/list-differ";
import { Component } from "./base/Component";
import { ComponentProvider } from "./base/ComponentProvider";
import { ElementProvider } from "./base/ElementProvider";
import { Provider, setCurrentInstance } from "./base/Provider";
import { findDOMNode } from "./externalUtils";
import { ContainerProvider, diffProviders, TextProvider } from "./providers";
import { CompatElement } from "./types";
import { executeHooks, findContainerNode } from "./utils";


function getNextSibiling(
    provider: Provider,
    childProvider: Provider,
) {
    const childProviders = provider._ps;
    const length = childProviders.length;

    for (let i = childProvider.i + 1; i < length; ++i) {
        const el = findDOMNode(childProviders[i].b);

        if (el) {
            return el;
        }
    }
    return null;
}


export function createProvider(el: CompatElement | string, key: string, index: number, containerProvider: Provider) {
    const depth = containerProvider.d + 1;

    if (isString(el) || isNumber(el)) {
        return new TextProvider(`text_${el}`, depth, key, index, containerProvider, null, {});
    }
    const type = el.type;
    const providerClass = typeof type === "string" ? ElementProvider : ComponentProvider;

    return new providerClass(
        type,
        depth,
        key,
        index,
        containerProvider,
        el.ref,
        el.props,
    );
}


export function renderProviders(
    containerProvider: Provider,
    providers: Provider[],
    children: Array<CompatElement | string>,
    updatedHooks: Function[],
    nextContexts: Record<string, Component>,
    nextState?: any,
    isForceUpdate?: boolean,
) {
    const result = diffProviders(containerProvider, providers, children);
    const updated = providers.filter((childProvider, i) => {
        return childProvider.u(updatedHooks, nextContexts, children[i], nextState, isForceUpdate);
    });
    const containerNode = findContainerNode(containerProvider);

    if (containerNode) {
        result.reverse().forEach(index => {
            const childProvider = providers[index];
            const el = findDOMNode(childProvider.b);

            if (!el) {
                return;
            }
            if (containerNode !== el && !el.parentNode) {
                const nextElement = getNextSibiling(containerProvider, childProvider);
                containerNode.insertBefore(el, nextElement);
            }
        });
    }
    return updated.length > 0;
}

export function renderProvider(
    element: any,
    container: Element,
    provider: Provider | null = (container as any).__CROACT_,
    contexts: Record<string, Component> = {},
) {
    const isProvider = !!provider;

    if (!provider) {
        provider = new ContainerProvider(container, 0);
    }
    const hooks: Function[] = [];

    renderProviders(
        provider,
        provider._ps,
        element ? [element] : [],
        hooks,
        contexts,
    );

    executeHooks(hooks);
    setCurrentInstance(null);

    if (!isProvider) {
        (container as any).__CROACT_ = provider;
    }
    return provider;
}

export function render(element: any, container: Element, callback?: Function) {
    const provider = (container as any).__CROACT_;
    if (element && !provider) {
        container.innerHTML = "";
    }
    renderProvider(element, container, provider);
    callback && callback();
}
