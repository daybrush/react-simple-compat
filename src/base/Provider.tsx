import { find, getValues, IObject, isString } from "@daybrush/utils";
import { Component } from "./Component";
import { CompatElement } from "../types";
import { flat } from "../utils";
import { renderProviders } from "../renderProviders";


let hooksIndex = 0;
let current: Provider | null = null;

export abstract class Provider<T extends Element | Component | Node = Element | Component | Node> {
    /**
     * Original
     */
    public o: CompatElement | string;
    /**
     * Base
     */
    public b: T;
    /**
     * providers
     */
    public _ps: Array<Provider<any>> = [];
    /**
     * Contexts
     */
    public _cs: Record<string, Component> = {};

    constructor(
        /**
         * Type
         */
        public t: any,
        /**
         * Depth
         */
        public d: number,
        /**
         * Key
         */
        public k: string,
        /**
         * index
         */
        public i: number,
        /**
         * Container
         */
        public c?: Provider | null,
        /**
         * Ref
         */
        public ref?: ((e: Element | Component | Node | null) => any) | null,
        /**
         * Props
         */
        public ps: IObject<any> = {},
    ) { }
    /**
     * Render
     */
    public abstract r(hooks: Function[], contextValues: Record<string, Component>, prevProps: any, nextState?: any);
    /**
     * Unmount
     */
    public abstract un();

    /**
     * Should update
     */
    public s(nextProps: any, nextState: any): boolean;
    public s() {
        return true;
    }
    /**
     * Update
     */
    public u(
        hooks: Function[],
        contexts: Record<string, Component>,
        nextElement: CompatElement | string,
        nextState?: any,
        isForceUpdate?: boolean,
    ) {
        const self = this;
        const currentDepth = self.d;
        const scheduledContexts = getValues(contexts).filter(context => {
            return context.$_req;
        });
        const scheduledSubs = flat(scheduledContexts.map(context => context.$_subs)) as Provider[];
        const isContextUpdate = find(scheduledSubs, provider => {
            return provider.d === currentDepth;
        });
        if (
            self.b
            && !isString(nextElement)
            && !isForceUpdate
            && !self.s(nextElement.props, nextState)
            && !isContextUpdate
        ) {
            const nextChildSubs = scheduledSubs.reduce((childs, sub) => {
                const depth = sub.d;

                if (childs[0]) {
                    if (childs[0].d === depth) {
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
                // { ...self.state, ...self.$_state },
                // isForceUpdate,
                renderProviders(
                    child,
                    child._ps,
                    [child.o],
                    hooks,
                    contexts,
                    true,
                );
            })

            return false;
        }
        self.o = nextElement;
        self.ss(nextState);
        // render
        const prevProps = self.ps;

        if (!isString(nextElement)) {
            self.ps = nextElement.props;
            self.ref = nextElement.ref;
        }

        setCurrentInstance(this);
        self.r(hooks, contexts, self.b ? prevProps : {}, nextState);
        return true;
    }
    public md() {
        const ref = this.ref;
        ref && ref(this.b);
    }

    public ss(nextstate: IObject<any>);
    public ss() {
        return;
    }
    public ud() {
        const ref = this.ref;
        ref && ref(this.b);
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
