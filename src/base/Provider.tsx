import { find, getValues, IObject, isString } from "@daybrush/utils";
import { Component } from "./Component";
import { CompatElement } from "../types";
import { flat } from "../utils";
import { renderProviders } from "../renderProviders";


let hooksIndex = 0;
let current: Provider | null = null;

export abstract class Provider<T extends Element | Component | Node = Element | Component | Node> {
    public original: CompatElement | string;
    public base: T;
    /**
     * providers
     */
    public _ps: Array<Provider<any>> = [];
    /**
     * Contexts
     */
    public _cs: Record<string, Component> = {};

    constructor(
        public type: any,
        public depth: number,
        public key: string,
        public index: number,
        public container?: Provider | null,
        public ref?: ((e: Element | Component | Node | null) => any) | null,
        public props: IObject<any> = {},
    ) { }
    public abstract _render(hooks: Function[], contextValues: Record<string, Component>, prevProps: any, nextState?: any);
    public abstract _unmount();

    public _should(nextProps: any, nextState: any): boolean;
    public _should() {
        return true;
    }
    public _update(
        hooks: Function[],
        contexts: Record<string, Component>,
        nextElement: CompatElement | string,
        nextState?: any,
        isForceUpdate?: boolean,
    ) {
        const currentDepth = this.depth;
        const scheduledContexts = getValues(contexts).filter(context => {
            return context.$_req;
        });
        const scheduledSubs = flat(scheduledContexts.map(context => context.$_subs)) as Provider[];
        const isContextUpdate = find(scheduledSubs, provider => {
            return provider.depth === currentDepth;
        });
        if (
            this.base
            && !isString(nextElement)
            && !isForceUpdate
            && !this._should(nextElement.props, nextState)
            && !isContextUpdate
        ) {
            const nextChildSubs = scheduledSubs.reduce((childs, sub) => {
                const depth = sub.depth;

                if (childs[0]) {
                    if (childs[0].depth === depth) {
                        childs.push(sub);
                    }
                } else if (depth > currentDepth) {
                    childs.push(sub);
                }
                return childs;
            }, [] as Provider[]);

            nextChildSubs.forEach(child => {
                // provider.container!,
                // [provider],
                // [provider.original],
                // hooks,
                // provider._cs,
                // { ...this.state, ...this.$_state },
                // isForceUpdate,
                renderProviders(
                    child,
                    child._ps,
                    [child.original],
                    hooks,
                    contexts,
                    true,
                );
            })

            return false;
        }
        this.original = nextElement;
        this._setState(nextState);
        // render
        const prevProps = this.props;

        if (!isString(nextElement)) {
            this.props = nextElement.props;
            this.ref = nextElement.ref;
        }

        setCurrentInstance(this);
        this._render(hooks, contexts, this.base ? prevProps : {}, nextState);
        return true;
    }
    public _mounted() {
        const ref = this.ref;
        ref && ref(this.base);
    }

    public _setState(nextstate: IObject<any>);
    public _setState() {
        return;
    }
    public _updated() {
        const ref = this.ref;
        ref && ref(this.base);
    }
}


export function getCurrentInstance() {
    return current;
}
export function getHooksIndex() {
    return hooksIndex;
}
export function setHooksInex(nextHooksIndex: number) {
    hooksIndex = nextHooksIndex;
}
export function setCurrentInstance(provider: Provider | null) {
    current = provider;
    hooksIndex = 0;
}
